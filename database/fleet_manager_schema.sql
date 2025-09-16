-- ==================================================
-- FleetManager Pro - MySQL Database Schema
-- ==================================================
-- Author: FleetManager Pro Development Team
-- Version: 1.0
-- Description: Complete database schema for integrated fleet management system
-- Technology Stack: Angular + ASP.NET Core + MySQL + Firebase Auth
-- ==================================================

DROP DATABASE IF EXISTS fleet_manager_pro;
CREATE DATABASE fleet_manager_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fleet_manager_pro;

-- ==================================================
-- USER MANAGEMENT TABLES
-- ==================================================

-- Users table (synced with Firebase Auth)
CREATE TABLE users (
    id VARCHAR(128) PRIMARY KEY COMMENT 'Firebase UID',
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('admin', 'driver') NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    hire_date DATE,
    emergency_contact VARCHAR(255),
    status ENUM('active', 'inactive', 'on-leave', 'suspended') DEFAULT 'active',
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) COMMENT 'User accounts with role-based access';

-- Driver-specific information
CREATE TABLE drivers (
    user_id VARCHAR(128) PRIMARY KEY,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    license_class VARCHAR(10),
    license_expiry DATE NOT NULL,
    experience_years INT DEFAULT 0,
    total_miles_driven DECIMAL(10,2) DEFAULT 0.00,
    safety_rating DECIMAL(3,2) DEFAULT 5.00,
    current_vehicle_id VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    last_location_lat DECIMAL(10,8),
    last_location_lng DECIMAL(11,8),
    last_location_updated TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_license (license_number),
    INDEX idx_availability (is_available),
    INDEX idx_current_vehicle (current_vehicle_id)
) COMMENT 'Driver-specific information and credentials';

-- ==================================================
-- FLEET MANAGEMENT TABLES
-- ==================================================

-- Vehicle categories
CREATE TABLE vehicle_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT 'Vehicle type categories (Truck, Van, Car, etc.)';

-- Vehicles table
CREATE TABLE vehicles (
    id VARCHAR(50) PRIMARY KEY,
    category_id INT NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year YEAR NOT NULL,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    vin VARCHAR(17) NOT NULL UNIQUE,
    color VARCHAR(30),
    fuel_type ENUM('gasoline', 'diesel', 'electric', 'hybrid') NOT NULL,
    fuel_capacity DECIMAL(6,2),
    current_mileage DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'maintenance', 'inactive', 'on-route', 'retired') DEFAULT 'active',
    current_driver_id VARCHAR(128),
    current_location_lat DECIMAL(10,8),
    current_location_lng DECIMAL(11,8),
    last_location_updated TIMESTAMP,
    fuel_level DECIMAL(5,2) DEFAULT 100.00,
    registration_expiry DATE NOT NULL,
    insurance_expiry DATE NOT NULL,
    insurance_policy VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES vehicle_categories(id),
    FOREIGN KEY (current_driver_id) REFERENCES drivers(user_id) ON SET NULL,
    INDEX idx_status (status),
    INDEX idx_license_plate (license_plate),
    INDEX idx_current_driver (current_driver_id),
    INDEX idx_location (current_location_lat, current_location_lng)
) COMMENT 'Fleet vehicles with tracking and status information';

-- Vehicle documents and files
CREATE TABLE vehicle_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    document_type ENUM('registration', 'insurance', 'inspection', 'other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    expiry_date DATE,
    uploaded_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON SET NULL,
    INDEX idx_vehicle_docs (vehicle_id),
    INDEX idx_expiry (expiry_date)
) COMMENT 'Vehicle-related documents and certificates';

-- ==================================================
-- ROUTE MANAGEMENT TABLES
-- ==================================================

-- Routes table
CREATE TABLE routes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vehicle_id VARCHAR(50),
    driver_id VARCHAR(128),
    status ENUM('draft', 'active', 'completed', 'cancelled', 'optimized') DEFAULT 'draft',
    total_distance DECIMAL(8,2),
    estimated_duration INT COMMENT 'Duration in minutes',
    fuel_estimate DECIMAL(8,2),
    start_time DATETIME,
    end_time DATETIME,
    actual_duration INT COMMENT 'Actual duration in minutes',
    created_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON SET NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(user_id) ON SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON SET NULL,
    INDEX idx_status (status),
    INDEX idx_vehicle_route (vehicle_id),
    INDEX idx_driver_route (driver_id),
    INDEX idx_start_time (start_time)
) COMMENT 'Route definitions and assignments';

