-- BloodConnect Database Schema
-- Created for WAMP Server with MySQL
-- Database: bloodconnect

CREATE DATABASE IF NOT EXISTS bloodconnect;
USE bloodconnect;

-- Set charset and collation
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- USER MANAGEMENT TABLES
-- =============================================

-- Users table (base table for all user types)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('admin', 'patient', 'donor', 'hospital') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_active (is_active),
    INDEX idx_verified (is_verified)
);

-- Patients table
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    medical_id VARCHAR(100),
    insurance_provider VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    known_allergies TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_blood_type (blood_type),
    INDEX idx_user_id (user_id)
);

-- Donors table
CREATE TABLE donors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    donor_id VARCHAR(50) UNIQUE NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    height DECIMAL(5,2),
    is_eligible BOOLEAN DEFAULT TRUE,
    last_donation_date DATE NULL,
    next_eligible_date DATE NULL,
    total_donations INT DEFAULT 0,
    health_status ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
    is_available BOOLEAN DEFAULT TRUE,
    preferred_donation_time ENUM('morning', 'afternoon', 'evening', 'any') DEFAULT 'any',
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    known_allergies TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_donor_id (donor_id),
    INDEX idx_blood_type (blood_type),
    INDEX idx_eligible (is_eligible),
    INDEX idx_available (is_available),
    INDEX idx_user_id (user_id)
);

-- Hospitals table
CREATE TABLE hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hospital_id VARCHAR(50) UNIQUE NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_type ENUM('public', 'private', 'government', 'specialty') NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    accreditation_level ENUM('level_1', 'level_2', 'level_3', 'level_4') DEFAULT 'level_1',
    bed_capacity INT,
    has_blood_bank BOOLEAN DEFAULT TRUE,
    blood_bank_license VARCHAR(100),
    emergency_services BOOLEAN DEFAULT TRUE,
    trauma_center_level ENUM('level_1', 'level_2', 'level_3', 'level_4', 'none') DEFAULT 'none',
    operating_hours_start TIME DEFAULT '00:00:00',
    operating_hours_end TIME DEFAULT '23:59:59',
    is_24_7 BOOLEAN DEFAULT TRUE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    website VARCHAR(255),
    emergency_phone VARCHAR(20),
    blood_bank_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    verified_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_hospital_name (hospital_name),
    INDEX idx_active (is_active),
    INDEX idx_verified (is_verified),
    INDEX idx_blood_bank (has_blood_bank),
    INDEX idx_location (latitude, longitude),
    INDEX idx_user_id (user_id)
);

-- =============================================
-- BLOOD INVENTORY MANAGEMENT
-- =============================================

-- Blood inventory table
CREATE TABLE blood_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    units_available INT NOT NULL DEFAULT 0,
    units_reserved INT NOT NULL DEFAULT 0,
    units_expired INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    low_stock_threshold INT DEFAULT 10,
    critical_stock_threshold INT DEFAULT 5,
    
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hospital_blood_type (hospital_id, blood_type),
    INDEX idx_blood_type (blood_type),
    INDEX idx_hospital_id (hospital_id)
);

-- Blood units table (individual blood unit tracking)
CREATE TABLE blood_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_id VARCHAR(50) UNIQUE NOT NULL,
    hospital_id INT NOT NULL,
    donor_id INT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    volume_ml INT DEFAULT 450,
    status ENUM('available', 'reserved', 'used', 'expired', 'discarded') DEFAULT 'available',
    reserved_for_request_id INT NULL,
    used_for_request_id INT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE SET NULL,
    INDEX idx_unit_id (unit_id),
    INDEX idx_blood_type (blood_type),
    INDEX idx_status (status),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_donor_id (donor_id)
);

-- =============================================
-- BLOOD REQUEST SYSTEM
-- =============================================

