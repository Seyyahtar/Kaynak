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

    @GetMapping
    public ResponseEntity<ApiResponse<List<HistoryRecordResponse>>> getAllHistory(
            @RequestParam UUID userId) {
        List<HistoryRecordResponse> history = historyService.getAllHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistory(
            @PathVariable UUID id,
            @RequestParam UUID userId) {
        historyService.deleteHistory(id, userId);
        return ResponseEntity.ok(ApiResponse.success("History record deleted successfully", null));
    }
}
