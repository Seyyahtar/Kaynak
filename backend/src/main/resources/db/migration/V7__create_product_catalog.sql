-- V7: Product Catalog Tables
-- Ortak ürün kataloğu ve başlık tanımları (IF NOT EXISTS ile güvenli oluşturma)

-- Ana ürün tablosu
CREATE TABLE IF NOT EXISTS product_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    product_code VARCHAR(100) UNIQUE,
    quantity INTEGER,
    serial_number VARCHAR(100),
    lot_number VARCHAR(100),
    expiry_date DATE,
    ubb_code VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Dinamik başlık (custom field) tanımları tablosu
CREATE TABLE IF NOT EXISTS product_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    data_type VARCHAR(20) NOT NULL DEFAULT 'text',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_classified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ürünlere ait dinamik alan değerleri (Map<String, String>)
CREATE TABLE IF NOT EXISTS product_item_custom_fields (
    product_id UUID NOT NULL,
    field_id VARCHAR(100) NOT NULL,
    field_value VARCHAR(500),
    PRIMARY KEY (product_id, field_id),
    CONSTRAINT fk_product_customfields FOREIGN KEY (product_id) REFERENCES product_items(id) ON DELETE CASCADE
);

-- Performance indexes (IF NOT EXISTS ile güvenli)
CREATE INDEX IF NOT EXISTS idx_product_items_name ON product_items(name);
CREATE INDEX IF NOT EXISTS idx_product_items_product_code ON product_items(product_code);
CREATE INDEX IF NOT EXISTS idx_product_custom_fields_name ON product_custom_fields(name);