-- Route stops/waypoints
CREATE TABLE route_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    stop_order INT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    estimated_arrival DATETIME,
    actual_arrival DATETIME,
    estimated_departure DATETIME,
    actual_departure DATETIME,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    status ENUM('pending', 'current', 'completed', 'skipped') DEFAULT 'pending',
    notes TEXT,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    INDEX idx_route_stops (route_id),
    INDEX idx_stop_order (route_id, stop_order),
    INDEX idx_location (latitude, longitude)
) COMMENT 'Individual stops within routes';

-- Route tracking/GPS logs
CREATE TABLE route_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_id VARCHAR(50) NOT NULL,
    vehicle_id VARCHAR(50) NOT NULL,
    driver_id VARCHAR(128) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    altitude DECIMAL(8,2),
    accuracy DECIMAL(8,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(user_id) ON DELETE CASCADE,
    INDEX idx_route_tracking (route_id, timestamp),
    INDEX idx_vehicle_tracking (vehicle_id, timestamp),
    INDEX idx_timestamp (timestamp)
) COMMENT 'GPS tracking data for routes';

-- ==================================================
-- MAINTENANCE MANAGEMENT TABLES
-- ==================================================

-- Maintenance categories
CREATE TABLE maintenance_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    default_interval_miles INT,
    default_interval_months INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT 'Types of maintenance tasks';

-- Maintenance tasks
CREATE TABLE maintenance_tasks (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    category_id INT NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('urgent', 'high', 'medium', 'low') NOT NULL,
    status ENUM('scheduled', 'in-progress', 'completed', 'overdue', 'cancelled') DEFAULT 'scheduled',
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    scheduled_mileage DECIMAL(10,2),
    completed_mileage DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    assigned_to VARCHAR(255),
    technician_notes TEXT,
    parts_used TEXT,
    labor_hours DECIMAL(4,2),
    service_provider VARCHAR(255),
    warranty_until DATE,
    created_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES maintenance_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON SET NULL,
    INDEX idx_vehicle_maintenance (vehicle_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_scheduled_date (scheduled_date)
) COMMENT 'Maintenance tasks and service records';

-- Maintenance reminders/alerts
CREATE TABLE maintenance_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    category_id INT NOT NULL,
    reminder_type ENUM('mileage', 'time', 'both') NOT NULL,
    next_service_miles DECIMAL(10,2),
    next_service_date DATE,
    interval_miles INT,
    interval_months INT,
    last_service_date DATE,
    last_service_miles DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES maintenance_categories(id),
    INDEX idx_vehicle_reminders (vehicle_id),
    INDEX idx_next_service (next_service_date, next_service_miles)
) COMMENT 'Automatic maintenance reminder system';

-- ==================================================
-- ATTENDANCE AND LEAVE MANAGEMENT
-- ==================================================

-- Attendance records
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(128) NOT NULL,
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    total_hours DECIMAL(4,2),
    break_duration DECIMAL(4,2) DEFAULT 0.00,
    overtime_hours DECIMAL(4,2) DEFAULT 0.00,
    status ENUM('present', 'absent', 'late', 'partial', 'holiday', 'sick_leave', 'vacation') NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    approved_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES drivers(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON SET NULL,
    UNIQUE KEY unique_driver_date (driver_id, date),
    INDEX idx_driver_attendance (driver_id, date),
    INDEX idx_status (status),
    INDEX idx_date_range (date)
) COMMENT 'Daily attendance records for drivers';

-- Leave request types
CREATE TABLE leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    max_days_per_year INT,
    requires_approval BOOLEAN DEFAULT TRUE,
    advance_notice_days INT DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT 'Types of leave (sick, vacation, personal, etc.)';

