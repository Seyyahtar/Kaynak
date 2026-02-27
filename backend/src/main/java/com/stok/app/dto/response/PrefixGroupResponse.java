package com.stok.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Represents the top-level grouping of stock materials based on their first
 * word (prefix).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrefixGroupResponse {
    private String prefix;
    private long totalQuantity;
    private List<MaterialGroupResponse> materials;
}
