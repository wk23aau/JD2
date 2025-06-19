-- SQL Schema for AI CV Maker Backend
-- This script is designed to be runnable multiple times.

-- Set character set and collation for the session (optional, usually handled by server/DB config)
-- SET NAMES utf8mb4;
-- SET CHARACTER SET utf8mb4;

-- Create the database if it doesn't exist (optional, often done manually or by deployment scripts)
-- CREATE DATABASE IF NOT EXISTS ai_cv_maker_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE ai_cv_maker_db;

-- -----------------------------------------------------
-- Table `users`
-- Stores user account information, including credentials and OAuth details.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NULL DEFAULT NULL,
  `google_id` VARCHAR(255) NULL DEFAULT NULL,
  `oauth_provider` VARCHAR(50) NULL DEFAULT NULL,
  `is_admin` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  UNIQUE INDEX `google_id_UNIQUE` (`google_id` ASC)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


-- -----------------------------------------------------
-- Table `cv_templates`
-- Stores predefined CV templates that users can choose from.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cv_templates` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `image_url` VARCHAR(255) NULL DEFAULT NULL,
  `default_theme_settings` JSON NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- Seed default CV templates
-- Using INSERT IGNORE to prevent errors if these templates already exist.
INSERT IGNORE INTO `cv_templates` (`id`, `name`, `description`, `image_url`, `default_theme_settings`) VALUES
('classic', 'Classic', 'A timeless and traditional CV template, perfect for formal applications.', '/images/templates/classic_preview.png', JSON_OBJECT('fontFamily', 'Times New Roman', 'fontSize', 12, 'textColor', '#333333', 'headerColor', '#111111', 'accentColor', '#555555')),
('modern', 'Modern', 'A sleek and contemporary CV template, designed for today''s job market.', '/images/templates/modern_preview.png', JSON_OBJECT('fontFamily', 'Arial', 'fontSize', 11, 'textColor', '#2c3e50', 'headerColor', '#2980b9', 'accentColor', '#3498db')),
('creative', 'Creative', 'A visually appealing template for roles that value originality and design.', '/images/templates/creative_preview.png', JSON_OBJECT('fontFamily', 'Helvetica', 'fontSize', 11, 'textColor', '#34495e', 'headerColor', '#e74c3c', 'accentColor', '#c0392b'));


-- -----------------------------------------------------
-- Table `user_cvs`
-- Stores CVs created by users. Each CV is linked to a user and can optionally use a template.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_cvs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL DEFAULT 'Untitled CV',
  `description` TEXT NULL DEFAULT NULL,
  `cv_data` JSON NOT NULL,
  `template_id` VARCHAR(50) NULL DEFAULT NULL, -- Can be NULL if user starts from scratch or template is removed
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_user_cvs_user_id_idx` (`user_id` ASC),
  INDEX `fk_user_cvs_template_id_idx` (`template_id` ASC),
  CONSTRAINT `fk_user_cvs_users`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_cvs_cv_templates`
    FOREIGN KEY (`template_id`)
    REFERENCES `cv_templates` (`id`)
    ON DELETE SET NULL -- If a template is deleted, set template_id to NULL for existing CVs using it
    ON UPDATE NO ACTION
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;

-- Note on Database Creation and Usage:
-- The `CREATE DATABASE IF NOT EXISTS ai_cv_maker_db;` and `USE ai_cv_maker_db;` lines
-- are commented out by default. In many managed database environments or deployment scenarios,
-- the database is created and selected through other means (e.g., cloud provider console,
-- Docker Compose setup, or specific deployment scripts).
-- If you are running this script manually on a new MySQL server where the database
-- does not exist, you might need to uncomment these lines or create the database
-- and select it before running the rest of this script.
-- Always ensure the user executing this script has the necessary privileges.

-- Example of adding more indexes if needed (after table creation):
-- ALTER TABLE `users` ADD INDEX `idx_email` (`email`);
-- ALTER TABLE `users` ADD INDEX `idx_google_id` (`google_id`);
-- ALTER TABLE `user_cvs` ADD INDEX `idx_user_id_updated_at` (`user_id`, `updated_at` DESC);

/*
  Data structure for `cv_data` JSON in `user_cvs` table (example):
  {
    "personalInfo": {
      "name": "John Doe",
      "title": "Software Engineer",
      "phone": "123-456-7890",
      "email": "john.doe@example.com",
      "linkedin": "linkedin.com/in/johndoe",
      "github": "github.com/johndoe"
    },
    "summary": "A brief professional summary...",
    "experience": [
      { "id": "uuid1", "jobTitle": "Senior Developer", "company": "Tech Corp", "location": "City, State", "startDate": "2020-01", "endDate": "Present", "responsibilities": ["Developed X", "Led Y team"] }
    ],
    "education": [
      { "id": "uuid2", "degree": "B.S. in Computer Science", "institution": "University of Example", "location": "City, State", "graduationDate": "2019-05" }
    ],
    "skills": [
      { "id": "uuid3", "category": "Programming Languages", "skills": ["JavaScript", "Python", "Java"] }
    ],
    "projects": [
      // Optional, could be part of experience or a separate section
      { "id": "uuid4", "name": "Project Alpha", "description": "Description of project Alpha.", "technologies": ["Node.js", "React"] }
    ],
    "customSections": [
      // For user-defined sections
      { "id": "uuid5", "title": "Certifications", "content": "Certified Kubernetes Administrator (CKA)" }
    ]
  }
*/