-- Leave requests
CREATE TABLE leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    driver_id VARCHAR(128) NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(128),
    approved_date TIMESTAMP NULL,
    rejection_reason TEXT,
    emergency_contact VARCHAR(255),
    supporting_documents VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES drivers(user_id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (approved_by) REFERENCES users(id) ON SET NULL,
    INDEX idx_driver_leave (driver_id),
    INDEX idx_status (status),
    INDEX idx_date_range (start_date, end_date)
) COMMENT 'Driver leave requests and approvals';

-- ==================================================
-- NOTIFICATIONS AND ALERTS
-- ==================================================

-- System notifications
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(128),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    category ENUM('maintenance', 'route', 'leave', 'system', 'attendance') NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,
    scheduled_send_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id, is_read),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) COMMENT 'System notifications and alerts';

-- ==================================================
-- SYSTEM CONFIGURATION AND SETTINGS
-- ==================================================

-- System settings
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key)
) COMMENT 'System-wide configuration settings';

-- Audit log for tracking changes
CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(128),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(50),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON SET NULL,
    INDEX idx_user_audit (user_id),
    INDEX idx_table_audit (table_name, record_id),
    INDEX idx_created_at (created_at)
) COMMENT 'Audit trail for system changes';

-- ==================================================
-- INSERT SAMPLE DATA
-- ==================================================

-- Insert vehicle categories
INSERT INTO vehicle_categories (name, description) VALUES
('Truck', 'Large cargo vehicles for heavy-duty transport'),
('Van', 'Medium-sized delivery vehicles'),
('Car', 'Standard passenger vehicles'),
('SUV', 'Sport utility vehicles for various purposes'),
('Motorcycle', 'Two-wheeled vehicles for quick delivery');

-- Insert maintenance categories
INSERT INTO maintenance_categories (name, description, default_interval_miles, default_interval_months) VALUES
('Oil Change', 'Regular engine oil and filter replacement', 5000, 6),
('Tire Rotation', 'Rotating tires for even wear', 7500, 6),
('Brake Inspection', 'Checking brake pads and system', 15000, 12),
('Engine Tune-up', 'Comprehensive engine maintenance', 30000, 24),
('Transmission Service', 'Transmission fluid and filter change', 60000, 36),
('Air Filter', 'Engine air filter replacement', 12000, 12),
('Battery Check', 'Battery and electrical system inspection', 25000, 18);

-- Insert leave types
INSERT INTO leave_types (name, description, max_days_per_year, requires_approval, advance_notice_days) VALUES
('Sick Leave', 'Medical leave for illness or medical appointments', 10, FALSE, 0),
('Vacation', 'Annual vacation time off', 21, TRUE, 14),
('Personal Leave', 'Personal time off for family or personal matters', 5, TRUE, 7),
('Emergency Leave', 'Unplanned leave for emergencies', 3, FALSE, 0),
('Bereavement', 'Leave for family member passing', 3, FALSE, 0),
('Maternity/Paternity', 'Leave for new parents', 90, TRUE, 30);

-- Insert sample system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('maintenance_alert_days', '7', 'number', 'Days before maintenance to send alerts', FALSE),
('max_working_hours_per_day', '10', 'number', 'Maximum working hours per day for drivers', FALSE),
('fuel_efficiency_threshold', '8.0', 'number', 'Minimum acceptable fuel efficiency (MPG)', FALSE),
('default_timezone', 'America/New_York', 'string', 'Default system timezone', TRUE),
('company_name', 'FleetManager Pro', 'string', 'Company name for branding', TRUE),
('enable_gps_tracking', 'true', 'boolean', 'Enable real-time GPS tracking', FALSE);

-- Insert sample admin user
INSERT INTO users (id, name, email, role, phone, hire_date, status) VALUES
('admin001', 'Fleet Manager', 'admin@fleetmanager.com', 'admin', '+1-555-0100', '2023-01-01', 'active');

