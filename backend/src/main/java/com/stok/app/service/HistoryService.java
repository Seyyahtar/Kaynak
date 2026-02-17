package com.stok.app.service;

import com.stok.app.entity.HistoryRecord;
import com.stok.app.entity.CaseRecord;
import com.stok.app.entity.User;
import com.stok.app.dto.response.HistoryRecordResponse;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.HistoryRecordRepository;
import com.stok.app.repository.UserRepository;
import com.stok.app.repository.CaseRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * History Service - Business logic for history records
 */
@Service
@Transactional
@RequiredArgsConstructor
public class HistoryService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HistoryService.class);

    private final HistoryRecordRepository historyRecordRepository;
    private final UserRepository userRepository;
    private final CaseRecordRepository caseRecordRepository;

    public List<HistoryRecordResponse> getAllHistory(UUID userId) {
        log.debug("Getting history for user: {}", userId != null ? userId : "ALL USERS");
        List<HistoryRecord> records;
        if (userId != null) {
            records = historyRecordRepository.findByUserIdOrderByRecordDateDesc(userId);
        } else {
            records = historyRecordRepository.findAllByOrderByRecordDateDesc();
        }
        return records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void addHistory(UUID userId, String type, String description, Map<String, Object> details) {
        log.debug("Adding history record for user: {}, type: {}", userId, type);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        HistoryRecord record = new HistoryRecord();
        record.setUser(user);
        record.setRecordDate(LocalDateTime.now());
        record.setType(type);
        record.setDescription(description);
        record.setDetailsJson(details);

        historyRecordRepository.save(record);
        log.info("History record added: {}", type);
    }

    public void deleteHistory(UUID id, UUID userId) {
        log.debug("Deleting history record: {}", id);

        HistoryRecord record = historyRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("History record not found"));

        if (!record.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to history record");
        }

        historyRecordRepository.delete(record);
        log.info("History record deleted: {}", id);
    }

    public void deleteAllHistory(UUID userId) {
        log.debug("Deleting all history for user: {}", userId);

        // As requested, deleting history also deletes all associated case records
        // Using repository directly to avoid circular dependency with CaseService
        List<CaseRecord> userCases = caseRecordRepository.findByUserId(userId);
        caseRecordRepository.deleteAll(userCases);

        List<HistoryRecord> userHistory = historyRecordRepository.findByUserIdOrderByRecordDateDesc(userId);
        historyRecordRepository.deleteAll(userHistory);
        log.info("All history records (and cases) deleted for user: {}", userId);
    }

    public void deleteMostRecentHistoryByTypeAndDescription(UUID userId, String type, String descriptionPart) {
        // Find most recent record matching criteria
        List<HistoryRecord> records = historyRecordRepository.findByUserIdOrderByRecordDateDesc(userId);

        for (HistoryRecord record : records) {
            if (record.getType().equals(type) && record.getDescription().contains(descriptionPart)) {
                log.info("Deleting outdated history record: {} - {}", record.getId(), record.getDescription());
                historyRecordRepository.delete(record);
                return; // Delete only the most recent one
            }
        }
    }

    public void deletePendingTransferRecord(UUID senderId, String receiverUsername) {
        List<HistoryRecord> records = historyRecordRepository.findByUserIdOrderByRecordDateDesc(senderId);

        for (HistoryRecord record : records) {
            // Check type and basic description
            if ("stock-remove".equals(record.getType()) &&
                    record.getDescription() != null &&
                    record.getDescription().startsWith("Stok transferi başlatıldı")) {

                // Safely check details for receiver username
                Map<String, Object> details = record.getDetailsJson();
                if (details != null) {
                    Object receiverObj = details.get("receiver");
                    if (receiverObj != null && receiverUsername.equals(receiverObj.toString())) {
                        log.info("Deleting pending transfer history record: {}", record.getId());
                        historyRecordRepository.delete(record);
                        return; // Delete only the most recent one
                    }
                }
            }
        }
    }

    private HistoryRecordResponse mapToResponse(HistoryRecord record) {
        return HistoryRecordResponse.builder()
                .id(record.getId())
                .recordDate(record.getRecordDate())
                .type(record.getType())
                .description(record.getDescription())
                .ownerName(record.getUser() != null ? record.getUser().getFullName() : "Unknown")
                .ownerId(record.getUser() != null ? record.getUser().getId() : null)
                .details(record.getDetailsJson())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
