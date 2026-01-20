package com.stok.app.repository;

import com.stok.app.entity.ChecklistRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ChecklistRecord Repository
 */
@Repository
public interface ChecklistRecordRepository extends JpaRepository<ChecklistRecord, UUID> {

    List<ChecklistRecord> findByUserId(UUID userId);

    List<ChecklistRecord> findByUserIdOrderByCreatedDateDesc(UUID userId);

    Optional<ChecklistRecord> findByIsCompletedFalseAndUserId(UUID userId);

    List<ChecklistRecord> findByIsCompletedAndUserId(Boolean isCompleted, UUID userId);
}
