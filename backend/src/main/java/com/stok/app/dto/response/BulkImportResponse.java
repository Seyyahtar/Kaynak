package com.stok.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for bulk stock import with duplicate detection.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResponse {

    /** Number of successfully imported stock items */
    private int savedCount;

    /** Total quantity units added across all saved items */
    private int savedQuantity;

    /** Number of items that were skipped because they already exist */
    private int skippedCount;

    /**
     * Names of skipped duplicate items (up to a reasonable limit for UI display)
     */
    private List<String> skippedItems;

    /** The saved stock items returned for UI update */
    private List<StockItemResponse> savedItems;
}
