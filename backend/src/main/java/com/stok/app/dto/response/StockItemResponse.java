package com.stok.app.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for stock item responses
 */
@Schema(description = "Response object containing stock item details")
public class StockItemResponse {

    @Schema(description = "Unique identifier of the stock item")
    private UUID id;

    @Schema(description = "The name of the medical material")
    private String materialName;

    @Schema(description = "The serial or lot number")
    private String serialLotNumber;

    @Schema(description = "Unique Barcode / UBB Code")
    private String ubbCode;

    @Schema(description = "Expiration date")
    private LocalDate expiryDate;

    @Schema(description = "Current quantity in stock")
    private Integer quantity;

    @Schema(description = "Date item was originally added")
    private LocalDate dateAdded;

    @Schema(description = "Origin of the item")
    private String fromField;

    @Schema(description = "Destination or assigned department")
    private String toField;

    @Schema(description = "Internal material code")
    private String materialCode;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;

    // Constructor
    public StockItemResponse() {
    }

    public StockItemResponse(UUID id, String materialName, String serialLotNumber, String ubbCode, LocalDate expiryDate,
            Integer quantity, LocalDate dateAdded, String fromField, String toField, String materialCode,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.materialName = materialName;
        this.serialLotNumber = serialLotNumber;
        this.ubbCode = ubbCode;
        this.expiryDate = expiryDate;
        this.quantity = quantity;
        this.dateAdded = dateAdded;
        this.fromField = fromField;
        this.toField = toField;
        this.materialCode = materialCode;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Builder Pattern Hand-coded
    public static StockItemResponseBuilder builder() {
        return new StockItemResponseBuilder();
    }

    public static class StockItemResponseBuilder {
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

        public StockItemResponseBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public StockItemResponseBuilder materialName(String materialName) {
            this.materialName = materialName;
            return this;
        }

        public StockItemResponseBuilder serialLotNumber(String serialLotNumber) {
            this.serialLotNumber = serialLotNumber;
            return this;
        }

        public StockItemResponseBuilder ubbCode(String ubbCode) {
            this.ubbCode = ubbCode;
            return this;
        }

        public StockItemResponseBuilder expiryDate(LocalDate expiryDate) {
            this.expiryDate = expiryDate;
            return this;
        }

        public StockItemResponseBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public StockItemResponseBuilder dateAdded(LocalDate dateAdded) {
            this.dateAdded = dateAdded;
            return this;
        }

        public StockItemResponseBuilder fromField(String fromField) {
            this.fromField = fromField;
            return this;
        }

        public StockItemResponseBuilder toField(String toField) {
            this.toField = toField;
            return this;
        }

        public StockItemResponseBuilder materialCode(String materialCode) {
            this.materialCode = materialCode;
            return this;
        }

        public StockItemResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public StockItemResponseBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public StockItemResponse build() {
            return new StockItemResponse(id, materialName, serialLotNumber, ubbCode, expiryDate, quantity, dateAdded,
                    fromField, toField, materialCode, createdAt, updatedAt);
        }
    }
}
