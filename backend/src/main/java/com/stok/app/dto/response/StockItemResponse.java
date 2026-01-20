package com.stok.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for stock item responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockItemResponse {

    private UUID id;
    private String materialName;
    private String serialLotNumber;
    private String ubbCode;
    private LocalDate expiryDate;
    private Integer quantity;
    private LocalDate dateAdded;
    private String fromField;
    private String toField;
    private String materialCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
