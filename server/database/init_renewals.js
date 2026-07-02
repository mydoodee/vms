const pool = require('../config/db');

async function initRenewalsTable() {
    console.log('⚡ Running database schema upgrades for Vehicle Renewals...');
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS vehicle_renewals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vehicle_id INT NOT NULL,
                type ENUM('insurance', 'tax') NOT NULL,
                renew_date DATE NOT NULL,
                expire_date DATE,
                provider VARCHAR(150),
                price DECIMAL(10,2) DEFAULT 0,
                inspection_fee DECIMAL(10,2) DEFAULT 0,
                service_fee DECIMAL(10,2) DEFAULT 0,
                other_fee DECIMAL(10,2) DEFAULT 0,
                total_cost DECIMAL(10,2) DEFAULT 0,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ vehicle_renewals table checked/created successfully.');

        // Upgrade vehicles.image_url to TEXT to support multiple images (JSON array)
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'image_url'`);
            if (cols.length > 0 && cols[0].Type.startsWith('varchar')) {
                await pool.execute(`ALTER TABLE vehicles MODIFY COLUMN image_url TEXT NULL`);
                console.log('✅ vehicles.image_url upgraded to TEXT for multi-image support.');
            }
        } catch (alterErr) {
            // Ignore if already TEXT
        }

        // Add insurance_level to vehicle_renewals
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicle_renewals LIKE 'insurance_level'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicle_renewals ADD COLUMN insurance_level VARCHAR(50) DEFAULT NULL AFTER provider`);
                console.log('✅ Added insurance_level column to vehicle_renewals.');
            }
        } catch (err) {
            console.error('⚠️ Could not add insurance_level:', err.message);
        }

        // Add attachments to vehicle_renewals
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicle_renewals LIKE 'attachments'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicle_renewals ADD COLUMN attachments TEXT DEFAULT NULL AFTER notes`);
                console.log('✅ Added attachments column to vehicle_renewals.');
            }
        } catch (err) {
            console.error('⚠️ Could not add attachments:', err.message);
        }

        // Add tax_provider to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'tax_provider'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN tax_provider VARCHAR(150) DEFAULT NULL AFTER tax_expire`);
                console.log('✅ Added tax_provider column to vehicles.');
            }
        } catch (err) {
            console.error('⚠️ Could not add tax_provider column:', err.message);
        }

        // Add document_url to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'document_url'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN document_url VARCHAR(1000) DEFAULT NULL AFTER image_url`);
                console.log('✅ Added document_url column to vehicles.');
            }
        } catch (err) {
            console.error('⚠️ Could not add document_url column:', err.message);
        }

        // Backfill tax_provider for vehicles from existing renewals
        try {
            await pool.execute(`
                UPDATE vehicles v
                JOIN (
                    SELECT r1.vehicle_id, r1.provider
                    FROM vehicle_renewals r1
                    JOIN (
                        SELECT vehicle_id, MAX(id) as max_id
                        FROM vehicle_renewals
                        WHERE type = 'tax'
                        GROUP BY vehicle_id
                    ) r2 ON r1.id = r2.max_id
                ) r ON v.id = r.vehicle_id
                SET v.tax_provider = r.provider
                WHERE v.tax_provider IS NULL AND r.provider IS NOT NULL
            `);
            console.log('✅ Backfilled tax_provider for vehicles from existing renewals.');
        } catch (err) {
            console.error('⚠️ Could not backfill tax_provider:', err.message);
        }

        // Alter assigned_driver to VARCHAR(255) and migrate values
        try {
            // Drop foreign key if it exists
            try {
                await pool.execute(`ALTER TABLE vehicles DROP FOREIGN KEY vehicles_ibfk_1`);
                console.log('✅ Dropped vehicles_ibfk_1 foreign key.');
            } catch (fkErr) {
                // Ignore if it was already dropped
            }

            // Modify column to VARCHAR(255)
            await pool.execute(`ALTER TABLE vehicles MODIFY COLUMN assigned_driver VARCHAR(255) DEFAULT NULL`);
            console.log('✅ Modified assigned_driver to VARCHAR(255).');

            // Migrate numeric IDs to fullnames
            await pool.execute(`
                UPDATE vehicles v 
                JOIN users u ON v.assigned_driver = CAST(u.id AS CHAR)
                SET v.assigned_driver = u.fullname
                WHERE v.assigned_driver REGEXP '^[0-9]+$'
            `);
            console.log('✅ Migrated assigned_driver IDs to fullnames.');
        } catch (err) {
            console.error('⚠️ Could not alter/migrate assigned_driver column:', err.message);
        }

        // Add work_registration column to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'work_registration'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN work_registration VARCHAR(255) DEFAULT NULL AFTER assigned_driver`);
                console.log('✅ Added work_registration column to vehicles table.');
            }
        } catch (err) {
            console.error('⚠️ Could not add work_registration column:', err.message);
        }

        // Add insurance_level column to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'insurance_level'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN insurance_level VARCHAR(50) DEFAULT NULL AFTER insurance_company`);
                console.log('✅ Added insurance_level column to vehicles table.');
            }
        } catch (err) {
            console.error('⚠️ Could not add insurance_level column to vehicles:', err.message);
        }

        // Add tax_price column to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'tax_price'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN tax_price DECIMAL(10,2) DEFAULT NULL AFTER tax_provider`);
                console.log('✅ Added tax_price column to vehicles table.');
            }
        } catch (err) {
            console.error('⚠️ Could not add tax_price column to vehicles:', err.message);
        }

        // Add tax_renew_date column to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'tax_renew_date'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN tax_renew_date DATE DEFAULT NULL AFTER tax_price`);
                console.log('✅ Added tax_renew_date column to vehicles table.');
            }
        } catch (err) {
            console.error('⚠️ Could not add tax_renew_date column to vehicles:', err.message);
        }

        // Add act_expire column to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'act_expire'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN act_expire DATE DEFAULT NULL AFTER tax_renew_date`);
                console.log('✅ Added act_expire column to vehicles table.');
            }
        } catch (err) {
            console.error('⚠️ Could not add act_expire column to vehicles:', err.message);
        }

        // Add act_provider column to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'act_provider'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN act_provider VARCHAR(150) DEFAULT NULL AFTER act_expire`);
                console.log('✅ Added act_provider column to vehicles table.');
            }
        } catch (err) {
            console.error('⚠️ Could not add act_provider column to vehicles:', err.message);
        }

        // Add act_price column to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'act_price'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN act_price DECIMAL(10,2) DEFAULT NULL AFTER act_provider`);
                console.log('✅ Added act_price column to vehicles table.');
            }
        } catch (err) {
            console.error('⚠️ Could not add act_price column to vehicles:', err.message);
        }

        // Add act_renew_date column to vehicles table
        try {
            const [cols] = await pool.execute(`SHOW COLUMNS FROM vehicles LIKE 'act_renew_date'`);
            if (cols.length === 0) {
                await pool.execute(`ALTER TABLE vehicles ADD COLUMN act_renew_date DATE DEFAULT NULL AFTER act_price`);
                console.log('✅ Added act_renew_date column to vehicles table.');
            }
        } catch (err) {
            console.error('⚠️ Could not add act_renew_date column to vehicles:', err.message);
        }

        // Upgrade type ENUM in vehicle_renewals table to include 'act'
        try {
            await pool.execute(`ALTER TABLE vehicle_renewals MODIFY COLUMN type ENUM('insurance', 'tax', 'act') NOT NULL`);
            console.log('✅ Upgraded vehicle_renewals.type enum to support act.');
        } catch (err) {
            console.error('⚠️ Could not upgrade vehicle_renewals.type enum:', err.message);
        }
    } catch (err) {
        console.error('❌ Error initializing vehicle_renewals table:', err.message);
    }
}

module.exports = initRenewalsTable;
