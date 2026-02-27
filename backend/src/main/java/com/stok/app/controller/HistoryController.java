package com.stok.app.controller;

import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.HistoryRecordResponse;
import com.stok.app.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * History Controller
 * Handles all history-related endpoints
 */
@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HistoryController {

    private final HistoryService historyService;
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

        if (isPrivileged) {
            if (userId != null)
                return userId;
            return null; // Return null to fetch ALL data
        }

        // Regular user: Must use their own ID
        if (userId != null && !userId.equals(currentUser.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only access your own data");
        }
        return currentUser.getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HistoryRecordResponse>>> getAllHistory(
            @RequestParam(required = false) UUID userId, // Represents the specific user requesting
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime endDate,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<UUID> userIds // Array of IDs when manager filters by multiple
    ) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        List<HistoryRecordResponse> history = historyService.getAllHistory(
                effectiveUserId, startDate, endDate, type, search, userIds);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistory(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        historyService.deleteHistory(id, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("History record deleted successfully", null));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllHistory(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        historyService.deleteAllHistory(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("All history records deleted successfully", null));
    }
}
