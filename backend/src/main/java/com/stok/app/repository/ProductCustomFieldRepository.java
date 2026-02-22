package com.stok.app.repository;

import com.stok.app.entity.ProductCustomField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductCustomFieldRepository extends JpaRepository<ProductCustomField, UUID> {

    List<ProductCustomField> findAllByOrderByCreatedAtAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}
