-- Migration V3: Add role and active columns to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'KULLANICI';
ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing ibrahim user to ADMIN if exists
UPDATE users SET role = 'ADMIN' WHERE username = 'ibrahim';
