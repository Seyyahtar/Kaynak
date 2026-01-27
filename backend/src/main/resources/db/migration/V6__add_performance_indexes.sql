-- Migration V6: Database Performance Optimization
-- This migration adds the audit_logs table and performance-enhancing composite indexes.

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_name VARCHAR(255),
    entity_id VARCHAR(255),
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Audit Log Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON audit_logs(username);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);

-- 3. Stock Items Performance Index
-- Speeds up searching material name filtered by user (very common)
CREATE INDEX IF NOT EXISTS idx_stock_items_user_material_comp 
ON stock_items(user_id, material_name);

-- 4. Notifications Performance Index
-- Optimized for "get my recent unread notifications"
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_status_created 
ON notifications(receiver_id, status, created_at DESC);

-- 5. History Records Performance Index
-- Optimized for "my recent activity"
CREATE INDEX IF NOT EXISTS idx_history_records_user_date_desc 
ON history_records(user_id, record_date DESC);
