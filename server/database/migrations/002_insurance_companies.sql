-- =============================================
-- Insurance Companies Table
-- =============================================
CREATE TABLE IF NOT EXISTS insurance_companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed some common Thai insurance companies
INSERT IGNORE INTO insurance_companies (name) VALUES
('วิริยะประกันภัย'),
('กรุงเทพประกันภัย'),
('ทิพยประกันภัย'),
('เมืองไทยประกันภัย'),
('สินมั่นคงประกันภัย'),
('ไทยศรีประกันภัย'),
('ธนชาตประกันภัย'),
('อาคเนย์ประกันภัย'),
('ประกันคุ้มภัย'),
('นำสินประกันภัย');
