package com.stok.app.service;

import com.stok.app.dto.request.ProductItemRequest;
import com.stok.app.dto.response.ProductItemResponse;
import com.stok.app.entity.ProductItem;
import com.stok.app.repository.ProductItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductItemService {

    private final ProductItemRepository productItemRepository;

    public ProductItemService(ProductItemRepository productItemRepository) {
        this.productItemRepository = productItemRepository;
    }

    public List<ProductItemResponse> getAll() {
        return productItemRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProductItemResponse getById(UUID id) {
        ProductItem item = productItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ürün bulunamadı: " + id));
        return toResponse(item);
    }

    public ProductItemResponse create(ProductItemRequest request) {
        // Name uniqueness check
        if (productItemRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("Bu ürün adı zaten kullanılıyor: " + request.getName());
        }
        // Product code uniqueness check (if provided)
        if (request.getProductCode() != null && !request.getProductCode().isBlank()
                && productItemRepository.existsByProductCode(request.getProductCode().trim())) {
            throw new IllegalArgumentException("Bu ürün kodu zaten kullanılıyor: " + request.getProductCode());
        }

        ProductItem item = new ProductItem();
        mapRequestToEntity(request, item);
        productItemRepository.save(item);
        return toResponse(item);
    }

    public ProductItemResponse update(UUID id, ProductItemRequest request) {
        ProductItem item = productItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ürün bulunamadı: " + id));

        // Name uniqueness check (excluding current)
        if (productItemRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), id)) {
            throw new IllegalArgumentException("Bu ürün adı zaten kullanılıyor: " + request.getName());
        }
        // Product code uniqueness check (excluding current)
        if (request.getProductCode() != null && !request.getProductCode().isBlank()
                && productItemRepository.existsByProductCodeAndIdNot(request.getProductCode().trim(), id)) {
            throw new IllegalArgumentException("Bu ürün kodu zaten kullanılıyor: " + request.getProductCode());
        }

        mapRequestToEntity(request, item);
        productItemRepository.save(item);
        return toResponse(item);
    }

    public void delete(UUID id) {
        if (!productItemRepository.existsById(id)) {
            throw new IllegalArgumentException("Ürün bulunamadı: " + id);
        }
        productItemRepository.deleteById(id);
    }

    public void deleteAll() {
        productItemRepository.deleteAll();
    }

    public List<ProductItemResponse> bulkCreate(List<ProductItemRequest> requests) {
        return requests.stream()
                .map(req -> {
                    // Skip duplicates silently
                    if (productItemRepository.existsByNameIgnoreCase(req.getName().trim())) {
                        return null;
                    }
                    ProductItem item = new ProductItem();
                    mapRequestToEntity(req, item);
                    productItemRepository.save(item);
                    return toResponse(item);
                })
                .filter(r -> r != null)
                .collect(Collectors.toList());
    }

    // --- Helpers ---

    private void mapRequestToEntity(ProductItemRequest request, ProductItem item) {
        item.setName(request.getName().trim());
        item.setProductCode(request.getProductCode() != null && !request.getProductCode().isBlank()
                ? request.getProductCode().trim()
                : null);
        item.setQuantity(request.getQuantity());
        item.setSerialNumber(request.getSerialNumber() != null && !request.getSerialNumber().isBlank()
                ? request.getSerialNumber().trim()
                : null);
        item.setLotNumber(request.getLotNumber() != null && !request.getLotNumber().isBlank()
                ? request.getLotNumber().trim()
                : null);
        item.setExpiryDate(request.getExpiryDate());
        item.setUbbCode(request.getUbbCode() != null && !request.getUbbCode().isBlank()
                ? request.getUbbCode().trim()
                : null);
        item.setCustomFields(request.getCustomFields() != null ? request.getCustomFields() : new HashMap<>());
    }

    private ProductItemResponse toResponse(ProductItem item) {
        ProductItemResponse resp = new ProductItemResponse();
        resp.setId(item.getId());
        resp.setName(item.getName());
        resp.setProductCode(item.getProductCode());
        resp.setQuantity(item.getQuantity());
        resp.setSerialNumber(item.getSerialNumber());
        resp.setLotNumber(item.getLotNumber());
        resp.setExpiryDate(item.getExpiryDate());
        resp.setUbbCode(item.getUbbCode());
        resp.setCustomFields(item.getCustomFields() != null ? item.getCustomFields() : new HashMap<>());
        resp.setCreatedAt(item.getCreatedAt());
        resp.setUpdatedAt(item.getUpdatedAt());
        return resp;
    }
}
