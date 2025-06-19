-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS cv_builder_db;

USE cv_builder_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    -- password_hash can be NULL if oauth_provider is not null
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE DEFAULT NULL,
    oauth_provider VARCHAR(50) DEFAULT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CV Templates table
CREATE TABLE IF NOT EXISTS cv_templates (
    id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY, -- Explicit charset/collation
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preview_image_url VARCHAR(255)
);

-- CVs table
CREATE TABLE IF NOT EXISTS cvs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    template_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'classic', -- Explicit charset/collation
    cv_data JSON NOT NULL,
    name VARCHAR(255) DEFAULT 'Untitled CV',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES cv_templates(id) ON DELETE SET NULL
);

-- Seed some default CV templates
-- Using INSERT IGNORE to prevent errors if these templates already exist (e.g., when re-running the script).
INSERT IGNORE INTO cv_templates (id, name, description, preview_image_url) VALUES
('classic', 'Classic', 'A traditional and elegant CV template.', '/previews/classic.png'),
('modern', 'Modern', 'A sleek and contemporary CV template.', '/previews/modern.png');
-- The primary key 'id' on cv_templates ensures that 'classic' and 'modern' cannot be inserted if they already exist.
-- INSERT IGNORE handles this gracefully by skipping the insertion of duplicate rows without raising an error.
