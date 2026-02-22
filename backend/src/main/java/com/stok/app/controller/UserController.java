package com.stok.app.controller;

import com.stok.app.dto.request.ChangePasswordRequest;
import com.stok.app.dto.request.CreateUserRequest;
import com.stok.app.dto.request.UpdateUserRoleRequest;
import com.stok.app.dto.request.UpdateUserDetailsRequest;
import com.stok.app.dto.request.UpdateUserActiveRequest;
import com.stok.app.dto.request.ResetPasswordAdminRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.UserResponse;
import com.stok.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * User Controller
 * Handles user management endpoints
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    /**
     * Get all users - Admin/Yonetici/Depo
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(Authentication authentication) {
        boolean canListUsers = authentication != null
                && authentication.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                                || a.getAuthority().equals("ROLE_YONETICI")
                                || a.getAuthority().equals("ROLE_DEPO"));

        if (!canListUsers) {
            throw new AccessDeniedException("You do not have permission to perform this action.");
        }

        log.debug("Getting all users");
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /**
     * Create new user - Admin only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        log.debug("Creating user: {}", request.getUsername());
        UserResponse user = userService.createUserByAdmin(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", user));
    }

    /**
     * Update user role - Admin only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        log.debug("Updating user role: {} to {}", id, request.getRole());
        UserResponse user = userService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", user));
    }

    /**
     * Delete user - Admin only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID id) {
        log.debug("Deleting user: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    /**
     * Change password - Any authenticated user
     */
    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable UUID id,
            @Valid @RequestBody ChangePasswordRequest request) {
        log.debug("Changing password for user: {}", id);
        userService.changePassword(id, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    /**
     * Update user details - Admin only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/details")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserDetails(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserDetailsRequest request) {
        log.debug("Updating details for user: {}", id);
        UserResponse user = userService.updateUserDetails(id, request);
        return ResponseEntity.ok(ApiResponse.success("User details updated successfully", user));
    }

    /**
     * Update user active status - Admin only
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/active")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserActiveStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserActiveRequest request) {
        log.debug("Updating active status for user: {}", id);
        UserResponse user = userService.updateUserActiveStatus(id, request.getActive());
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", user));
    }

    /**
     * Reset password by admin
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetUserPasswordByAdmin(
            @PathVariable UUID id,
            @Valid @RequestBody ResetPasswordAdminRequest request) {
        log.debug("Admin resetting password for user: {}", id);
        userService.resetUserPasswordByAdmin(id, request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }
}
