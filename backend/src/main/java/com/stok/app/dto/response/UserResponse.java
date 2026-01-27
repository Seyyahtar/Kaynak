package com.stok.app.dto.response;

import com.stok.app.entity.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for user responses
 */
public class UserResponse {

    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String region;
    private UserRole role;
    private Boolean active;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private String token;

    public UserResponse() {
    }

    public UserResponse(UUID id, String username, String email, String fullName, String phone, String region,
            UserRole role, Boolean active, LocalDateTime lastLogin, LocalDateTime createdAt, String token) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.region = region;
        this.role = role;
        this.active = active;
        this.lastLogin = lastLogin;
        this.createdAt = createdAt;
        this.token = token;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    // Builder
    public static UserResponseBuilder builder() {
        return new UserResponseBuilder();
    }

    public static class UserResponseBuilder {
        private UUID id;
        private String username;
        private String email;
        private String fullName;
        private String phone;
        private String region;
        private UserRole role;
        private Boolean active;
        private LocalDateTime lastLogin;
        private LocalDateTime createdAt;
        private String token;

        public UserResponseBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public UserResponseBuilder username(String username) {
            this.username = username;
            return this;
        }

        public UserResponseBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserResponseBuilder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public UserResponseBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public UserResponseBuilder region(String region) {
            this.region = region;
            return this;
        }

        public UserResponseBuilder role(UserRole role) {
            this.role = role;
            return this;
        }

        public UserResponseBuilder active(Boolean active) {
            this.active = active;
            return this;
        }

        public UserResponseBuilder lastLogin(LocalDateTime lastLogin) {
            this.lastLogin = lastLogin;
            return this;
        }

        public UserResponseBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public UserResponseBuilder token(String token) {
            this.token = token;
            return this;
        }

        public UserResponse build() {
            return new UserResponse(id, username, email, fullName, phone, region, role, active, lastLogin, createdAt,
                    token);
        }
    }
}