-- Insert sample drivers
INSERT INTO users (id, name, email, role, phone, address, date_of_birth, hire_date, emergency_contact, status) VALUES
('driver001', 'John Smith', 'john.smith@fleetmanager.com', 'driver', '+1-555-0101', '123 Main St, Anytown, ST 12345', '1985-03-15', '2023-02-01', 'Jane Smith: +1-555-0102', 'active'),
('driver002', 'Sarah Johnson', 'sarah.johnson@fleetmanager.com', 'driver', '+1-555-0103', '456 Oak Ave, Anytown, ST 12345', '1990-07-22', '2023-03-01', 'Mike Johnson: +1-555-0104', 'active'),
('driver003', 'Mike Davis', 'mike.davis@fleetmanager.com', 'driver', '+1-555-0105', '789 Pine Rd, Anytown, ST 12345', '1988-11-10', '2023-04-01', 'Lisa Davis: +1-555-0106', 'active');

-- Insert driver details
INSERT INTO drivers (user_id, license_number, license_class, license_expiry, experience_years, total_miles_driven, safety_rating) VALUES
('driver001', 'DL123456789', 'CDL-A', '2025-03-15', 8, 125000.50, 4.8),
('driver002', 'DL987654321', 'CDL-B', '2025-07-22', 5, 89000.25, 4.9),
('driver003', 'DL456789123', 'CDL-A', '2025-11-10', 6, 110000.75, 4.7);

-- Insert sample vehicles
INSERT INTO vehicles (id, category_id, make, model, year, license_plate, vin, color, fuel_type, fuel_capacity, current_mileage, status, registration_expiry, insurance_expiry, insurance_policy) VALUES
('TR-001', 1, 'Ford', 'F-150', 2022, 'ABC-1234', '1FTFW1ET5NFC12345', 'White', 'gasoline', 80.00, 25000.00, 'active', '2025-06-01', '2024-12-31', 'POL-2024-001'),
('TR-002', 1, 'Chevrolet', 'Silverado', 2021, 'DEF-5678', '1GCUKREC5MZ123456', 'Blue', 'gasoline', 75.00, 32000.00, 'active', '2025-05-15', '2024-11-30', 'POL-2024-002'),
('VN-001', 2, 'Ford', 'Transit', 2023, 'GHI-9012', 'NM0LS7E79N1123456', 'Silver', 'gasoline', 60.00, 15000.00, 'active', '2025-08-01', '2025-01-31', 'POL-2024-003');

-- Assign vehicles to drivers
UPDATE drivers SET current_vehicle_id = 'TR-001' WHERE user_id = 'driver001';
UPDATE drivers SET current_vehicle_id = 'TR-002' WHERE user_id = 'driver002';
UPDATE drivers SET current_vehicle_id = 'VN-001' WHERE user_id = 'driver003';

UPDATE vehicles SET current_driver_id = 'driver001' WHERE id = 'TR-001';
UPDATE vehicles SET current_driver_id = 'driver002' WHERE id = 'TR-002';
UPDATE vehicles SET current_driver_id = 'driver003' WHERE id = 'VN-001';

-- Insert sample maintenance tasks
INSERT INTO maintenance_tasks (id, vehicle_id, category_id, task_type, description, priority, status, scheduled_date, estimated_cost, created_by) VALUES
('MAINT-001', 'TR-001', 1, 'Oil Change', 'Regular oil change and filter replacement', 'medium', 'scheduled', '2024-02-15', 75.00, 'admin001'),
('MAINT-002', 'TR-002', 3, 'Brake Inspection', 'Annual brake system inspection', 'high', 'scheduled', '2024-02-20', 150.00, 'admin001'),
('MAINT-003', 'VN-001', 2, 'Tire Rotation', 'Rotate tires for even wear', 'low', 'completed', '2024-01-30', 50.00, 'admin001');

-- Insert sample routes
INSERT INTO routes (id, name, description, vehicle_id, driver_id, status, total_distance, estimated_duration, created_by) VALUES
('RT-001', 'Downtown Delivery Route', 'Daily delivery route covering downtown area', 'TR-001', 'driver001', 'active', 45.5, 180, 'admin001'),
('RT-002', 'Airport Express Route', 'Express route to airport terminal', 'TR-002', 'driver002', 'active', 32.0, 120, 'admin001'),
('RT-003', 'Industrial Zone Route', 'Service route for industrial district', 'VN-001', 'driver003', 'completed', 28.5, 150, 'admin001');

