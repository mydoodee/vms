-- =============================================
-- Vehicle Maintenance System (VMS) 
-- Database Migration: Initial Schema
-- =============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    department VARCHAR(100),
    avatar_url VARCHAR(500),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50),
    year INT,
    color VARCHAR(30),
    engine_number VARCHAR(50),
    vin VARCHAR(50),
    mileage INT DEFAULT 0,
    fuel_type ENUM('gasoline', 'diesel', 'electric', 'hybrid', 'lpg') DEFAULT 'gasoline',
    insurance_expire DATE,
    insurance_company VARCHAR(150) NULL,
    insurance_price DECIMAL(10,2) NULL,
    insurance_renew_date DATE NULL,
    tax_expire DATE,
    status ENUM('active', 'maintenance', 'disabled', 'sold') DEFAULT 'active',
    department VARCHAR(100),
    assigned_driver INT,
    image_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_driver) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Repair Tickets Table
CREATE TABLE IF NOT EXISTS repair_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(20) UNIQUE NOT NULL,
    vehicle_id INT NOT NULL,
    reported_by INT NOT NULL,
    problem_type ENUM('engine', 'brake', 'tire', 'air_conditioner', 'battery', 'electrical', 'body', 'suspension', 'transmission', 'other') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('reported', 'reviewing', 'approved', 'repairing', 'completed', 'closed') DEFAULT 'reported',
    estimated_cost DECIMAL(12,2) DEFAULT 0.00,
    actual_cost DECIMAL(12,2) DEFAULT 0.00,
    garage_name VARCHAR(200),
    approved_by INT,
    approved_at DATETIME,
    repair_started_at DATETIME,
    completed_at DATETIME,
    closed_at DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Attachments Table
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES repair_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Repair Costs Table
CREATE TABLE IF NOT EXISTS repair_costs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT UNIQUE NOT NULL,
    labor_cost DECIMAL(12,2) DEFAULT 0.00,
    parts_cost DECIMAL(12,2) DEFAULT 0.00,
    other_cost DECIMAL(12,2) DEFAULT 0.00,
    total_cost DECIMAL(12,2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES repair_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance Schedule Table (Phase 2 ready)
CREATE TABLE IF NOT EXISTS maintenance_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    next_due_date DATE,
    next_due_mileage INT,
    interval_days INT,
    interval_mileage INT,
    notify_before_days INT DEFAULT 30,
    is_active TINYINT(1) DEFAULT 1,
    last_service_date DATE,
    last_notified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table (Phase 2 ready)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    reference_type VARCHAR(50),
    reference_id INT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_tickets_status ON repair_tickets(status);
CREATE INDEX idx_tickets_vehicle ON repair_tickets(vehicle_id);
CREATE INDEX idx_tickets_reported_by ON repair_tickets(reported_by);
CREATE INDEX idx_tickets_created ON repair_tickets(created_at);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX idx_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_maintenance_vehicle ON maintenance_schedule(vehicle_id);
CREATE INDEX idx_maintenance_due ON maintenance_schedule(next_due_date);

-- Vehicle Renewals Table
CREATE TABLE IF NOT EXISTS vehicle_renewals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    type ENUM('insurance', 'tax') NOT NULL,
    renew_date DATE NOT NULL,
    expire_date DATE,
    provider VARCHAR(150),
    price DECIMAL(10,2) DEFAULT 0.00,
    inspection_fee DECIMAL(10,2) DEFAULT 0.00,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    other_fee DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_renewals_vehicle ON vehicle_renewals(vehicle_id);
CREATE INDEX idx_renewals_date ON vehicle_renewals(renew_date);
