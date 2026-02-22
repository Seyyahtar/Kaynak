package com.stok.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordAdminRequest {
    @NotBlank(message = "New password is required")
    @Size(min = 3, message = "New password must be at least 3 characters")
    private String newPassword;
}
