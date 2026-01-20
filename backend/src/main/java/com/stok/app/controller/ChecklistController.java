package com.stok.app.controller;

import com.stok.app.dto.request.ChecklistRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.ChecklistResponse;
import com.stok.app.service.ChecklistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Checklist Controller
 * Handles all checklist-related endpoints
 */
@RestController
@RequestMapping("/checklists")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChecklistController {

    private final ChecklistService checklistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChecklistResponse>>> getAllChecklists(
            @RequestParam UUID userId) {
        List<ChecklistResponse> checklists = checklistService.getAllChecklists(userId);
        return ResponseEntity.ok(ApiResponse.success(checklists));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<ChecklistResponse>> getActiveChecklist(
            @RequestParam UUID userId) {
        ChecklistResponse checklist = checklistService.getActiveChecklist(userId);
        return ResponseEntity.ok(ApiResponse.success(checklist));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChecklistResponse>> createChecklist(
            @Valid @RequestBody ChecklistRequest request,
            @RequestParam UUID userId) {
        ChecklistResponse checklist = checklistService.createChecklist(request, userId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Checklist created successfully", checklist));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ChecklistResponse>> updateChecklist(
            @PathVariable UUID id,
            @Valid @RequestBody ChecklistRequest request,
            @RequestParam UUID userId) {
        ChecklistResponse checklist = checklistService.updateChecklist(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Checklist updated successfully", checklist));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<ChecklistResponse>> completeChecklist(
            @PathVariable UUID id,
            @RequestParam UUID userId) {
        ChecklistResponse checklist = checklistService.completeChecklist(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Checklist completed successfully", checklist));
    }
}
