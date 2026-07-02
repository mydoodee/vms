const pool = require('../config/db');

async function initGaragesTable() {
    console.log('⚡ Running database schema upgrades for Garages...');
    try {
        // 1. Create garages table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS garages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) UNIQUE NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                contact_person VARCHAR(100),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Garages table checked/created successfully.');

        // 2. Check if garage_id column exists in repair_tickets
        const [columns] = await pool.execute(`
            SHOW COLUMNS FROM repair_tickets LIKE 'garage_id'
        `);

        if (columns.length === 0) {
            console.log('➕ Adding garage_id column to repair_tickets...');
            // Add column
            await pool.execute(`
                ALTER TABLE repair_tickets 
                ADD COLUMN garage_id INT NULL AFTER garage_name
            `);
            // Add constraint
            await pool.execute(`
                ALTER TABLE repair_tickets 
                ADD CONSTRAINT fk_tickets_garage 
                FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE SET NULL
            `);
            console.log('✅ garage_id column and foreign key added successfully.');
        } else {
            console.log('✅ garage_id column already exists in repair_tickets.');
        }

        // 3. Seed some default garages if table is empty
        const [garages] = await pool.execute('SELECT id FROM garages LIMIT 1');
        if (garages.length === 0) {
            console.log('🌱 Seeding initial garages...');
            const initialGarages = [
                ['ศูนย์บริการโตโยต้า สาขาพระราม 9', '02-123-4567', '999 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ', 'คุณสมพงษ์'],
                ['ศูนย์บริการฮอนด้า สาขาวิภาวดี', '02-987-6543', '123 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ', 'คุณสมศรี'],
                ['อู่เจริญยนต์การช่าง (อู่ซ่อมเครื่องยนต์ทั่วไป)', '081-234-5678', '45/1 ถนนศรีนครินทร์ แขวงหนองบอน เขตประเวศ กรุงเทพฯ', 'ช่างเจริญ'],
                ['ร้านบี-ควิก สาขาพัฒนาการ (ยาง/เบรก/โช้ค)', '02-555-9999', '789 ถนนพัฒนาการ แขวงสวนหลวง เขตสวนหลวง กรุงเทพฯ', 'ผู้จัดการสาขา']
            ];

            for (const g of initialGarages) {
                await pool.execute(
                    `INSERT INTO garages (name, phone, address, contact_person) 
                     VALUES (?, ?, ?, ?)`,
                    g
                );
            }
            console.log('✅ Seeded initial garages successfully.');
        }

    } catch (err) {
        console.error('❌ Error initializing garages table:', err.message);
    }
}

module.exports = initGaragesTable;
