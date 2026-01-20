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
@RequestMapping("/stock")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockController {

    private final StockService stockService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockItemResponse>>> getAllStock(
            @RequestParam UUID userId) {
        List<StockItemResponse> stock = stockService.getAllStock(userId);
        return ResponseEntity.ok(ApiResponse.success(stock));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StockItemResponse>> addStock(
            @Valid @RequestBody StockItemRequest request,
            @RequestParam UUID userId) {
        StockItemResponse stockItem = stockService.addStockItem(request, userId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock item added successfully", stockItem));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StockItemResponse>> updateStock(
            @PathVariable UUID id,
            @Valid @RequestBody StockItemRequest request,
            @RequestParam UUID userId) {
        StockItemResponse stockItem = stockService.updateStockItem(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Stock item updated successfully", stockItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStock(
            @PathVariable UUID id,
            @RequestParam UUID userId) {
        stockService.deleteStockItem(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Stock item deleted successfully", null));
    }

    @PostMapping("/remove")
    public ResponseEntity<ApiResponse<Void>> removeStockItems(
            @Valid @RequestBody List<RemoveStockRequest> requests,
            @RequestParam UUID userId) {
        stockService.removeStockItems(requests, userId);
        return ResponseEntity.ok(ApiResponse.success("Stock items removed successfully", null));
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<ApiResponse<Boolean>> checkDuplicate(
            @RequestParam String materialName,
            @RequestParam String serialLotNumber,
            @RequestParam UUID userId) {
        boolean exists = stockService.checkDuplicate(materialName, serialLotNumber, userId);
        return ResponseEntity.ok(ApiResponse.success(exists));
    }
}
