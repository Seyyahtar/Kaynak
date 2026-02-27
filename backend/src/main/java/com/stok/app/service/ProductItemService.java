package com.stok.app.service;

import com.stok.app.dto.request.ProductItemRequest;
import com.stok.app.dto.request.ProductCustomFieldRequest;
import com.stok.app.dto.request.ProductImportRequest;
import com.stok.app.dto.request.ColumnMappingDto;

import com.stok.app.dto.response.ProductItemResponse;
import com.stok.app.dto.response.ProductImportResponse;
import com.stok.app.entity.ProductItem;
import com.stok.app.entity.User;
import com.stok.app.repository.ProductItemRepository;
import com.stok.app.repository.UserRepository;
import com.stok.app.repository.specification.ProductSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductItemService {

    private final ProductItemRepository productItemRepository;
    private final ProductCustomFieldService productCustomFieldService;
    private final HistoryService historyService;
    private final UserRepository userRepository;

    public ProductItemService(ProductItemRepository productItemRepository,
            ProductCustomFieldService productCustomFieldService,
            HistoryService historyService,
            UserRepository userRepository) {
        this.productItemRepository = productItemRepository;
        this.productCustomFieldService = productCustomFieldService;
        this.historyService = historyService;
        this.userRepository = userRepository;
    }

    private UUID getCurrentUserId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            String username = auth.getName();
            return userRepository.findByUsername(username)
                    .map(User::getId)
                    .orElse(null);
        }
        return null;
    }

    public List<ProductItemResponse> getAll() {
        return productItemRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<ProductItemResponse> getPage(Pageable pageable, String sortField, String sortDir) {
        return productItemRepository.findAll(
                ProductSpecification.sortByField(sortField, sortDir),
                pageable).map(this::toResponse);
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

        UUID currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("materialName", item.getName());
            details.put("productCode", item.getProductCode());
            historyService.addHistory(
                    currentUserId,
                    "product-add",
                    "Katalog ürünü eklendi: " + item.getName(),
                    details);
        }

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

        UUID currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("materialName", item.getName());
            details.put("productCode", item.getProductCode());
            historyService.addHistory(
                    currentUserId,
                    "product-update",
                    "Katalog ürünü güncellendi: " + item.getName(),
                    details);
        }

        return toResponse(item);
    }

    public void delete(UUID id) {
        ProductItem item = productItemRepository.findById(id).orElse(null);
        if (item == null) {
            throw new IllegalArgumentException("Ürün bulunamadı: " + id);
        }

        UUID currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("materialName", item.getName());
            historyService.addHistory(
                    currentUserId,
                    "product-delete",
                    "Katalog ürünü silindi: " + item.getName(),
                    details);
        }

        productItemRepository.deleteById(id);
    }

    public void deleteAll() {
        UUID currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            historyService.addHistory(
                    currentUserId,
                    "product-delete",
                    "Tüm katalog ürünleri silindi",
                    new HashMap<>());
        }
        productItemRepository.deleteAll();
    }

    public List<ProductItemResponse> bulkCreate(List<ProductItemRequest> requests) {
        List<ProductItemResponse> responses = requests.stream()
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

        if (!responses.isEmpty()) {
            UUID currentUserId = getCurrentUserId();
            if (currentUserId != null) {
                Map<String, Object> details = new HashMap<>();
                details.put("count", responses.size());
                historyService.addHistory(
                        currentUserId,
                        "product-bulk-add",
                        "Toplu katalog ürünleri eklendi (" + responses.size() + " adet)",
                        details);
            }
        }

        return responses;
    }

    public ProductImportResponse bulkImportProductExcel(ProductImportRequest request) {
        ProductImportResponse response = new ProductImportResponse();
        boolean isUpdateMode = "update".equalsIgnoreCase(request.getImportMode());

        if (request.getRows() == null || request.getRows().isEmpty()) {
            return response;
        }

        // Create mapping for new fields: excelColumnName -> newly created field string
        // ID
        Map<String, String> newFieldsMap = new HashMap<>();

        for (ColumnMappingDto mapping : request.getMappings()) {
            if ("NEW".equals(mapping.getTargetField()) && mapping.getNewFieldName() != null
                    && !mapping.getNewFieldName().isBlank()) {
                try {
                    ProductCustomFieldRequest cRequest = new ProductCustomFieldRequest();
                    cRequest.setName(mapping.getNewFieldName().trim());
                    cRequest.setDataType(mapping.getNewFieldType() != null ? mapping.getNewFieldType() : "text");
                    var createdField = productCustomFieldService.create(cRequest);
                    newFieldsMap.put(mapping.getExcelColumn(), createdField.getId().toString());
                } catch (IllegalArgumentException e) {
                    // Field might already exist, try to find it? Or just let it fail/skip.
                    // If it already exists, frontend shouldn't have sent NEW. But let's log and
                    // continue.
                }
            }
        }

        for (List<Object> row : request.getRows()) {
            try {
                // Initialize raw item
                // Use a map to collect values first to handle custom fields
                Map<String, Object> extractedData = new HashMap<>();
                extractedData.put("customFields", new HashMap<String, String>());

                for (int i = 0; i < request.getMappings().size(); i++) {
                    if (i >= row.size() || row.get(i) == null)
                        continue;

                    ColumnMappingDto mapping = request.getMappings().get(i);
                    String value = row.get(i).toString().trim();
                    if (value.isBlank())
                        continue;

                    if ("IGNORE".equals(mapping.getTargetField()))
                        continue;

                    // 1. Process Main Mapping
                    applyMapping(mapping.getTargetField(), value, extractedData, mapping, newFieldsMap);

                    // 2. Process Sub-Mappings (Combined Data)
                    if (mapping.getSubMappings() != null) {
                        Map<String, String> combinationData = extractCombinedCellData(value);
                        if (combinationData != null) {
                            if (combinationData.containsKey("seri") && mapping.getSubMappings().getSeri() != null
                                    && !"IGNORE".equals(mapping.getSubMappings().getSeri())) {
                                applyMapping(mapping.getSubMappings().getSeri(), combinationData.get("seri"),
                                        extractedData, mapping, newFieldsMap);
                            }
                            if (combinationData.containsKey("lot") && mapping.getSubMappings().getLot() != null
                                    && !"IGNORE".equals(mapping.getSubMappings().getLot())) {
                                applyMapping(mapping.getSubMappings().getLot(), combinationData.get("lot"),
                                        extractedData, mapping, newFieldsMap);
                            }
                            if (combinationData.containsKey("skt") && mapping.getSubMappings().getSkt() != null
                                    && !"IGNORE".equals(mapping.getSubMappings().getSkt())) {
                                applyMapping(mapping.getSubMappings().getSkt(), combinationData.get("skt"),
                                        extractedData, mapping, newFieldsMap);
                            }
                            if (combinationData.containsKey("ubb") && mapping.getSubMappings().getUbb() != null
                                    && !"IGNORE".equals(mapping.getSubMappings().getUbb())) {
                                applyMapping(mapping.getSubMappings().getUbb(), combinationData.get("ubb"),
                                        extractedData, mapping, newFieldsMap);
                            }
                        }
                    }
                }

                if (isUpdateMode) {
                    String productCode = (String) extractedData.get("product_code");
                    if (productCode == null || productCode.isBlank()) {
                        response.setErrorCount(response.getErrorCount() + 1);
                        continue;
                    }

                    java.util.Optional<ProductItem> existingOpt = productItemRepository.findByProductCode(productCode);
                    if (existingOpt.isPresent()) {
                        ProductItem existing = existingOpt.get();
                        mergeExtractedData(extractedData, existing);
                        productItemRepository.save(existing);
                        response.setSuccessCount(response.getSuccessCount() + 1);
                    } else {
                        response.setNotFoundCount(response.getNotFoundCount() + 1);
                    }
                } else {
                    // Create mode
                    String name = (String) extractedData.get("name");
                    if (name != null && !name.isBlank()) {
                        if (productItemRepository.existsByNameIgnoreCase(name)) {
                            // Update existing by name, or skip? Frontend logic originally created it
                            // blindly or failed.
                            // Let's create it unless it exists. If exists, skip to simulate original
                            // behavior and prevent 500
                            response.setErrorCount(response.getErrorCount() + 1);
                            response.getErrorMessages().add("Ürün adı zaten var: " + name);
                            continue;
                        }

                        ProductItem newItem = new ProductItem();
                        mergeExtractedData(extractedData, newItem);
                        productItemRepository.save(newItem);
                        response.setSuccessCount(response.getSuccessCount() + 1);
                    } else {
                        response.setErrorCount(response.getErrorCount() + 1);
                        response.getErrorMessages().add("Ürün adı boş olamaz");
                    }
                }

            } catch (Exception e) {
                response.setErrorCount(response.getErrorCount() + 1);
                response.getErrorMessages().add("Satır işlenemedi: " + e.getMessage());
            }
        }

        if (response.getSuccessCount() > 0) {
            UUID currentUserId = getCurrentUserId();
            if (currentUserId != null) {
                Map<String, Object> details = new HashMap<>();
                details.put("successCount", response.getSuccessCount());
                details.put("errorCount", response.getErrorCount());
                details.put("notFoundCount", response.getNotFoundCount());
                historyService.addHistory(
                        currentUserId,
                        "product-bulk-import",
                        "Excel'den toplu katalog ürünleri eşleştirildi (" + response.getSuccessCount()
                                + " işlem başarılı)",
                        details);
            }
        }

        return response;
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

    @SuppressWarnings("unchecked")
    private void applyMapping(String targetField, String value, Map<String, Object> extractedData,
            ColumnMappingDto mapping, Map<String, String> newFieldsMap) {
        if (targetField == null)
            return;

        if (targetField.equals("name")) {
            extractedData.put("name", value);
        } else if (targetField.equals("quantity")) {
            try {
                extractedData.put("quantity", Integer.parseInt(value));
            } catch (NumberFormatException e) {
                extractedData.put("quantity", 0);
            }
        } else if (targetField.equals("serial_number")) {
            extractedData.put("serial_number", value);
        } else if (targetField.equals("lot_number")) {
            extractedData.put("lot_number", value);
        } else if (targetField.equals("expiry_date")) {
            try {
                extractedData.put("expiry_date", java.time.LocalDate.parse(value));
            } catch (Exception e) {
            }
        } else if (targetField.equals("ubb_code")) {
            extractedData.put("ubb_code", value);
        } else if (targetField.equals("product_code")) {
            extractedData.put("product_code", value);
        } else if (targetField.equals("NEW")) {
            String fieldId = newFieldsMap.get(mapping.getExcelColumn());
            if (fieldId != null) {
                ((Map<String, String>) extractedData.get("customFields")).put(fieldId, value);
            }
        } else {
            // Existing custom field ID
            ((Map<String, String>) extractedData.get("customFields")).put(targetField, value);
        }
    }

    @SuppressWarnings("unchecked")
    private void mergeExtractedData(Map<String, Object> extractedData, ProductItem item) {
        if (extractedData.containsKey("name"))
            item.setName((String) extractedData.get("name"));
        if (extractedData.containsKey("product_code"))
            item.setProductCode((String) extractedData.get("product_code"));
        if (extractedData.containsKey("quantity"))
            item.setQuantity((Integer) extractedData.get("quantity"));
        if (extractedData.containsKey("serial_number"))
            item.setSerialNumber((String) extractedData.get("serial_number"));
        if (extractedData.containsKey("lot_number"))
            item.setLotNumber((String) extractedData.get("lot_number"));
        if (extractedData.containsKey("expiry_date"))
            item.setExpiryDate((java.time.LocalDate) extractedData.get("expiry_date"));
        if (extractedData.containsKey("ubb_code"))
            item.setUbbCode((String) extractedData.get("ubb_code"));

        Map<String, String> extractedCustomFields = (Map<String, String>) extractedData.get("customFields");
        if (extractedCustomFields != null && !extractedCustomFields.isEmpty()) {
            Map<String, String> existingCustomFields = item.getCustomFields();
            if (existingCustomFields == null) {
                existingCustomFields = new HashMap<>();
            }
            existingCustomFields.putAll(extractedCustomFields);
            item.setCustomFields(existingCustomFields);
        }
    }

    private static final Pattern PATTERN_SERI = Pattern.compile("(?:SERI|SERİ):\\s*([^/\\\\]+)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PATTERN_LOT = Pattern.compile("LOT:\\s*([^/\\\\]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern PATTERN_SKT = Pattern.compile("SKT:\\s*(\\d{2}[./]\\d{2}[./]\\d{4})",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PATTERN_UBB = Pattern.compile("UBB:\\s*([^/\\\\]+)", Pattern.CASE_INSENSITIVE);

    private Map<String, String> extractCombinedCellData(String value) {
        if (value == null || value.isBlank())
            return null;

        Map<String, String> extracted = new HashMap<>();
        boolean hasAnyData = false;

        Matcher mSeri = PATTERN_SERI.matcher(value);
        if (mSeri.find()) {
            extracted.put("seri", mSeri.group(1).trim());
            hasAnyData = true;
        }

        Matcher mLot = PATTERN_LOT.matcher(value);
        if (mLot.find()) {
            extracted.put("lot", mLot.group(1).trim());
            hasAnyData = true;
        }

        Matcher mSkt = PATTERN_SKT.matcher(value);
        if (mSkt.find()) {
            String dateStr = mSkt.group(1);
            String[] parts = dateStr.split("[./]");
            if (parts.length == 3) {
                String day = String.format("%02d", Integer.parseInt(parts[0]));
                String month = String.format("%02d", Integer.parseInt(parts[1]));
                String year = parts[2];
                extracted.put("skt", year + "-" + month + "-" + day);
                hasAnyData = true;
            }
        }

        Matcher mUbb = PATTERN_UBB.matcher(value);
        if (mUbb.find()) {
            extracted.put("ubb", mUbb.group(1).trim());
            hasAnyData = true;
        }

        return hasAnyData ? extracted : null;
    }
}
