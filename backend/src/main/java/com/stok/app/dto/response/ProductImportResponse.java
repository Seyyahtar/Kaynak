package com.stok.app.dto.response;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Data
public class ProductImportResponse {
    private int successCount = 0;
    private int errorCount = 0;
    private int notFoundCount = 0;
    private List<String> errorMessages = new ArrayList<>();
}
