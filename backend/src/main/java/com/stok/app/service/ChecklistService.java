package com.stok.app.service;

import com.stok.app.dto.request.ChecklistRequest;
import com.stok.app.dto.response.ChecklistResponse;
import com.stok.app.entity.ChecklistPatient;
import com.stok.app.entity.ChecklistRecord;
import com.stok.app.entity.User;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.ChecklistRecordRepository;
import com.stok.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Checklist Service - Business logic for checklist management
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ChecklistService {

        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChecklistService.class);

        private final ChecklistRecordRepository checklistRecordRepository;
        private final UserRepository userRepository;
        private final HistoryService historyService;

        public List<ChecklistResponse> getAllChecklists(UUID userId) {
                log.debug("Getting all checklists for user: {}", userId);
                return checklistRecordRepository.findByUserIdOrderByCreatedDateDesc(userId).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public ChecklistResponse getActiveChecklist(UUID userId) {
                log.debug("Getting active checklist for user: {}", userId);
                return checklistRecordRepository.findByIsCompletedFalseAndUserId(userId)
                                .map(this::mapToResponse)
                                .orElse(null);
        }

        public ChecklistResponse createChecklist(ChecklistRequest request, UUID userId) {
                log.debug("Creating checklist for user: {}", userId);

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                ChecklistRecord checklist = new ChecklistRecord();
                checklist.setTitle(request.getTitle());
                checklist.setCreatedDate(LocalDateTime.now());
                checklist.setIsCompleted(false);
                checklist.setUser(user);

                // Add patients
                for (ChecklistRequest.PatientRequest patReq : request.getPatients()) {
                        ChecklistPatient patient = new ChecklistPatient();
                        patient.setName(patReq.getName());
                        patient.setNote(patReq.getNote());
                        patient.setPhone(patReq.getPhone());
                        patient.setCity(patReq.getCity());
                        patient.setHospital(patReq.getHospital());
                        patient.setAppointmentDate(parseDate(patReq.getDate()));
                        patient.setAppointmentTime(parseTime(patReq.getTime()));
                        patient.setChecked(patReq.getChecked() != null ? patReq.getChecked() : false);
                        checklist.addPatient(patient);
                }

                ChecklistRecord saved = checklistRecordRepository.save(checklist);

                // Add history record
                Map<String, Object> details = new HashMap<>();
                details.put("title", saved.getTitle());
                details.put("patientsCount", saved.getPatients().size());
                historyService.addHistory(
                                userId,
                                "checklist",
                                "Kontrol listesi oluşturuldu: " + saved.getTitle(),
                                details);

                log.info("Checklist created: {}", saved.getId());
                return mapToResponse(saved);
        }

        public ChecklistResponse updateChecklist(UUID id, UUID userId, ChecklistRequest request) {
                log.debug("Updating checklist: {}", id);

                ChecklistRecord checklist = checklistRecordRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Checklist not found"));

                if (!checklist.getUser().getId().equals(userId)) {
                        throw new IllegalArgumentException("Unauthorized access to checklist");
                }

                checklist.setTitle(request.getTitle());

                // Clear existing patients and add new ones
                checklist.getPatients().clear();
                for (ChecklistRequest.PatientRequest patReq : request.getPatients()) {
                        ChecklistPatient patient = new ChecklistPatient();
                        patient.setName(patReq.getName());
                        patient.setNote(patReq.getNote());
                        patient.setPhone(patReq.getPhone());
                        patient.setCity(patReq.getCity());
                        patient.setHospital(patReq.getHospital());
                        patient.setAppointmentDate(parseDate(patReq.getDate()));
                        patient.setAppointmentTime(parseTime(patReq.getTime()));
                        patient.setChecked(patReq.getChecked() != null ? patReq.getChecked() : false);
                        checklist.addPatient(patient);
                }

                ChecklistRecord updated = checklistRecordRepository.save(checklist);

                log.info("Checklist updated: {}", id);
                return mapToResponse(updated);
        }

        public ChecklistResponse completeChecklist(UUID id, UUID userId) {
                log.debug("Completing checklist: {}", id);

                ChecklistRecord checklist = checklistRecordRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Checklist not found"));

                if (!checklist.getUser().getId().equals(userId)) {
                        throw new IllegalArgumentException("Unauthorized access to checklist");
                }

                checklist.setIsCompleted(true);
                checklist.setCompletedDate(LocalDateTime.now());

                ChecklistRecord updated = checklistRecordRepository.save(checklist);

                // Add history record for completion
                long checkedCount = updated.getPatients().stream()
                                .filter(com.stok.app.entity.ChecklistPatient::getChecked)
                                .count();
                int totalCount = updated.getPatients().size();

                Map<String, Object> details = new HashMap<>();
                details.put("title", updated.getTitle());
                details.put("checkedCount", checkedCount);
                details.put("totalCount", totalCount);
                details.put("createdDate", updated.getCreatedDate().toString());
                details.put("completedDate", updated.getCompletedDate() != null ? updated.getCompletedDate().toString()
                                : LocalDateTime.now().toString());
                details.put("patients", updated.getPatients().stream()
                                .map(this::mapPatientToInfo)
                                .collect(Collectors.toList()));

                historyService.addHistory(
                                userId,
                                "checklist",
                                String.format("Kontrol listesi tamamlandı: %s (%d/%d hasta kontrol edildi)",
                                                updated.getTitle(), checkedCount, totalCount),
                                details);

                log.info("Checklist completed: {}", id);
                return mapToResponse(updated);
        }

        private ChecklistResponse.PatientInfo mapPatientToInfo(com.stok.app.entity.ChecklistPatient p) {
                return ChecklistResponse.PatientInfo.builder()
                                .id(p.getId())
                                .name(p.getName())
                                .note(p.getNote())
                                .phone(p.getPhone())
                                .city(p.getCity())
                                .hospital(p.getHospital())
                                .date(p.getAppointmentDate() != null ? p.getAppointmentDate().toString() : null)
                                .time(p.getAppointmentTime() != null ? p.getAppointmentTime().toString() : null)
                                .checked(p.getChecked())
                                .build();
        }

        private ChecklistResponse mapToResponse(ChecklistRecord checklist) {
                return ChecklistResponse.builder()
                                .id(checklist.getId())
                                .title(checklist.getTitle())
                                .createdDate(checklist.getCreatedDate())
                                .completedDate(checklist.getCompletedDate())
                                .isCompleted(checklist.getIsCompleted())
                                .patients(checklist.getPatients().stream()
                                                .map(this::mapPatientToInfo)
                                                .collect(Collectors.toList()))
                                .build();
        }

        private java.time.LocalDate parseDate(String dateStr) {
                if (dateStr == null || dateStr.isBlank())
                        return null;
                try {
                        return java.time.LocalDate.parse(dateStr);
                } catch (Exception e) {
                        log.warn("Failed to parse date: {}", dateStr);
                        return null;
                }
        }

        private java.time.LocalTime parseTime(String timeStr) {
                if (timeStr == null || timeStr.isBlank())
                        return null;
                try {
                        // Handle cases like "10:00:00" or "10:00"
                        if (timeStr.length() == 5) {
                                return java.time.LocalTime.parse(timeStr);
                        }
                        return java.time.LocalTime.parse(timeStr);
                } catch (Exception e) {
                        log.warn("Failed to parse time: {}", timeStr);
                        return null;
                }
        }
}
