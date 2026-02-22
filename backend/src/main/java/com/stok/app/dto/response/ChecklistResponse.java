package com.stok.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import java.util.List;
import java.util.UUID;

/**
 * DTO for checklist responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistResponse {

    private UUID id;
    private String title;
    private LocalDateTime createdDate;
    private LocalDateTime completedDate;
    private Boolean isCompleted;
    private List<PatientInfo> patients;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatientInfo {
        private UUID id;
        private String name;
        private String note;
        private String phone;
        private String city;
        private String hospital;
        private String date;
        private String time;
        private Boolean checked;
    }
}
