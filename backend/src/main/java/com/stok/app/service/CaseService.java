package com.stok.app.service;

import com.stok.app.dto.request.CaseRecordRequest;
import com.stok.app.dto.response.CaseRecordResponse;
import com.stok.app.entity.CaseMaterial;
import com.stok.app.entity.CaseRecord;
import com.stok.app.entity.User;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.CaseRecordRepository;
import com.stok.app.repository.projection.ImplantExportRowProjection;
import com.stok.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
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
public class CaseService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CaseService.class);

    private final CaseRecordRepository caseRecordRepository;
    private final UserRepository userRepository;
    private final HistoryService historyService;
    private final StockService stockService;
    private static final java.time.format.DateTimeFormatter EXPORT_DATE_FORMATTER = java.time.format.DateTimeFormatter
            .ofPattern("dd.MM.yyyy");

    public List<CaseRecordResponse> getAllCases(UUID userId) {
        log.debug("Getting cases for user: {}", userId != null ? userId : "ALL USERS");
        List<CaseRecord> cases;
        if (userId != null) {
            cases = caseRecordRepository.findByUserIdOrderByCaseDateDesc(userId);
        } else {
            cases = caseRecordRepository.findAllByOrderByCaseDateDesc();
        }
        return cases.stream()
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

        // Deduct from stock
        List<com.stok.app.dto.request.RemoveStockRequest> removeRequests = request.getMaterials().stream()
                .map(m -> {
                    com.stok.app.dto.request.RemoveStockRequest req = new com.stok.app.dto.request.RemoveStockRequest();
                    req.setMaterialName(m.getMaterialName());
                    req.setSerialLotNumber(m.getSerialLotNumber());
                    req.setQuantity(m.getQuantity());
                    return req;
                })
                .collect(Collectors.toList());

        stockService.removeStockItems(removeRequests, userId);

        CaseRecord saved = caseRecordRepository.save(caseRecord);

        // Add history record
        Map<String, Object> details = new HashMap<>();
        details.put("hospitalName", saved.getHospitalName());
        details.put("doctorName", saved.getDoctorName());
        details.put("patientName", saved.getPatientName());
        details.put("date", saved.getCaseDate().toString());
        if (saved.getNotes() != null && !saved.getNotes().isEmpty()) {
            details.put("notes", saved.getNotes());
        }
        details.put("materialsCount", saved.getMaterials().size());

        List<Map<String, Object>> materialsForHistory = saved.getMaterials().stream().map(m -> {
            Map<String, Object> matMap = new HashMap<>();
            matMap.put("materialName", m.getMaterialName());
            matMap.put("serialLotNumber", m.getSerialLotNumber());
            matMap.put("ubbCode", m.getUbbCode());
            matMap.put("quantity", m.getQuantity());
            return matMap;
        }).collect(Collectors.toList());

        details.put("materials", materialsForHistory);

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
                .patientName(caseRecord.getPatientName())
                .notes(caseRecord.getNotes())
                .ownerName(caseRecord.getUser() != null ? caseRecord.getUser().getFullName() : "Unknown")
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

    public void deleteCase(UUID id, UUID userId) {
        log.debug("Deleting case: {} for user: {}", id, userId);
        CaseRecord caseRecord = caseRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Case record not found"));

        // Ownership check — privileged users (userId == null) skip it
        if (userId != null && !caseRecord.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to case record");
        }

        Map<String, Object> details = new HashMap<>();
        details.put("hospitalName", caseRecord.getHospitalName());
        details.put("patientName", caseRecord.getPatientName());
        details.put("date", caseRecord.getCaseDate() != null ? caseRecord.getCaseDate().toString() : null);

        caseRecordRepository.delete(caseRecord);

        historyService.addHistory(
                userId != null ? userId : caseRecord.getUser().getId(),
                "case-delete",
                "Vaka kaydı silindi: " + caseRecord.getPatientName() + " - " + caseRecord.getHospitalName(),
                details);

        log.info("Case record deleted: {}", id);
    }

    public void deleteAllCases(UUID userId) {
        log.debug("Deleting all cases for user: {}", userId);
        List<CaseRecord> userCases = caseRecordRepository.findByUserId(userId);
        caseRecordRepository.deleteAll(userCases);
        log.info("All cases deleted for user: {}", userId);
    }

    public byte[] exportImplantList(java.time.LocalDate startDate, java.time.LocalDate endDate, UUID userId) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start and end dates are required");
        }
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        List<ImplantExportRowProjection> rows = caseRecordRepository.findImplantExportRows(startDate, endDate, userId);
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("No case materials found in the given date range");
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Implant List");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            String[] headers = new String[] {
                    "document date",
                    "customername",
                    "implanter",
                    "patient",
                    "material name",
                    "quantity",
                    "serial no #"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            for (ImplantExportRowProjection rowData : rows) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(rowData.getCaseDate().format(EXPORT_DATE_FORMATTER));
                row.createCell(1).setCellValue(orEmpty(rowData.getHospitalName()));
                row.createCell(2).setCellValue(orEmpty(rowData.getDoctorName()));
                row.createCell(3).setCellValue(orEmpty(rowData.getPatientName()));
                row.createCell(4).setCellValue(orEmpty(rowData.getMaterialName()));
                row.createCell(5).setCellValue(rowData.getQuantity() != null ? rowData.getQuantity() : 0);
                row.createCell(6).setCellValue(orEmpty(rowData.getSerialLotNumber()));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate implant list Excel", e);
        }
    }

    private String orEmpty(String value) {
        return value == null ? "" : value;
    }
}
