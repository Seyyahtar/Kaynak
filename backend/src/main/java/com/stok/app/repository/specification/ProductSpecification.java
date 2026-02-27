package com.stok.app.repository.specification;

import com.stok.app.entity.ProductItem;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

public class ProductSpecification {

    public static Specification<ProductItem> sortByField(String sortField, String sortDir) {
        return (root, query, cb) -> {
            if (sortField == null || sortField.trim().isEmpty() || "index".equalsIgnoreCase(sortField)) {
                // Default sorting by createdAt Descending if no valid sortField
                query.orderBy(cb.desc(root.get("createdAt")));
                return cb.conjunction();
            }

            Order order;
            boolean isAsc = "asc".equalsIgnoreCase(sortDir);

            // Handle Base Entity Fields
            if (isBaseField(sortField)) {
                Path<Object> path = root.get(getMappedField(sortField));
                order = isAsc ? cb.asc(path) : cb.desc(path);
            } else {
                // Custom Field Sorting via LEFT JOIN on ElementCollection
                MapJoin<ProductItem, String, String> customFieldsJoin = root.joinMap("customFields", JoinType.LEFT);

                // We must filter the join specifically for the field_id we want to sort by
                customFieldsJoin.on(cb.equal(customFieldsJoin.key(), sortField));

                Path<String> valuePath = customFieldsJoin.value();
                order = isAsc ? cb.asc(valuePath) : cb.desc(valuePath);
            }

            query.orderBy(order);
            return cb.conjunction();
        };
    }

    private static boolean isBaseField(String field) {
        return switch (field.toLowerCase()) {
            case "name", "quantity", "serial_number", "lot_number", "expiry_date", "ubb_code", "product_code",
                    "createdat" ->
                true;
            default -> false;
        };
    }

    private static String getMappedField(String field) {
        return switch (field.toLowerCase()) {
            case "serial_number" -> "serialNumber";
            case "lot_number" -> "lotNumber";
            case "expiry_date" -> "expiryDate";
            case "ubb_code" -> "ubbCode";
            case "product_code" -> "productCode";
            case "name" -> "name";
            case "quantity" -> "quantity";
            case "createdat" -> "createdAt";
            default -> field;
        };
    }
}
