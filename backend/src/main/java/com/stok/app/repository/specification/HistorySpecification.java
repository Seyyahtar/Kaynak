package com.stok.app.repository.specification;

import com.stok.app.entity.HistoryRecord;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class HistorySpecification {

    public static Specification<HistoryRecord> withFilters(
            LocalDateTime startDate,
            LocalDateTime endDate,
            String type,
            String search,
            List<UUID> userIds,
            UUID effectiveUserId) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Date Range
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("recordDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("recordDate"), endDate));
            }

            // Action Type filtering (ignoring 'all' from frontend)
            if (type != null && !type.isEmpty() && !type.equalsIgnoreCase("all")) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            // Text search (Description)
            if (search != null && !search.trim().isEmpty()) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("description")), likePattern));
            }

            // User filtering
            // If effectiveUserId is strictly set (not Admin/Yonetici seeing "all"), enforce
            // it
            if (effectiveUserId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), effectiveUserId));
            } else if (userIds != null && !userIds.isEmpty()) {
                // If it's a privileged user requesting specific subset of users
                predicates.add(root.get("user").get("id").in(userIds));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
