package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for creating case records
 */
@Data
public class CaseRecordRequest {

    @NotNull(message = "Case date is required")
    private LocalDate caseDate;

    @NotBlank(message = "Hospital name is required")
    private String hospitalName;

    @NotBlank(message = "Doctor name is required")
    private String doctorName;

    @NotBlank(message = "Patient name is required")
    private String patientName;

    private String notes;

    @NotEmpty(message = "At least one material is required")
    private List<CaseMaterialRequest> materials;

    @Data
    public static class CaseMaterialRequest {
        @NotBlank(message = "Material name is required")
        private String materialName;

        @NotBlank(message = "Serial/Lot number is required")
        private String serialLotNumber;

        private String ubbCode;

        @NotNull(message = "Quantity is required")
        private Integer quantity;
    }
}
