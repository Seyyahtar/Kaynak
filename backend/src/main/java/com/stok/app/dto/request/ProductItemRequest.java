package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * DTO for creating/updating a Product Item
 */
public class ProductItemRequest {

    @NotBlank(message = "Ürün adı zorunludur")
    @Size(max = 255, message = "Ürün adı en fazla 255 karakter olabilir")
    private String name;

    @Size(max = 100, message = "Ürün kodu en fazla 100 karakter olabilir")
    private String productCode;

    private Integer quantity;

    @Size(max = 100)
    private String serialNumber;

    @Size(max = 100)
    private String lotNumber;

    private LocalDate expiryDate;

    @Size(max = 100)
    private String ubbCode;

    private Map<String, String> customFields = new HashMap<>();

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getLotNumber() {
        return lotNumber;
    }

    public void setLotNumber(String lotNumber) {
        this.lotNumber = lotNumber;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getUbbCode() {
        return ubbCode;
    }

    public void setUbbCode(String ubbCode) {
        this.ubbCode = ubbCode;
    }

    public Map<String, String> getCustomFields() {
        return customFields;
    }

    public void setCustomFields(Map<String, String> customFields) {
        this.customFields = customFields;
    }
}