-- Insert sample route stops
INSERT INTO route_stops (route_id, stop_order, address, priority, status, contact_name, contact_phone) VALUES
('RT-001', 1, '100 Business Ave, Downtown', 'high', 'completed', 'ABC Corp', '+1-555-1001'),
('RT-001', 2, '250 Commerce St, Downtown', 'medium', 'current', 'XYZ Ltd', '+1-555-1002'),
('RT-001', 3, '500 Market St, Downtown', 'medium', 'pending', 'Tech Solutions', '+1-555-1003'),
('RT-002', 1, 'Airport Terminal 1, Gate A', 'high', 'pending', 'Airport Services', '+1-555-2001'),
('RT-003', 1, '1000 Industrial Blvd', 'high', 'completed', 'Manufacturing Co', '+1-555-3001');

-- Insert sample attendance records
INSERT INTO attendance (driver_id, date, clock_in, clock_out, total_hours, status) VALUES
('driver001', '2024-01-29', '08:00:00', '17:00:00', 8.5, 'present'),
('driver001', '2024-01-30', '08:15:00', '17:00:00', 8.25, 'late'),
('driver002', '2024-01-29', '07:30:00', '16:30:00', 8.5, 'present'),
('driver002', '2024-01-30', '08:00:00', '17:00:00', 8.5, 'present'),
('driver003', '2024-01-29', '09:00:00', '18:00:00', 8.5, 'present'),
('driver003', '2024-01-30', NULL, NULL, 0, 'sick_leave');

-- Insert sample leave request
INSERT INTO leave_requests (id, driver_id, leave_type_id, start_date, end_date, total_days, reason, status) VALUES
('LV-001', 'driver003', 1, '2024-02-05', '2024-02-06', 2, 'Medical appointment and recovery', 'approved');

-- ==================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ==================================================

-- View for active fleet with driver information
CREATE VIEW active_fleet_view AS
SELECT 
    v.id as vehicle_id,
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.status as vehicle_status,
    v.current_mileage,
    v.fuel_level,
    d.user_id as driver_id,
    u.name as driver_name,
    u.phone as driver_phone,
    d.license_number,
    d.is_available as driver_available
FROM vehicles v
LEFT JOIN drivers d ON v.current_driver_id = d.user_id
LEFT JOIN users u ON d.user_id = u.id
WHERE v.status IN ('active', 'on-route');

-- View for maintenance due soon
CREATE VIEW maintenance_due_view AS
SELECT 
    v.id as vehicle_id,
    v.make,
    v.model,
    v.license_plate,
    v.current_mileage,
    mr.category_id,
    mc.name as maintenance_type,
    mr.next_service_date,
    mr.next_service_miles,
    CASE 
        WHEN mr.next_service_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'Due Soon'
        WHEN mr.next_service_date <= CURDATE() THEN 'Overdue'
        WHEN mr.next_service_miles <= v.current_mileage THEN 'Mileage Due'
        ELSE 'Scheduled'
    END as urgency_status
FROM vehicles v
JOIN maintenance_reminders mr ON v.id = mr.vehicle_id
JOIN maintenance_categories mc ON mr.category_id = mc.id
WHERE mr.is_active = TRUE
AND (mr.next_service_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
     OR mr.next_service_miles <= v.current_mileage + 1000);

-- View for driver performance metrics
CREATE VIEW driver_performance_view AS
SELECT 
    d.user_id,
    u.name,
    d.license_number,
    d.total_miles_driven,
    d.safety_rating,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as days_present,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as days_late,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as days_absent,
    AVG(a.total_hours) as avg_hours_per_day,
    COUNT(r.id) as total_routes_assigned,
    COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as routes_completed
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN attendance a ON d.user_id = a.driver_id 
    AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
LEFT JOIN routes r ON d.user_id = r.driver_id
    AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
WHERE u.status = 'active'
GROUP BY d.user_id, u.name, d.license_number, d.total_miles_driven, d.safety_rating;

-- ==================================================
-- CREATE STORED PROCEDURES
-- ==================================================

DELIMITER //

