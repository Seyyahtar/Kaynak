package com.stok.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for case record responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseRecordResponse {

    private UUID id;
    private LocalDate caseDate;
    private String hospitalName;
    private String doctorName;
    private String patientName;
    private String notes;
    private String ownerName;
    private List<MaterialInfo> materials;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaterialInfo {
        private UUID id;
        private String materialName;
        private String serialLotNumber;
        private String ubbCode;
        private Integer quantity;
    }
}
