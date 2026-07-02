const pool = require('../config/db');

async function initInsuranceCompaniesTable() {
    console.log('⚡ Running database schema upgrades for Insurance Companies...');
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS insurance_companies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL UNIQUE,
                phone VARCHAR(50) DEFAULT NULL,
                contact_person VARCHAR(100) DEFAULT NULL,
                address TEXT DEFAULT NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ insurance_companies table checked/created successfully.');

        // Add phone, contact_person, and address columns to insurance_companies table if they don't exist
        const colsToCheck = ['phone', 'contact_person', 'address'];
        for (const col of colsToCheck) {
            const [cols] = await pool.query(`SHOW COLUMNS FROM insurance_companies LIKE ?`, [col]);
            if (cols.length === 0) {
                let type = 'VARCHAR(100)';
                if (col === 'phone') type = 'VARCHAR(50)';
                if (col === 'address') type = 'TEXT';
                await pool.execute(`ALTER TABLE insurance_companies ADD COLUMN \`${col}\` ${type} DEFAULT NULL`);
                console.log(`✅ Added column ${col} to insurance_companies.`);
            }
        }

        // Seed common Thai insurance companies if table is empty
        const [rows] = await pool.execute('SELECT COUNT(*) AS cnt FROM insurance_companies');
        if (rows[0].cnt === 0) {
            const companies = [
                'วิริยะประกันภัย',
                'กรุงเทพประกันภัย',
                'ทิพยประกันภัย',
                'เมืองไทยประกันภัย',
                'สินมั่นคงประกันภัย',
                'ไทยศรีประกันภัย',
                'ธนชาตประกันภัย',
                'อาคเนย์ประกันภัย',
                'ประกันคุ้มภัย',
                'นำสินประกันภัย'
            ];
            for (const name of companies) {
                try {
                    await pool.execute('INSERT INTO insurance_companies (name) VALUES (?)', [name]);
                } catch (e) {
                    // Ignore duplicates
                }
            }
            console.log('✅ Seeded default insurance companies.');
        }
    } catch (err) {
        console.error('❌ Error initializing insurance_companies table:', err.message);
    }
}

module.exports = initInsuranceCompaniesTable;
