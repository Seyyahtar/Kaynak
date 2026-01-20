package com.stok.app.repository;

import com.stok.app.entity.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * StockItem Repository
 */
@Repository
public interface StockItemRepository extends JpaRepository<StockItem, UUID> {

    List<StockItem> findByUserId(UUID userId);

    Optional<StockItem> findByMaterialNameAndSerialLotNumberAndUserId(
            String materialName,
            String serialLotNumber,
            UUID userId);

    List<StockItem> findByExpiryDateBeforeAndUserId(LocalDate date, UUID userId);

    List<StockItem> findByMaterialNameContainingIgnoreCaseAndUserId(String materialName, UUID userId);

    @Query("SELECT s FROM StockItem s WHERE s.user.id = :userId AND s.quantity > 0 ORDER BY s.expiryDate ASC")
    List<StockItem> findActiveStockByUserId(UUID userId);
}
