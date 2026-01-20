package com.stok.app.repository;

import com.stok.app.entity.CaseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * CaseRecord Repository
 */
@Repository
public interface CaseRecordRepository extends JpaRepository<CaseRecord, UUID> {

    List<CaseRecord> findByUserId(UUID userId);

    List<CaseRecord> findByUserIdOrderByCaseDateDesc(UUID userId);

    List<CaseRecord> findByCaseDateBetweenAndUserId(LocalDate startDate, LocalDate endDate, UUID userId);

    List<CaseRecord> findByHospitalNameContainingIgnoreCaseAndUserId(String hospitalName, UUID userId);
}
