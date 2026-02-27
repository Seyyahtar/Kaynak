package com.stok.app.dto.request;

import lombok.Data;

@Data
public class ColumnMappingDto {
    private String excelColumn;
    private String targetField; // can be null, "IGNORE", "NEW", "name", "quantity", etc.
    private String newFieldName; // if targetField == "NEW"
    private String newFieldType; // "text", "number", "date", "mixed", "none"
    private SubMappingDto subMappings;
}
