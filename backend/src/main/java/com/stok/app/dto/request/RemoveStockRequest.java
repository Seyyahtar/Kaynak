package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for removing stock items from inventory
 */
public class RemoveStockRequest {

    @NotBlank(message = "Material name is required")
    @Size(max = 255, message = "Material name must be less than 255 characters")
    private String materialName;

    @NotBlank(message = "Serial/Lot number is required")
    @Size(max = 100, message = "Serial/Lot number must be less than 100 characters")
    private String serialLotNumber;

    @NotNull(message = "Quantity is required")
    @jakarta.validation.constraints.Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    // Getters and Setters
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

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
