-- Migration V4: Add phone and region columns to users table
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN region VARCHAR(100);
