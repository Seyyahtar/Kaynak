package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO for creating/updating stock items
 */
@Data
public class StockItemRequest {

    @NotBlank(message = "Material name is required")
    private String materialName;

    @NotBlank(message = "Serial/Lot number is required")
    private String serialLotNumber;

    private String ubbCode;

    private LocalDate expiryDate;

    @NotNull(message = "Quantity is required")
    private Integer quantity;

    @NotNull(message = "Date added is required")
    private LocalDate dateAdded;

    private String fromField;

    private String toField;

    private String materialCode;
}
