package com.stok.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Represents a group of stock items with the exact same material name.
 * This is the inner grouping level.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialGroupResponse {
    private String fullName;
    private long totalQuantity;
    private List<StockItemResponse> items;
}
