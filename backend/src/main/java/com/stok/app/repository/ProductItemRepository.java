package com.stok.app.repository;

import com.stok.app.entity.ProductItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductItemRepository extends JpaRepository<ProductItem, UUID>, JpaSpecificationExecutor<ProductItem> {

    Optional<ProductItem> findByNameIgnoreCase(String name);

    Optional<ProductItem> findByProductCode(String productCode);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByProductCodeAndIdNot(String productCode, UUID id);

    boolean existsByProductCode(String productCode);
}
