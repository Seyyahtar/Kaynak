package com.stok.app.controller;

import com.stok.app.dto.request.RemoveStockRequest;
import com.stok.app.dto.request.StockItemRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.StockItemResponse;
import com.stok.app.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Stock Controller
 * Handles all stock-related endpoints
 */
@RestController
@RequestMapping("/stocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockController {

    private final StockService stockService;
    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockItemResponse>>> getAllStock(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        List<StockItemResponse> stock = stockService.getAllStock(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(stock));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StockItemResponse>> addStock(
            @Valid @RequestBody StockItemRequest request,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        StockItemResponse stockItem = stockService.addStockItem(request, effectiveUserId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock item added successfully", stockItem));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StockItemResponse>> updateStock(
            @PathVariable UUID id,
            @Valid @RequestBody StockItemRequest request,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        StockItemResponse stockItem = stockService.updateStockItem(id, effectiveUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Stock item updated successfully", stockItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStock(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        stockService.deleteStockItem(id, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("Stock item deleted successfully", null));
    }

    @PostMapping("/remove")
    public ResponseEntity<ApiResponse<Void>> removeStockItems(
            @Valid @RequestBody List<RemoveStockRequest> requests,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        stockService.removeStockItems(requests, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("Stock items removed successfully", null));
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<ApiResponse<Boolean>> checkDuplicate(
            @RequestParam String materialName,
            @RequestParam String serialLotNumber,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        boolean exists = stockService.checkDuplicate(materialName, serialLotNumber, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(exists));
    }
}