-- Blood requests table
CREATE TABLE blood_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    assigned_hospital_id INT NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    units_requested INT NOT NULL,
    priority ENUM('routine', 'urgent', 'emergency') NOT NULL DEFAULT 'routine',
    status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    medical_reason TEXT NOT NULL,
    emergency_reason VARCHAR(255) NULL,
    doctor_contact VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    requested_by_user_id INT NOT NULL,
    approved_by_user_id INT NULL,
    approved_at TIMESTAMP NULL,
    rejected_by_user_id INT NULL,
    rejected_at TIMESTAMP NULL,
    rejection_reason VARCHAR(255) NULL,
    rejection_notes TEXT NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_request_id (request_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_hospital_id (assigned_hospital_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_blood_type (blood_type),
    INDEX idx_created_at (created_at)
);

-- =============================================
-- DONATION SYSTEM
-- =============================================

-- Donation offers table
CREATE TABLE donation_offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    offer_id VARCHAR(50) UNIQUE NOT NULL,
    donor_id INT NOT NULL,
    assigned_hospital_id INT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    volume_ml INT DEFAULT 450,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    offered_by_user_id INT NOT NULL,
    accepted_by_hospital_id INT NULL,
    accepted_by_user_id INT NULL,
    accepted_at TIMESTAMP NULL,
    rejected_by_hospital_id INT NULL,
    rejected_by_user_id INT NULL,
    rejected_at TIMESTAMP NULL,
    rejection_reason VARCHAR(255) NULL,
    rejection_notes TEXT NULL,
    scheduled_date DATE NULL,
    scheduled_time TIME NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason VARCHAR(255) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    FOREIGN KEY (offered_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (accepted_by_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    FOREIGN KEY (accepted_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_offer_id (offer_id),
    INDEX idx_donor_id (donor_id),
    INDEX idx_hospital_id (assigned_hospital_id),
    INDEX idx_status (status),
    INDEX idx_blood_type (blood_type),
    INDEX idx_preferred_date (preferred_date)
);

-- Donation history table
CREATE TABLE donation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id VARCHAR(50) UNIQUE NOT NULL,
    donor_id INT NOT NULL,
    hospital_id INT NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    volume_ml INT DEFAULT 450,
    donation_date DATE NOT NULL,
    donation_time TIME NOT NULL,
    blood_unit_id INT NULL,
    pre_donation_hemoglobin DECIMAL(4,2),
    post_donation_notes TEXT,
    donor_condition ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
    complications TEXT NULL,
    next_eligible_date DATE NOT NULL,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (blood_unit_id) REFERENCES blood_units(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_donation_id (donation_id),
    INDEX idx_donor_id (donor_id),
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_donation_date (donation_date),
    INDEX idx_blood_type (blood_type)
);

-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id VARCHAR(50) UNIQUE NOT NULL,
    recipient_user_id INT NOT NULL,
    sender_user_id INT NULL,
    type ENUM('blood_request', 'donation_offer', 'request_approved', 'request_rejected', 'donation_accepted', 'donation_rejected', 'stock_alert', 'system', 'emergency') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id INT NULL, -- ID of related record (request_id, offer_id, etc.)
    related_type VARCHAR(50) NULL, -- Type of related record
    priority ENUM('low', 'normal', 'high', 'critical') DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    delivery_method ENUM('in_app', 'email', 'sms', 'push') DEFAULT 'in_app',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_notification_id (notification_id),
    INDEX idx_recipient (recipient_user_id),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_read (is_read),
    INDEX idx_created_at (created_at)
);

-- =============================================
-- AUDIT AND LOGGING
-- =============================================

-- Activity logs table
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_id VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'blood_request', 'donation_offer', 'blood_unit', etc.
    entity_id INT NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_log_id (log_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
);

-- System settings table
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_public (is_public)
);

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'BloodConnect', 'string', 'Name of the blood donation system', TRUE),
('site_description', 'Connecting blood donors with those in need', 'string', 'Site description', TRUE),
('donor_eligibility_days', '56', 'integer', 'Days between donations for eligibility', FALSE),
('blood_unit_expiry_days', '42', 'integer', 'Days until blood unit expires', FALSE),
('low_stock_threshold', '10', 'integer', 'Low stock alert threshold', FALSE),
('critical_stock_threshold', '5', 'integer', 'Critical stock alert threshold', FALSE),
('emergency_notification_enabled', 'true', 'boolean', 'Enable emergency notifications', FALSE),
('max_request_units', '10', 'integer', 'Maximum units per request', FALSE),
('system_timezone', 'America/New_York', 'string', 'System timezone', FALSE);

-- Create default admin user (password: admin123)
INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone, is_active, is_verified, email_verified_at) VALUES
('admin@bloodconnect.com', '$2y$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPJFCuFTm', 'admin', 'System', 'Administrator', '+1-555-0000', TRUE, TRUE, NOW());

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show tables created
SHOW TABLES;