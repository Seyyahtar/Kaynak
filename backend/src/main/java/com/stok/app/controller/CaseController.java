package com.stok.app.controller;

import com.stok.app.dto.request.CaseRecordRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.CaseRecordResponse;
import com.stok.app.service.CaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Case Controller
 * Handles all case-related endpoints
 */
@RestController
@RequestMapping("/cases")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CaseController {

    private final CaseService caseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CaseRecordResponse>>> getAllCases(
            @RequestParam UUID userId) {
        List<CaseRecordResponse> cases = caseService.getAllCases(userId);
        return ResponseEntity.ok(ApiResponse.success(cases));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseRecordResponse>> getCaseById(
            @PathVariable UUID id,
            @RequestParam UUID userId) {
        CaseRecordResponse caseRecord = caseService.getCaseById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(caseRecord));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CaseRecordResponse>> createCase(
            @Valid @RequestBody CaseRecordRequest request,
            @RequestParam UUID userId) {
        CaseRecordResponse caseRecord = caseService.createCase(request, userId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Case record created successfully", caseRecord));
    }
}
