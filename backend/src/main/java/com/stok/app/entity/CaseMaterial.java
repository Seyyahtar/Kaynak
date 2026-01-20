package com.stok.app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * CaseMaterial Entity - Vakada kullanılan malzemeler
 */
@Entity
@Table(name = "case_materials")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaseMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private CaseRecord caseRecord;

    @Column(name = "material_name", nullable = false)
    private String materialName;

    @Column(name = "serial_lot_number", nullable = false, length = 100)
    private String serialLotNumber;

    @Column(name = "ubb_code", length = 100)
    private String ubbCode;

    @Column(nullable = false)
    private Integer quantity;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
