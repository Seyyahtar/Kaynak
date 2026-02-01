package com.stok.app.service;

import com.stok.app.dto.request.StockItemRequest;
import com.stok.app.dto.request.RemoveStockRequest;
import com.stok.app.dto.response.StockItemResponse;
import com.stok.app.entity.StockItem;
import com.stok.app.entity.User;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.StockItemRepository;
import com.stok.app.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    private final StockItemRepository stockItemRepository;
    private final UserRepository userRepository;
    private final HistoryService historyService;
    private final AuditLogService auditLogService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public StockService(StockItemRepository stockItemRepository,
            UserRepository userRepository,
            HistoryService historyService,
            AuditLogService auditLogService,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper,
            NotificationService notificationService) {
        this.stockItemRepository = stockItemRepository;
        this.userRepository = userRepository;
        this.historyService = historyService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    public List<StockItemResponse> getAllStock(UUID userId) {
        log.debug("Getting all stock for user: {}", userId);
        return stockItemRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public StockItemResponse addStockItem(StockItemRequest request, UUID userId) {
        return addStockItem(request, userId, true, false); // Default: Don't allow merge for manual add
    }

    private StockItemResponse addStockItem(StockItemRequest request, UUID userId, boolean addHistory,
            boolean allowMerge) {
        log.debug("Adding stock item: {} for user: {}", request.getMaterialName(), userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check for duplicate
        java.util.Optional<StockItem> existing = stockItemRepository.findByMaterialNameAndSerialLotNumberAndUserId(
                request.getMaterialName(),
                request.getSerialLotNumber(),
                userId);

        if (existing.isPresent()) {
            if (allowMerge) {
                log.info("Stock item exists, merging quantities. Item: {}", request.getMaterialName());
                StockItem item = existing.get();
                item.setQuantity(item.getQuantity() + request.getQuantity());
                // Update other fields if necessary, or trust that same Lot means same
                // properties
                StockItem saved = stockItemRepository.save(item);
                return mapToResponse(saved);
            } else {
                throw new IllegalArgumentException(
                        "Stock item with same material name and serial number already exists: "
                                + request.getMaterialName());
            }
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

        if (addHistory) {
            // Add history record
            Map<String, Object> details = new HashMap<>();
            details.put("materialName", saved.getMaterialName());
            details.put("serialLotNumber", saved.getSerialLotNumber());
            details.put("quantity", saved.getQuantity());
            historyService.addHistory(
                    userId,
                    "stock-add",
                    "Stok eklendi: " + saved.getMaterialName(),
                    details);
        }

        auditLogService.log("CREATE_STOCK", "StockItem", saved.getId().toString(),
                "Added material: " + saved.getMaterialName());

        log.info("Stock item added: {}", saved.getId());
        return mapToResponse(saved);
    }

    public List<StockItemResponse> addStockItems(List<StockItemRequest> requests, UUID userId) {
        log.info("Bulk adding {} stock items for user: {}", requests.size(), userId);

        List<StockItemResponse> results = requests.stream()
                .map(req -> addStockItem(req, userId, false, false)) // Default: false for bulk import too? Or true?
                                                                     // Let's keep false effectively
                .collect(Collectors.toList());

        // Add ONE single history record for the whole batch
        int totalQuantity = requests.stream().mapToInt(StockItemRequest::getQuantity).sum();
        Map<String, Object> details = new HashMap<>();
        details.put("count", requests.size());
        details.put("totalQuantity", totalQuantity);
        details.put("items", results);

        historyService.addHistory(
                userId,
                "stock-add",
                String.format("Toplu stok girişi: %d kalem (%d adet) malzeme eklendi", requests.size(), totalQuantity),
                details);

        return results;
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

        auditLogService.log("UPDATE_STOCK", "StockItem", id.toString(),
                "Updated quantity/details for: " + updated.getMaterialName());

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

        auditLogService.log("DELETE_STOCK", "StockItem", id.toString(),
                "Deleted material: " + stockItem.getMaterialName());

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
                new HashMap<String, Object>());

        List<StockItem> userStock = stockItemRepository.findByUserId(userId);
        stockItemRepository.deleteAll(userStock);
        log.info("All stock items deleted for user: {}", userId);
    }

    public boolean checkDuplicate(String materialName, String serialLotNumber, UUID userId) {
        return stockItemRepository.findByMaterialNameAndSerialLotNumberAndUserId(
                materialName, serialLotNumber, userId).isPresent();
    }

    public void initiateTransfer(UUID senderId, UUID receiverId,
            List<com.stok.app.dto.request.TransferItemRequest> items) {
        log.info("Initiating transfer from {} to {}", senderId, receiverId);

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        // Validate items and check stock
        for (com.stok.app.dto.request.TransferItemRequest itemReq : items) {
            StockItem stockItem = stockItemRepository.findById(itemReq.getStockItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));

            if (!stockItem.getUser().getId().equals(senderId)) {
                throw new IllegalArgumentException("Unauthorized transfer");
            }

            if (stockItem.getQuantity() < itemReq.getQuantity()) {
                throw new IllegalArgumentException("Insufficient quantity for item: " + stockItem.getMaterialName());
            }
        }

        // Process deduction and prepare content
        List<Map<String, Object>> transferredItems = new java.util.ArrayList<>();

        for (com.stok.app.dto.request.TransferItemRequest itemReq : items) {
            StockItem stockItem = stockItemRepository.findById(itemReq.getStockItemId()).get();

            // Deduct from sender
            stockItem.setQuantity(stockItem.getQuantity() - itemReq.getQuantity());
            if (stockItem.getQuantity() == 0) {
                stockItemRepository.delete(stockItem);
            } else {
                stockItemRepository.save(stockItem);
            }

            Map<String, Object> itemData = new HashMap<>();
            itemData.put("materialName", stockItem.getMaterialName());
            itemData.put("serialLotNumber", stockItem.getSerialLotNumber());
            itemData.put("ubbCode", stockItem.getUbbCode());
            itemData.put("expiryDate", stockItem.getExpiryDate());
            itemData.put("quantity", itemReq.getQuantity());
            itemData.put("fromField", stockItem.getFromField());
            itemData.put("toField", stockItem.getToField());
            itemData.put("materialCode", stockItem.getMaterialCode());
            itemData.put("dateAdded", stockItem.getDateAdded());

            transferredItems.add(itemData);
        }

        // Create Notification content
        String contentJson;
        try {
            contentJson = objectMapper.writeValueAsString(transferredItems);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("Error serializing transfer items", e);
        }

        // Send Notification
        String title = sender.getFullName() + " size stok transfer isteği gönderdi";
        notificationService.createNotification(
                senderId,
                receiverId,
                com.stok.app.entity.NotificationType.TRANSFER_REQUEST,
                title,
                contentJson,
                com.stok.app.entity.NotificationActionStatus.WAITING);

        historyService.addHistory(
                senderId,
                "stock-remove",
                "Stok transferi başlatıldı -> " + receiver.getFullName() + " (" + items.size() + " kalem)",
                new HashMap<String, Object>() {
                    {
                        put("receiver", receiver.getUsername());
                        put("items", transferredItems);
                    }
                });

        auditLogService.log("TRANSFER_INITIATED", "Transfer", null,
                "Transfer initiated from sender: " + senderId + " to receiver: " + receiverId);
    }

    public void processTransfer(UUID notificationId, com.stok.app.entity.NotificationActionStatus action) {
        log.info("Processing transfer notification: {} with action: {}", notificationId, action);

        com.stok.app.entity.Notification notification = notificationService.getNotification(notificationId);

        if (notification.getType() != com.stok.app.entity.NotificationType.TRANSFER_REQUEST) {
            throw new IllegalArgumentException("Invalid notification type for transfer processing");
        }

        if (notification.getActionStatus() != com.stok.app.entity.NotificationActionStatus.WAITING) {
            throw new IllegalArgumentException("Transfer already processed");
        }

        List<Map<String, Object>> items;
        try {
            items = objectMapper.readValue(notification.getContent(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {
                    });
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("Error deserializing transfer items", e);
        }

        User sender = userRepository.findById(notification.getSenderId()).orElse(null);
        User receiver = userRepository.findById(notification.getReceiverId()).orElseThrow();

        if (action == com.stok.app.entity.NotificationActionStatus.APPROVED) {
            // Add items to receiver
            for (Map<String, Object> itemData : items) {
                StockItemRequest req = mapToRequest(itemData);
                addStockItem(req, receiver.getId(), false, true); // Allow Merge = TRUE
            }

            // Update Notification
            notificationService.updateActionStatus(notificationId,
                    com.stok.app.entity.NotificationActionStatus.APPROVED);

            // Notify Sender
            if (sender != null) {
                notificationService.createNotification(
                        receiver.getId(),
                        sender.getId(),
                        com.stok.app.entity.NotificationType.TRANSFER_RESULT,
                        receiver.getFullName() + " transferi onayladı",
                        "Transfer işleminiz başarıyla tamamlandı.",
                        com.stok.app.entity.NotificationActionStatus.APPROVED);
            }

            historyService.addHistory(
                    receiver.getId(),
                    "stock-add",
                    sender != null ? sender.getFullName() + "'den transfer alındı" : "Bilinmeyen göndericiden transfer",
                    new HashMap<String, Object>() {
                        {
                            put("count", items.size());
                            put("items", items);
                        }
                    });

            // Add history for sender - transfer completed
            if (sender != null) {
                // Remove the "Transfer Initiated" record first to avoid duplicates
                try {
                    historyService.deletePendingTransferRecord(
                            sender.getId(),
                            receiver.getUsername());
                } catch (Exception e) {
                    log.warn("Failed to delete previous history record: {}", e.getMessage());
                }

                historyService.addHistory(
                        sender.getId(),
                        "stock-remove",
                        "Transfer tamamlandı -> " + receiver.getFullName() + " (" + items.size() + " kalem onaylandı)",
                        new HashMap<String, Object>() {
                            {
                                put("receiver", receiver.getUsername());
                                put("items", items);
                            }
                        });
            }

        } else if (action == com.stok.app.entity.NotificationActionStatus.REJECTED) {
            // Return items to sender
            if (sender != null) {
                for (Map<String, Object> itemData : items) {
                    StockItemRequest tempReq = mapToRequest(itemData);
                    addStockItem(tempReq, sender.getId(), false, true); // Allow Merge = TRUE for return too
                }

                // Notify Sender
                notificationService.createNotification(
                        receiver.getId(),
                        sender.getId(),
                        com.stok.app.entity.NotificationType.TRANSFER_RESULT,
                        receiver.getFullName() + " transferi reddetti",
                        "Malzemeler stoğunuza iade edildi.",
                        com.stok.app.entity.NotificationActionStatus.REJECTED);

                // Remove the "Transfer Initiated" record first
                try {
                    historyService.deletePendingTransferRecord(
                            sender.getId(),
                            receiver.getUsername());
                } catch (Exception e) {
                    log.warn("Failed to delete previous history record: {}", e.getMessage());
                }

                historyService.addHistory(
                        sender.getId(),
                        "stock-add",
                        "Transfer reddedildi, stok iade alındı: " + receiver.getFullName(), // Added description detail
                        new HashMap<String, Object>() {
                            {
                                put("receiver", receiver.getUsername());
                            }
                        });
            }

            // Update Notification
            notificationService.updateActionStatus(notificationId,
                    com.stok.app.entity.NotificationActionStatus.REJECTED);
        }
    }

    private StockItemRequest mapToRequest(Map<String, Object> data) {
        StockItemRequest req = new StockItemRequest();
        req.setMaterialName((String) data.get("materialName"));
        req.setSerialLotNumber((String) data.get("serialLotNumber"));
        req.setUbbCode((String) data.get("ubbCode"));
        req.setQuantity(safeCastInteger(data.get("quantity")));
        req.setFromField((String) data.get("fromField"));
        req.setToField((String) data.get("toField"));
        req.setMaterialCode((String) data.get("materialCode"));

        req.setExpiryDate(parseDate(data.get("expiryDate")));
        req.setDateAdded(parseDate(data.get("dateAdded")));

        if (req.getDateAdded() == null) {
            req.setDateAdded(java.time.LocalDate.now());
        }

        return req;
    }

    private Integer safeCastInteger(Object obj) {
        if (obj == null)
            return 0;
        if (obj instanceof Integer)
            return (Integer) obj;
        if (obj instanceof Number)
            return ((Number) obj).intValue();
        if (obj instanceof String) {
            try {
                return Integer.parseInt((String) obj);
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }

    private java.time.LocalDate parseDate(Object dateObj) {
        if (dateObj == null)
            return null;

        if (dateObj instanceof String) {
            return java.time.LocalDate.parse((String) dateObj);
        }

        if (dateObj instanceof List) {
            List<?> list = (List<?>) dateObj;
            if (list.size() >= 3) {
                return java.time.LocalDate.of(
                        ((Number) list.get(0)).intValue(),
                        ((Number) list.get(1)).intValue(),
                        ((Number) list.get(2)).intValue());
            }
        }

        try {
            return java.time.LocalDate.parse(dateObj.toString());
        } catch (Exception e) {
            return null;
        }
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
