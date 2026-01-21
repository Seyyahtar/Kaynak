package com.stok.app.controller;

import com.stok.app.dto.request.LoginRequest;
import com.stok.app.dto.request.RegisterRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.UserResponse;
import com.stok.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.debug("Login request for user: {}", request.getUsername());
        UserResponse user = userService.login(request);
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
