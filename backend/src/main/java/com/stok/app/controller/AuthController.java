package com.stok.app.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.stok.app.dto.request.LoginRequest;
import com.stok.app.dto.request.RegisterRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.UserResponse;
import com.stok.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for login and registration")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final com.stok.app.security.JwtUtil jwtUtil;

    @PostMapping("/login")
    @Operation(summary = "Login and get JWT token", description = "Authenticates a user and returns their information with a valid JWT token.")
    public ResponseEntity<ApiResponse<UserResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.debug("Login request for user: {}", request.getUsername());
        UserResponse user = userService.login(request);

        // Generate Token
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        user.setToken(token);

        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.debug("Register request for user: {}", request.getUsername());

        UserResponse user = userService.createUser(
                request.getUsername(),
                request.getFullName(),
                request.getEmail(),
                request.getPassword());
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", user));
    }
}
