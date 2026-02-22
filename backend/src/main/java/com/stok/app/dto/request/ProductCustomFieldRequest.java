package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a new custom field in the product catalog
 */
public class ProductCustomFieldRequest {

    @NotBlank(message = "Alan adı zorunludur")
    @Size(max = 100, message = "Alan adı en fazla 100 karakter olabilir")
    private String name;

    /**
     * text, number, date, mixed, none
     */
    private String dataType = "text";

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
}
