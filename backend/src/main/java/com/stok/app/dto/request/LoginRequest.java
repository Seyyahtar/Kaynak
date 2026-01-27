package com.stok.app.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "User login credentials")
public class LoginRequest {
    @NotBlank(message = "Username is required")
    @Schema(description = "The login username", example = "ibrahim")
    private String username;

    @NotBlank(message = "Password is required")
    @Schema(description = "The login password", example = "123")
    private String password;

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
