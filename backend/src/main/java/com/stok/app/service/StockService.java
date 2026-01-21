package com.stok.app.service;

import com.stok.app.dto.request.StockItemRequest;
import com.stok.app.dto.request.RemoveStockRequest;
import com.stok.app.dto.response.StockItemResponse;
import com.stok.app.entity.StockItem;
import com.stok.app.entity.User;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.StockItemRepository;
import com.stok.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Stock Service - Business logic for stock management
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class StockService {

    private final StockItemRepository stockItemRepository;
    private final UserRepository userRepository;
    private final HistoryService historyService;

    public List<StockItemResponse> getAllStock(UUID userId) {
        log.debug("Getting all stock for user: {}", userId);
        return stockItemRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public StockItemResponse addStockItem(StockItemRequest request, UUID userId) {
        log.debug("Adding stock item: {} for user: {}", request.getMaterialName(), userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check for duplicate
        boolean exists = stockItemRepository.findByMaterialNameAndSerialLotNumberAndUserId(
                request.getMaterialName(),
                request.getSerialLotNumber(),
                userId).isPresent();

        if (exists) {
            throw new IllegalArgumentException("Stock item with same material name and serial number already exists");
        }

        StockItem stockItem = new StockItem();
        stockItem.setMaterialName(request.getMaterialName());
        stockItem.setSerialLotNumber(request.getSerialLotNumber());
        stockItem.setUbbCode(request.getUbbCode());
        stockItem.setExpiryDate(request.getExpiryDate());
        stockItem.setQuantity(request.getQuantity());
        stockItem.setDateAdded(request.getDateAdded());
        stockItem.setFromField(request.getFromField());
        stockItem.setToField(request.getToField());
        stockItem.setMaterialCode(request.getMaterialCode());
        stockItem.setUser(user);

        StockItem saved = stockItemRepository.save(stockItem);

        // Add history record
        Map<String, Object> details = new HashMap<>();
        details.put("materialName", saved.getMaterialName());
        details.put("serialLotNumber", saved.getSerialLotNumber());
        details.put("quantity", saved.getQuantity());
        historyService.addHistory(
                userId,
                "stock-add",
                "Stok eklendi: " + saved.getMaterialName() + " (" + saved.getQuantity() + " adet)",
                details);

        log.info("Stock item added: {}", saved.getId());
        return mapToResponse(saved);
    }

    public StockItemResponse updateStockItem(UUID id, UUID userId, StockItemRequest request) {
        log.debug("Updating stock item: {}", id);

        StockItem stockItem = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));

        if (!stockItem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to stock item");
        }

        stockItem.setMaterialName(request.getMaterialName());
        stockItem.setSerialLotNumber(request.getSerialLotNumber());
        stockItem.setUbbCode(request.getUbbCode());
        stockItem.setExpiryDate(request.getExpiryDate());
        stockItem.setQuantity(request.getQuantity());
        stockItem.setDateAdded(request.getDateAdded());
        stockItem.setFromField(request.getFromField());
        stockItem.setToField(request.getToField());
        stockItem.setMaterialCode(request.getMaterialCode());

        StockItem updated = stockItemRepository.save(stockItem);
        log.info("Stock item updated: {}", id);
        return mapToResponse(updated);
    }

    public void deleteStockItem(UUID id, UUID userId) {
        log.debug("Deleting stock item: {}", id);

        StockItem stockItem = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));

        if (!stockItem.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to stock item");
        }

        // Add history record before deletion
        Map<String, Object> details = new HashMap<>();
        details.put("materialName", stockItem.getMaterialName());
        details.put("serialLotNumber", stockItem.getSerialLotNumber());
        details.put("quantity", stockItem.getQuantity());
        historyService.addHistory(
                userId,
                "stock-delete",
                "Stok silindi: " + stockItem.getMaterialName(),
                details);

        stockItemRepository.delete(stockItem);
        log.info("Stock item deleted: {}", id);
    }

    public void removeStockItems(List<RemoveStockRequest> requests, UUID userId) {
        log.debug("Removing stock items for user: {}", userId);

        for (RemoveStockRequest request : requests) {
            StockItem stockItem = stockItemRepository
                    .findByMaterialNameAndSerialLotNumberAndUserId(
                            request.getMaterialName(),
                            request.getSerialLotNumber(),
                            userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Stock item not found: " + request.getMaterialName()));

            if (stockItem.getQuantity() < request.getQuantity()) {
                throw new IllegalArgumentException(
                        "Insufficient quantity for: " + request.getMaterialName());
            }

            stockItem.setQuantity(stockItem.getQuantity() - request.getQuantity());

            if (stockItem.getQuantity() == 0) {
                stockItemRepository.delete(stockItem);
            } else {
                stockItemRepository.save(stockItem);
            }

            // Add history record
            Map<String, Object> details = new HashMap<>();
            details.put("materialName", request.getMaterialName());
            details.put("serialLotNumber", request.getSerialLotNumber());
            details.put("quantity", request.getQuantity());
            historyService.addHistory(
                    userId,
                    "stock-remove",
                    "Stok çıkışı: " + request.getMaterialName() + " (" + request.getQuantity() + " adet)",
                    details);
        }

        log.info("Stock items removed for user: {}", userId);
    }

    public void deleteAllStock(UUID userId) {
        log.debug("Deleting all stock for user: {}", userId);

        // Add history record
        historyService.addHistory(
                userId,
                "stock-delete",
                "Tüm stok kayıtları silindi",
                new HashMap<>()); // Empty details

        List<StockItem> userStock = stockItemRepository.findByUserId(userId);
        stockItemRepository.deleteAll(userStock);
        log.info("All stock items deleted for user: {}", userId);
    }

    public boolean checkDuplicate(String materialName, String serialLotNumber, UUID userId) {
        return stockItemRepository.findByMaterialNameAndSerialLotNumberAndUserId(
                materialName, serialLotNumber, userId).isPresent();
    }

    private StockItemResponse mapToResponse(StockItem item) {
        return StockItemResponse.builder()
                .id(item.getId())
                .materialName(item.getMaterialName())
                .serialLotNumber(item.getSerialLotNumber())
                .ubbCode(item.getUbbCode())
                .expiryDate(item.getExpiryDate())
                .quantity(item.getQuantity())
                .dateAdded(item.getDateAdded())
                .fromField(item.getFromField())
                .toField(item.getToField())
                .materialCode(item.getMaterialCode())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
