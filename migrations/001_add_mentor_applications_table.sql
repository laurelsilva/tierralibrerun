-- Migration: Add mentor_applications table
-- Created: 2024-01-XX
-- Description: Create table for mentor program applications

CREATE TABLE mentor_applications (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    pronouns TEXT,
    running_experience_years INT,
    trail_running_experience_years INT,
    mentorship_experience TEXT,
    motivation_to_mentor TEXT NOT NULL,
    preferred_communication_style TEXT NOT NULL,
    availability TEXT NOT NULL,
    special_expertise TEXT,
    bipoc_identity BOOLEAN,
    gender_identity TEXT,
    location_region TEXT,
    slack_username TEXT,
    additional_info TEXT,
    hear_about_program TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX mentor_applications_created_at_idx (created_at),
    INDEX mentor_applications_status_idx (status),
    INDEX mentor_applications_user_created_at_idx (user_id, created_at)
);
