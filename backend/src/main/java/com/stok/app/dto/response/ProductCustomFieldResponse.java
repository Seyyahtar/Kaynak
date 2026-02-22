package com.stok.app.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning ProductCustomField data
 */
public class ProductCustomFieldResponse {

    private UUID id;
    private String name;
    private String dataType;
    private Boolean isActive;
    private Boolean isClassified;
    private boolean isDefault = false;
    private LocalDateTime createdAt;

    public ProductCustomFieldResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsClassified() {
        return isClassified;
    }

    public void setIsClassified(Boolean isClassified) {
        this.isClassified = isClassified;
    }

    public boolean isIsDefault() {
        return isDefault;
    }

    public void setIsDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
