package com.stok.app.service;

import com.stok.app.dto.request.CaseRecordRequest;
import com.stok.app.dto.response.CaseRecordResponse;
import com.stok.app.entity.CaseMaterial;
import com.stok.app.entity.CaseRecord;
import com.stok.app.entity.User;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.CaseRecordRepository;
import com.stok.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Case Service - Business logic for case management
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    private final CaseRecordRepository caseRecordRepository;
    private final UserRepository userRepository;
    private final HistoryService historyService;
    private final StockService stockService;

    public List<CaseRecordResponse> getAllCases(UUID userId) {
        log.debug("Getting all cases for user: {}", userId);
        return caseRecordRepository.findByUserIdOrderByCaseDateDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CaseRecordResponse getCaseById(UUID id, UUID userId) {
        log.debug("Getting case by id: {}", id);
        CaseRecord caseRecord = caseRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case record not found"));

        if (!caseRecord.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to case record");
        }

        return mapToResponse(caseRecord);
    }

    public CaseRecordResponse createCase(CaseRecordRequest request, UUID userId) {
        log.debug("Creating case for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CaseRecord caseRecord = new CaseRecord();
        caseRecord.setCaseDate(request.getCaseDate());
        caseRecord.setHospitalName(request.getHospitalName());
        caseRecord.setDoctorName(request.getDoctorName());
        caseRecord.setPatientName(request.getPatientName());
        caseRecord.setNotes(request.getNotes());
        caseRecord.setUser(user);

        // Add materials
        for (CaseRecordRequest.CaseMaterialRequest matReq : request.getMaterials()) {
            CaseMaterial material = new CaseMaterial();
            material.setMaterialName(matReq.getMaterialName());
            material.setSerialLotNumber(matReq.getSerialLotNumber());
            material.setUbbCode(matReq.getUbbCode());
            material.setQuantity(matReq.getQuantity());
            caseRecord.addMaterial(material);
        }

        CaseRecord saved = caseRecordRepository.save(caseRecord);

        // Add history record
        Map<String, Object> details = new HashMap<>();
        details.put("hospitalName", saved.getHospitalName());
        details.put("doctorName", saved.getDoctorName());
        details.put("patientName", saved.getPatientName());
        details.put("materialsCount", saved.getMaterials().size());
        historyService.addHistory(
                userId,
                "case",
                "Vaka kaydı oluşturuldu: " + saved.getPatientName() + " - " + saved.getHospitalName(),
                details);

        log.info("Case record created: {}", saved.getId());
        return mapToResponse(saved);
    }

    private CaseRecordResponse mapToResponse(CaseRecord caseRecord) {
        return CaseRecordResponse.builder()
                .id(caseRecord.getId())
                .caseDate(caseRecord.getCaseDate())
                .hospitalName(caseRecord.getHospitalName())
                .doctorName(caseRecord.getDoctorName())
                .patientName(caseRecord.getPatientName())
                .notes(caseRecord.getNotes())
                .materials(caseRecord.getMaterials().stream()
                        .map(m -> CaseRecordResponse.MaterialInfo.builder()
                                .id(m.getId())
                                .materialName(m.getMaterialName())
                                .serialLotNumber(m.getSerialLotNumber())
                                .ubbCode(m.getUbbCode())
                                .quantity(m.getQuantity())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(caseRecord.getCreatedAt())
                .build();
    }
}
