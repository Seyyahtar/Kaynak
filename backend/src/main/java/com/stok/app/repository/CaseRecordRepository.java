package com.stok.app.repository;

import com.stok.app.entity.CaseRecord;
import com.stok.app.repository.projection.ImplantExportRowProjection;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
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

    List<CaseRecord> findAllByOrderByCaseDateDesc();

    List<CaseRecord> findByCaseDateBetweenAndUserId(LocalDate startDate, LocalDate endDate, UUID userId);

    List<CaseRecord> findByHospitalNameContainingIgnoreCaseAndUserId(String hospitalName, UUID userId);

    @Query(value = """
            SELECT
                cr.case_date AS caseDate,
                cr.hospital_name AS hospitalName,
                cr.doctor_name AS doctorName,
                cr.patient_name AS patientName,
                COALESCE(pi.name, cm.material_name) AS materialName,
                cm.quantity AS quantity,
                cm.serial_lot_number AS serialLotNumber,
                pi.product_code AS productCode
            FROM case_records cr
            INNER JOIN case_materials cm ON cm.case_id = cr.id
            LEFT JOIN product_items pi ON LOWER(pi.name) = LOWER(cm.material_name)
            WHERE cr.case_date BETWEEN :startDate AND :endDate
              AND (:userId IS NULL OR cr.user_id = :userId)
            ORDER BY cr.case_date ASC, cr.id ASC, cm.created_at ASC
            """, nativeQuery = true)
    List<ImplantExportRowProjection> findImplantExportRows(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("userId") UUID userId);
}
