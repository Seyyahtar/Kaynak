package com.stok.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for history record responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryRecordResponse {

    private UUID id;
    private LocalDateTime recordDate;
    private String type;
    private String description;
    private String ownerName;
    private UUID ownerId;
    private Map<String, Object> details;
    private LocalDateTime createdAt;
}
