package com.stok.app.controller;

import com.stok.app.dto.request.ProductItemRequest;
import com.stok.app.dto.response.ApiResponse;
import com.stok.app.dto.response.ProductItemResponse;
import com.stok.app.service.ProductItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Product Item Controller
 * GET - Tüm giriş yapmış kullanıcılar (okuma)
 * POST/PUT/DELETE - Sadece ADMIN ve YÖNETİCİ
 */
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductItemController {

    private final ProductItemService productItemService;

    /**
     * Tüm ürünleri listele - tüm kullanıcılar
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductItemResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(productItemService.getAll()));
    }

    /**
     * Tekil ürün getir - tüm kullanıcılar
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductItemResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productItemService.getById(id)));
    }

    /**
     * Yeni ürün ekle - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @PostMapping
    public ResponseEntity<ApiResponse<ProductItemResponse>> create(
            @Valid @RequestBody ProductItemRequest request) {
        ProductItemResponse created = productItemService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ürün eklendi", created));
    }

    /**
     * Toplu ürün ekle - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<ProductItemResponse>>> bulkCreate(
            @Valid @RequestBody List<ProductItemRequest> requests) {
        List<ProductItemResponse> created = productItemService.bulkCreate(requests);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ürünler eklendi", created));
    }

    /**
     * Ürün güncelle - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductItemResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Ürün güncellendi", productItemService.update(id, request)));
    }

    /**
     * Ürün sil - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productItemService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Ürün silindi", null));
    }

    /**
     * Tüm ürünleri sil - sadece ADMIN / YÖNETİCİ
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'YONETICI')")
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        productItemService.deleteAll();
        return ResponseEntity.ok(ApiResponse.success("Tüm ürünler silindi", null));
    }
}
