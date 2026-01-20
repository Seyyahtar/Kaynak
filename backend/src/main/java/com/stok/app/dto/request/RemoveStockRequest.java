package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO for removing stock items from inventory
 */
@Data
public class RemoveStockRequest {

    @NotBlank(message = "Material name is required")
    private String materialName;

    @NotBlank(message = "Serial/Lot number is required")
    private String serialLotNumber;

    @NotNull(message = "Quantity is required")
    private Integer quantity;
}