-- Procedure to update vehicle location
CREATE PROCEDURE UpdateVehicleLocation(
    IN p_vehicle_id VARCHAR(50),
    IN p_latitude DECIMAL(10,8),
    IN p_longitude DECIMAL(11,8)
)
BEGIN
    UPDATE vehicles 
    SET current_location_lat = p_latitude,
        current_location_lng = p_longitude,
        last_location_updated = CURRENT_TIMESTAMP
    WHERE id = p_vehicle_id;
    
    -- Also update driver location if assigned
    UPDATE drivers 
    SET last_location_lat = p_latitude,
        last_location_lng = p_longitude,
        last_location_updated = CURRENT_TIMESTAMP
    WHERE user_id = (SELECT current_driver_id FROM vehicles WHERE id = p_vehicle_id);
END //

-- Procedure to complete a maintenance task
CREATE PROCEDURE CompleteMaintenance(
    IN p_task_id VARCHAR(50),
    IN p_completed_mileage DECIMAL(10,2),
    IN p_actual_cost DECIMAL(10,2),
    IN p_technician_notes TEXT
)
BEGIN
    DECLARE v_vehicle_id VARCHAR(50);
    DECLARE v_category_id INT;
    
    -- Update the maintenance task
    UPDATE maintenance_tasks 
    SET status = 'completed',
        completed_date = CURDATE(),
        completed_mileage = p_completed_mileage,
        actual_cost = p_actual_cost,
        technician_notes = p_technician_notes
    WHERE id = p_task_id;
    
    -- Get vehicle and category for reminder update
    SELECT vehicle_id, category_id INTO v_vehicle_id, v_category_id
    FROM maintenance_tasks 
    WHERE id = p_task_id;
    
    -- Update maintenance reminder
    UPDATE maintenance_reminders 
    SET last_service_date = CURDATE(),
        last_service_miles = p_completed_mileage,
        next_service_date = DATE_ADD(CURDATE(), INTERVAL interval_months MONTH),
        next_service_miles = p_completed_mileage + interval_miles
    WHERE vehicle_id = v_vehicle_id AND category_id = v_category_id;
END //

DELIMITER ;

-- ==================================================
-- CREATE TRIGGERS
-- ==================================================

DELIMITER //

-- Trigger to update driver availability when vehicle status changes
CREATE TRIGGER update_driver_availability 
AFTER UPDATE ON vehicles
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        IF NEW.status = 'maintenance' OR NEW.status = 'inactive' THEN
            UPDATE drivers 
            SET is_available = FALSE 
            WHERE user_id = NEW.current_driver_id;
        ELSEIF NEW.status = 'active' THEN
            UPDATE drivers 
            SET is_available = TRUE 
            WHERE user_id = NEW.current_driver_id;
        END IF;
    END IF;
END //

-- Trigger to log audit trail
CREATE TRIGGER audit_user_changes
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (NEW.id, 'UPDATE', 'users', NEW.id, 
            JSON_OBJECT('name', OLD.name, 'email', OLD.email, 'role', OLD.role, 'status', OLD.status),
            JSON_OBJECT('name', NEW.name, 'email', NEW.email, 'role', NEW.role, 'status', NEW.status));
END //

DELIMITER ;

-- ==================================================
-- GRANT PERMISSIONS (Adjust as needed)
-- ==================================================

-- Create application user for ASP.NET Core connection
-- CREATE USER 'fleetapp'@'localhost' IDENTIFIED BY 'your_secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON fleet_manager_pro.* TO 'fleetapp'@'localhost';
-- GRANT EXECUTE ON fleet_manager_pro.* TO 'fleetapp'@'localhost';
-- FLUSH PRIVILEGES;

-- ==================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==================================================

-- Additional indexes for better query performance
CREATE INDEX idx_vehicles_status_driver ON vehicles(status, current_driver_id);
CREATE INDEX idx_routes_status_dates ON routes(status, start_time, end_time);
CREATE INDEX idx_maintenance_due_dates ON maintenance_tasks(vehicle_id, scheduled_date, status);
CREATE INDEX idx_attendance_month ON attendance(driver_id, date, status);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at);

-- ==================================================
-- END OF SCHEMA
-- ==================================================

-- Show database summary
SELECT 'FleetManager Pro Database Schema Created Successfully!' as message;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'fleet_manager_pro';
SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'fleet_manager_pro' ORDER BY table_name;