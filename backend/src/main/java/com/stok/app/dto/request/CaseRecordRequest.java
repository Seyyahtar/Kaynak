package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for creating case records
 */
public class CaseRecordRequest {

    @NotNull(message = "Case date is required")
    private LocalDate caseDate;

    @NotBlank(message = "Hospital name is required")
    @Size(max = 255, message = "Hospital name must be less than 255 characters")
    private String hospitalName;

    @NotBlank(message = "Doctor name is required")
    @Size(max = 255, message = "Doctor name must be less than 255 characters")
    private String doctorName;

    @NotBlank(message = "Patient name is required")
    @Size(max = 255, message = "Patient name must be less than 255 characters")
    private String patientName;

    @Size(max = 1000, message = "Notes must be less than 1000 characters")
    private String notes;

    @NotEmpty(message = "At least one material is required")
    private List<@Valid CaseMaterialRequest> materials;

    // Getters and Setters
    public LocalDate getCaseDate() {
        return caseDate;
    }

    public void setCaseDate(LocalDate caseDate) {
        this.caseDate = caseDate;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<CaseMaterialRequest> getMaterials() {
        return materials;
    }

    public void setMaterials(List<CaseMaterialRequest> materials) {
        this.materials = materials;
    }

    public static class CaseMaterialRequest {
        @NotBlank(message = "Material name is required")
        @Size(max = 255, message = "Material name must be less than 255 characters")
        private String materialName;

        @NotBlank(message = "Serial/Lot number is required")
        @Size(max = 100, message = "Serial/Lot number must be less than 100 characters")
        private String serialLotNumber;

        @Size(max = 100, message = "UBB code must be less than 100 characters")
        private String ubbCode;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        public String getMaterialName() {
            return materialName;
        }

        public void setMaterialName(String materialName) {
            this.materialName = materialName;
        }

        public String getSerialLotNumber() {
            return serialLotNumber;
        }

        public void setSerialLotNumber(String serialLotNumber) {
            this.serialLotNumber = serialLotNumber;
        }

        public String getUbbCode() {
            return ubbCode;
        }

        public void setUbbCode(String ubbCode) {
            this.ubbCode = ubbCode;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
