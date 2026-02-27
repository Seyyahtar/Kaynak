package com.stok.app.controller;

import com.stok.app.dto.request.RemoveStockRequest;
import com.stok.app.dto.request.StockItemRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.StockItemResponse;
import com.stok.app.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Stock Management", description = "Endpoints for managing medical inventory stock")
public class StockController {

    private final StockService stockService;
    private final com.stok.app.repository.UserRepository userRepository; // Inject UserRepository

    private UUID getEffectiveUserId(UUID userId) {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("User not authenticated");
        }

        String username = authentication.getName();
        com.stok.app.entity.User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isPrivileged = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                        a.getAuthority().equals("ROLE_YONETICI") ||
                        a.getAuthority().equals("ROLE_DEPO"));

        // If user is privileged
        if (isPrivileged) {
            // If they requested a specific userId, use it
            if (userId != null) {
                return userId;
            }
            // If they didn't request a userId, return null (meaning "ALL USERS")
            return null;
        }

        // If user is NOT privileged (Regular User)
        // They can ONLY see their own data
        if (userId != null && !userId.equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only access your own data");
        }

        return currentUser.getId();
    }

    @GetMapping
    @Operation(summary = "Get all stock items", description = "Retrieves a list of all stock items belonging to the specified user.")
    public ResponseEntity<ApiResponse<List<StockItemResponse>>> getAllStock(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        List<StockItemResponse> stock = stockService.getAllStock(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(stock));
    }

    @GetMapping("/grouped")
    @Operation(summary = "Get grouped stock items", description = "Retrieves stock items hierarchically grouped by Prefix and Material Name.")
    public ResponseEntity<ApiResponse<List<com.stok.app.dto.response.PrefixGroupResponse>>> getGroupedStock(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) List<UUID> userIds,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        List<com.stok.app.dto.response.PrefixGroupResponse> groupedStock = stockService.getGroupedStocks(
                effectiveUserId, search, category, userIds);
        return ResponseEntity.ok(ApiResponse.success(groupedStock));
    }

    @GetMapping("/search")
    @Operation(summary = "Search stock items", description = "Search stock items by serial/lot number or material name. Returns max 10 results.")
    public ResponseEntity<ApiResponse<List<StockItemResponse>>> searchStock(
            @RequestParam String query,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        List<StockItemResponse> results = stockService.searchStock(effectiveUserId, query);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StockItemResponse>> addStock(
            @Valid @RequestBody StockItemRequest request,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        StockItemResponse stockItem = stockService.addStockItem(request, effectiveUserId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock item added successfully", stockItem));
    }

    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<StockItemResponse>>> addStockItems(
            @Valid @RequestBody List<StockItemRequest> requests,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        List<StockItemResponse> stockItems = stockService.addStockItems(requests, effectiveUserId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Stock items added successfully", stockItems));
    }

    @PostMapping("/bulk-import")
    public ResponseEntity<ApiResponse<com.stok.app.dto.response.BulkImportResponse>> bulkImport(
            @Valid @RequestBody List<StockItemRequest> requests,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        com.stok.app.dto.response.BulkImportResponse result = stockService.bulkImportWithDuplicateCheck(requests,
                effectiveUserId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bulk import completed", result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StockItemResponse>> updateStock(
            @PathVariable UUID id,
            @Valid @RequestBody StockItemRequest request,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        StockItemResponse stockItem = stockService.updateStockItem(id, effectiveUserId, request);
        return ResponseEntity.ok(ApiResponse.success("Stock item updated successfully", stockItem));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStock(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        stockService.deleteStockItem(id, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("Stock item deleted successfully", null));
    }

    @PostMapping("/remove")
    public ResponseEntity<ApiResponse<Void>> removeStockItems(
            @Valid @RequestBody List<RemoveStockRequest> requests,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        stockService.removeStockItems(requests, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("Stock items removed successfully", null));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllStock(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        stockService.deleteAllStock(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("All stock items deleted successfully", null));
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<ApiResponse<Boolean>> checkDuplicate(
            @RequestParam String materialName,
            @RequestParam String serialLotNumber,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        boolean exists = stockService.checkDuplicate(materialName, serialLotNumber, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(exists));
    }

    // Transfer endpoints use specific sender/receiver IDs, so they don't need this
    // default logic
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<Void>> initiateTransfer(
            @RequestBody com.stok.app.dto.request.TransferRequest request,
            @RequestParam(required = false) UUID userId) {

        UUID senderId = getEffectiveUserId(userId); // Use provided user as sender
        stockService.initiateTransfer(senderId, request.getReceiverId(), request.getItems());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
