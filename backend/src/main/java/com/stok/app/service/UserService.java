package com.stok.app.service;

import com.stok.app.dto.request.LoginRequest;
import com.stok.app.dto.response.UserResponse;
import com.stok.app.entity.User;
import com.stok.app.exception.ResourceNotFoundException;
import com.stok.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User Service - Business logic for user management
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    public UserResponse login(LoginRequest request) {
        log.debug("User login attempt: {}", request.getUsername());

        // Simple authentication (JWT will be added later)
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in: {}", user.getUsername());
        return mapToResponse(user);
    }

    public UserResponse getCurrentUser(UUID userId) {
        log.debug("Getting current user: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    public UserResponse createUser(String username, String fullName, String email) {
        log.debug("Creating user: {}", username);

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setFullName(fullName);
        user.setEmail(email);
        // Password will be set when JWT is implemented

        User saved = userRepository.save(user);
        log.info("User created: {}", saved.getUsername());
        return mapToResponse(saved);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
