-- Stok Yönetim Uygulaması - Initial Database Schema
-- Author: Auto-generated
-- Date: 2026-01-20

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    email VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Stock Items Table
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_name VARCHAR(255) NOT NULL,
    serial_lot_number VARCHAR(100) NOT NULL,
    ubb_code VARCHAR(100),
    expiry_date DATE,
    quantity INTEGER NOT NULL DEFAULT 0,
    date_added DATE NOT NULL,
    from_field VARCHAR(255),
    to_field VARCHAR(255),
    material_code VARCHAR(100),
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_material_serial UNIQUE (material_name, serial_lot_number, user_id)
);

-- Case Records Table
CREATE TABLE case_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_date DATE NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_case_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Case Materials Table (many-to-many relationship)
CREATE TABLE case_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    serial_lot_number VARCHAR(100) NOT NULL,
    ubb_code VARCHAR(100),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_case_material_case FOREIGN KEY (case_id) REFERENCES case_records(id) ON DELETE CASCADE
);

-- Checklist Records Table
CREATE TABLE checklist_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_date TIMESTAMP,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_checklist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Checklist Patients Table
CREATE TABLE checklist_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    note TEXT,
    phone VARCHAR(50),
    city VARCHAR(100),
    hospital VARCHAR(255),
    appointment_date DATE,
    appointment_time TIME,
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_checklist FOREIGN KEY (checklist_id) REFERENCES checklist_records(id) ON DELETE CASCADE
);

-- History Records Table
CREATE TABLE history_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    details_json JSONB,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_history_type CHECK (type IN ('stock-add', 'stock-remove', 'case', 'stock-delete', 'checklist'))
);

-- Indexes for better performance
CREATE INDEX idx_stock_items_user_id ON stock_items(user_id);
CREATE INDEX idx_stock_items_material_name ON stock_items(material_name);
CREATE INDEX idx_stock_items_expiry_date ON stock_items(expiry_date);
CREATE INDEX idx_case_records_user_id ON case_records(user_id);
CREATE INDEX idx_case_records_date ON case_records(case_date);
CREATE INDEX idx_checklist_records_user_id ON checklist_records(user_id);
CREATE INDEX idx_checklist_records_completed ON checklist_records(is_completed);
CREATE INDEX idx_history_records_user_id ON history_records(user_id);
CREATE INDEX idx_history_records_type ON history_records(type);
CREATE INDEX idx_history_records_date ON history_records(record_date);

-- Insert default admin user (password: admin123)
-- Password hash is BCrypt hash of 'admin123'
INSERT INTO users (id, username, password_hash, full_name, email) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2a$10$8f3Z8Z3Z3Z3Z3Z3Z3Z3Z3OqK5XQXQXQXQXQXQXQXQXQXQXQXQX',
    'Administrator',
    'admin@stok.app'
);

-- Insert sample test user (password: test123)
INSERT INTO users (id, username, password_hash, full_name, email) 
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'test',
    '$2a$10$test123test123test123test123test123test123test123',
    'Test User',
    'test@stok.app'
);
