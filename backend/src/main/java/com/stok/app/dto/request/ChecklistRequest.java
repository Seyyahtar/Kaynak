package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO for creating/updating checklist records
 */
@Data
public class ChecklistRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotEmpty(message = "At least one patient is required")
    private List<PatientRequest> patients;

    @Data
    public static class PatientRequest {
        @NotBlank(message = "Patient name is required")
        private String name;

        private String note;
        private String phone;
        private String city;
        private String hospital;
        private LocalDate appointmentDate;
        private LocalTime appointmentTime;
        private Boolean checked = false;
    }
}
