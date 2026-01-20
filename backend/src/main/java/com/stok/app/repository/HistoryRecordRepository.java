package com.stok.app.repository;

import com.stok.app.entity.HistoryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * HistoryRecord Repository
 */
@Repository
public interface HistoryRecordRepository extends JpaRepository<HistoryRecord, UUID> {

    List<HistoryRecord> findByUserId(UUID userId);

    List<HistoryRecord> findByUserIdOrderByRecordDateDesc(UUID userId);

    List<HistoryRecord> findByTypeAndUserId(String type, UUID userId);

    List<HistoryRecord> findByRecordDateBetweenAndUserId(
            LocalDateTime startDate,
            LocalDateTime endDate,
            UUID userId);
}
