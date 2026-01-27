package com.stok.app.controller;

import com.stok.app.dto.request.TransferActionRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.NotificationResponse;
import com.stok.app.service.NotificationService;
import com.stok.app.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final StockService stockService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUserNotifications(@PathVariable UUID userId) {
        List<NotificationResponse> notifications = notificationService.getUserNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/{userId}/unread")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnreadNotifications(@PathVariable UUID userId) {
        List<NotificationResponse> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/action")
    public ResponseEntity<ApiResponse<Void>> processAction(@PathVariable UUID id,
            @RequestBody TransferActionRequest request) {
        // StockService üzerinden process edilecek, çünkü stok işlemleri orada dönüyor
        stockService.processTransfer(id, request.getAction());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
