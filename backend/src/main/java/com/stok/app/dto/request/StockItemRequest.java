package com.stok.app.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

/**
 * DTO for adding stock items
 */
@Schema(description = "Request object for adding a stock item")
public class StockItemRequest {

    @NotBlank(message = "Material name is required")
    @Size(max = 255, message = "Material name must be less than 255 characters")
    @Schema(description = "The name of the medical material", example = "Surgical Mask")
    private String materialName;

    @NotBlank(message = "Serial/Lot number is required")
    @Size(max = 100, message = "Serial/Lot number must be less than 100 characters")
    @Schema(description = "The serial or lot number", example = "SN12345")
    private String serialLotNumber;

    @Size(max = 100, message = "UBB code must be less than 100 characters")
    @Schema(description = "Unique Barcode / UBB Code", example = "UBB123456")
    private String ubbCode;

    @Schema(description = "Expiration date", example = "2025-12-31")
    private LocalDate expiryDate;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Schema(description = "Quantity of items", example = "100")
    private Integer quantity;

    @Schema(description = "Date when item was added", example = "2024-01-15")
    private LocalDate dateAdded;

    @Size(max = 255, message = "From field must be less than 255 characters")
    @Schema(description = "Origin of the item", example = "Central Warehouse")
    private String fromField;

    @Size(max = 255, message = "To field must be less than 255 characters")
    @Schema(description = "Destination or assigned department", example = "Surgery Department")
    private String toField;

    @Size(max = 100, message = "Material code must be less than 100 characters")
    @Schema(description = "Internal material code", example = "MAT001")
    private String materialCode;

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

    public String getUbbCode() {
        return ubbCode;
    }

    public void setUbbCode(String ubbCode) {
        this.ubbCode = ubbCode;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public LocalDate getDateAdded() {
        return dateAdded;
    }

    public void setDateAdded(LocalDate dateAdded) {
        this.dateAdded = dateAdded;
    }

    public String getFromField() {
        return fromField;
    }

    public void setFromField(String fromField) {
        this.fromField = fromField;
    }

    public String getToField() {
        return toField;
    }

    public void setToField(String toField) {
        this.toField = toField;
    }

    public String getMaterialCode() {
        return materialCode;
    }

    public void setMaterialCode(String materialCode) {
        this.materialCode = materialCode;
    }
}
