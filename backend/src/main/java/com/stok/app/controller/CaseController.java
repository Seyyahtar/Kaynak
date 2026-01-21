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
    private static final UUID TEST_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @GetMapping
    public ResponseEntity<ApiResponse<List<CaseRecordResponse>>> getAllCases(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        List<CaseRecordResponse> cases = caseService.getAllCases(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(cases));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseRecordResponse>> getCaseById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        CaseRecordResponse caseRecord = caseService.getCaseById(id, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(caseRecord));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CaseRecordResponse>> createCase(
            @Valid @RequestBody CaseRecordRequest request,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        CaseRecordResponse caseRecord = caseService.createCase(request, effectiveUserId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Case record created successfully", caseRecord));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllCases(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = userId != null ? userId : TEST_USER_ID;
        caseService.deleteAllCases(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("All case records deleted successfully", null));
    }
}
