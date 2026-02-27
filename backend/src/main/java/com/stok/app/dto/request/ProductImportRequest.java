package com.stok.app.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ProductImportRequest {
    private String importMode; // "list" or "update"
    private List<ColumnMappingDto> mappings;
    private List<List<Object>> rows;
    private List<String> columns; // Original column names just in case
}
