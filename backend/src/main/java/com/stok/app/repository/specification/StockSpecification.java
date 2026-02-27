package com.stok.app.repository.specification;

import com.stok.app.entity.StockItem;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StockSpecification {

    public static Specification<StockItem> withFilters(
            String search,
            String categoryId,
            List<UUID> userIds,
            UUID effectiveUserId) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Text search (Material Name or Serial/Lot Number)
            if (search != null && !search.trim().isEmpty()) {
                String likePattern = "%" + search.toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("materialName")), likePattern);
                Predicate serialMatch = cb.like(cb.lower(root.get("serialLotNumber")), likePattern);
                predicates.add(cb.or(nameMatch, serialMatch));
            }

            // Category logic was loosely handled on frontend using first word.
            // If the frontend sends a categoryId (which is the prefix itself in the
            // frontend's grouping context),
            // we can match material names that start with that prefix.
            if (categoryId != null && !categoryId.trim().isEmpty() && !categoryId.equalsIgnoreCase("all")) {
                predicates.add(cb.like(cb.lower(root.get("materialName")), categoryId.toLowerCase() + "%"));
            }

            // User filtering
            if (effectiveUserId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), effectiveUserId));
            } else if (userIds != null && !userIds.isEmpty()) {
                // For admin filtering by specific users
                predicates.add(root.get("user").get("id").in(userIds));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
