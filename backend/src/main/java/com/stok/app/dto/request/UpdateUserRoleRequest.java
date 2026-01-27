package com.stok.app.dto.request;

import com.stok.app.entity.UserRole;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for updating user role
 */
public class UpdateUserRoleRequest {

    @NotNull(message = "Role is required")
    private UserRole role;

    // Getters and Setters
    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
