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
    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @GetMapping
    public ResponseEntity<ApiResponse<List<HistoryRecordResponse>>> getAllHistory(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        List<HistoryRecordResponse> history = historyService.getAllHistory(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistory(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        historyService.deleteHistory(id, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("History record deleted successfully", null));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllHistory(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        historyService.deleteAllHistory(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("All history records deleted successfully", null));
    }
}
