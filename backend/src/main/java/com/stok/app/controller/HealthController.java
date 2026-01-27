package com.stok.app.controller;

import com.stok.app.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/health")
@Tag(name = "Health Check", description = "System status verification")
public class HealthController {

    @GetMapping
    @Operation(summary = "Check system status", description = "Returns UP if the backend is running.")
    public ResponseEntity<ApiResponse<Map<String, String>>> checkHealth() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "UP",
                "message", "Backend is running correctly")));
    }
}
