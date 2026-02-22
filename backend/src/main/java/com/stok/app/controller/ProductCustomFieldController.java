package com.stok.app.controller;

import com.stok.app.dto.request.ProductCustomFieldRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.ProductCustomFieldResponse;
import com.stok.app.service.ProductCustomFieldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Product Custom Field Controller
 * GET - Tüm giriş yapmış kullanıcılar (okuma)
 * POST/PUT/DELETE - Sadece ADMIN ve YÖNETİCİ
 */
@RestController
@RequestMapping("/product-fields")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductCustomFieldController {

    private final ProductCustomFieldService productCustomFieldService;

    /**
     * Tüm özel alanları listele - tüm kullanıcılar
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductCustomFieldResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(productCustomFieldService.getAll()));
    }

    /**
     * Yeni özel alan ekle - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @PostMapping
    public ResponseEntity<ApiResponse<ProductCustomFieldResponse>> create(
            @Valid @RequestBody ProductCustomFieldRequest request) {
        ProductCustomFieldResponse created = productCustomFieldService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Alan eklendi", created));
    }

    /**
     * Özel alan güncelle - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductCustomFieldResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductCustomFieldRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success("Alan güncellendi", productCustomFieldService.update(id, request)));
    }

    /**
     * Özel alan sil - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productCustomFieldService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Alan silindi", null));
    }

    /**
     * Alanı aktif/pasif yap - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<ProductCustomFieldResponse>> toggleActive(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productCustomFieldService.toggleActive(id)));
    }

    /**
     * Alanı gizli/görünür yap - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @PutMapping("/{id}/toggle-classified")
    public ResponseEntity<ApiResponse<ProductCustomFieldResponse>> toggleClassified(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productCustomFieldService.toggleClassified(id)));
    }
}
