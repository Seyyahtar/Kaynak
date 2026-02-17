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
    public ResponseEntity<ApiResponse<List<CaseRecordResponse>>> getAllCases(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        List<CaseRecordResponse> cases = caseService.getAllCases(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(cases));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CaseRecordResponse>> getCaseById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        CaseRecordResponse caseRecord = caseService.getCaseById(id, effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success(caseRecord));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CaseRecordResponse>> createCase(
            @Valid @RequestBody CaseRecordRequest request,
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        CaseRecordResponse caseRecord = caseService.createCase(request, effectiveUserId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Case record created successfully", caseRecord));
    }

    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllCases(
            @RequestParam(required = false) UUID userId) {
        UUID effectiveUserId = getEffectiveUserId(userId);
        caseService.deleteAllCases(effectiveUserId);
        return ResponseEntity.ok(ApiResponse.success("All case records deleted successfully", null));
    }
}
