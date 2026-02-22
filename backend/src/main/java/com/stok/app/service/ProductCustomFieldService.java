package com.stok.app.service;

import com.stok.app.dto.request.ProductCustomFieldRequest;
import com.stok.app.dto.response.ProductCustomFieldResponse;
import com.stok.app.entity.ProductCustomField;
import com.stok.app.repository.ProductCustomFieldRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductCustomFieldService {

    private final ProductCustomFieldRepository repository;

    public ProductCustomFieldService(ProductCustomFieldRepository repository) {
        this.repository = repository;
    }

    public List<ProductCustomFieldResponse> getAll() {
        return repository.findAllByOrderByCreatedAtAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProductCustomFieldResponse create(ProductCustomFieldRequest request) {
        if (repository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new IllegalArgumentException("Bu alan adı zaten kullanılıyor: " + request.getName());
        }
        ProductCustomField field = new ProductCustomField();
        field.setName(request.getName().trim());
        field.setDataType(request.getDataType() != null ? request.getDataType() : "text");
        field.setIsActive(true);
        field.setIsClassified(false);
        repository.save(field);
        return toResponse(field);
    }

    public ProductCustomFieldResponse update(UUID id, ProductCustomFieldRequest request) {
        ProductCustomField field = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alan bulunamadı: " + id));

        if (repository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), id)) {
            throw new IllegalArgumentException("Bu alan adı zaten kullanılıyor: " + request.getName());
        }
        field.setName(request.getName().trim());
        if (request.getDataType() != null) {
            field.setDataType(request.getDataType());
        }
        repository.save(field);
        return toResponse(field);
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Alan bulunamadı: " + id);
        }
        repository.deleteById(id);
    }

    public ProductCustomFieldResponse toggleActive(UUID id) {
        ProductCustomField field = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alan bulunamadı: " + id));
        field.setIsActive(!Boolean.TRUE.equals(field.getIsActive()));
        repository.save(field);
        return toResponse(field);
    }

    public ProductCustomFieldResponse toggleClassified(UUID id) {
        ProductCustomField field = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Alan bulunamadı: " + id));
        field.setIsClassified(!Boolean.TRUE.equals(field.getIsClassified()));
        repository.save(field);
        return toResponse(field);
    }

    // --- Helper ---

    private ProductCustomFieldResponse toResponse(ProductCustomField field) {
        ProductCustomFieldResponse resp = new ProductCustomFieldResponse();
        resp.setId(field.getId());
        resp.setName(field.getName());
        resp.setDataType(field.getDataType());
        resp.setIsActive(field.getIsActive());
        resp.setIsClassified(field.getIsClassified());
        resp.setIsDefault(false);
        resp.setCreatedAt(field.getCreatedAt());
        return resp;
    }
}
