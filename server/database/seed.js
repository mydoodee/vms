const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');

async function seed() {
    console.log('🚗 AMS Database Seeder Starting...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    });

    try {
        // Run migration
        console.log('📦 Running migration...');
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', '001_initial_schema.sql'),
            'utf8'
        );
        await connection.query(migrationSQL);
        console.log('✅ Migration completed\n');

        // Seed admin user
        console.log('👤 Seeding admin user...');
        const hashedPassword = await bcrypt.hash('Spk@12356', 12);
        
        await connection.execute(
            `INSERT INTO users (username, password, fullname, email, phone, role, department)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE password = VALUES(password)`,
            ['admin', hashedPassword, 'System Administrator', 'spkbkk@gmail.com', '0800000000', 'admin', 'IT']
        );
        console.log('✅ Admin user created (admin / Spk@12356)\n');

        // Seed sample manager
        const managerPass = await bcrypt.hash('Manager@123', 12);
        await connection.execute(
            `INSERT INTO users (username, password, fullname, email, phone, role, department)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE password = VALUES(password)`,
            ['manager1', managerPass, 'สมชาย จัดการดี', 'manager@company.com', '0811111111', 'manager', 'Fleet Management']
        );
        console.log('✅ Manager user created (manager1 / Manager@123)\n');

        // Seed sample user
        const userPass = await bcrypt.hash('User@123', 12);
        await connection.execute(
            `INSERT INTO users (username, password, fullname, email, phone, role, department)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE password = VALUES(password)`,
            ['driver1', userPass, 'สมศักดิ์ ขับดี', 'driver@company.com', '0822222222', 'user', 'Logistics']
        );
        console.log('✅ Driver user created (driver1 / User@123)\n');

        // Seed sample vehicles
        console.log('🚗 Seeding sample vehicles...');
        const vehicles = [
            ['1กก1234', 'Toyota', 'Hilux Revo', 2023, 'White', 'ENG001', 'VIN001', 45000, 'diesel', '2026-12-31', '2026-09-30', 'active', 'Logistics'],
            ['2ขข5678', 'Honda', 'City', 2024, 'Black', 'ENG002', 'VIN002', 15000, 'gasoline', '2027-03-15', '2026-11-30', 'active', 'Executive'],
            ['3คค9012', 'Isuzu', 'D-Max', 2022, 'Silver', 'ENG003', 'VIN003', 82000, 'diesel', '2026-08-20', '2026-07-15', 'active', 'Delivery'],
            ['4งง3456', 'Toyota', 'Camry', 2024, 'Black', 'ENG004', 'VIN004', 8000, 'hybrid', '2027-06-30', '2027-01-31', 'active', 'Executive'],
            ['5จจ7890', 'Nissan', 'Navara', 2021, 'Blue', 'ENG005', 'VIN005', 120000, 'diesel', '2026-07-31', '2026-08-31', 'maintenance', 'Logistics'],
        ];

        for (const v of vehicles) {
            await connection.execute(
                `INSERT INTO vehicles (plate_number, brand, model, year, color, engine_number, vin, mileage, fuel_type, insurance_expire, tax_expire, status, department)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE brand = VALUES(brand)`,
                v
            );
        }
        console.log(`✅ ${vehicles.length} vehicles seeded\n`);

        // Seed sample tickets
        console.log('🎫 Seeding sample repair tickets...');
        const tickets = [
            ['TK-20260001', 1, 3, 'engine', 'high', 'เครื่องยนต์มีเสียงดังผิดปกติ', 'เสียงดังจากห้องเครื่องขณะขับความเร็วสูง', 'repairing', 15000, 0],
            ['TK-20260002', 3, 3, 'tire', 'medium', 'ยางหน้าขวาสึก', 'ยางหน้าขวาสึกมาก ต้องเปลี่ยน', 'completed', 8000, 7500],
            ['TK-20260003', 5, 3, 'battery', 'critical', 'แบตเตอรี่เสื่อม สตาร์ทไม่ติด', 'รถสตาร์ทไม่ติดตอนเช้า มีเสียงคลิก', 'approved', 5000, 0],
            ['TK-20260004', 2, 3, 'air_conditioner', 'low', 'แอร์ไม่เย็น', 'แอร์เปิดแล้วลมไม่เย็น น่าจะน้ำยาแอร์หมด', 'reported', 3000, 0],
            ['TK-20260005', 4, 3, 'brake', 'high', 'เบรคมีเสียงดังเอี๊ยด', 'เบรคมีเสียงเวลาเหยียบ ผ้าเบรคน่าจะหมด', 'reviewing', 6000, 0],
        ];

        for (const t of tickets) {
            await connection.execute(
                `INSERT INTO repair_tickets (ticket_id, vehicle_id, reported_by, problem_type, severity, title, description, status, estimated_cost, actual_cost)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status)`,
                t
            );
        }
        console.log(`✅ ${tickets.length} repair tickets seeded\n`);

        // Seed repair costs for completed ticket
        await connection.execute(
            `INSERT INTO repair_costs (ticket_id, labor_cost, parts_cost, other_cost, total_cost, description)
             VALUES (2, 1500, 5500, 500, 7500, 'เปลี่ยนยางใหม่ 1 เส้น + ค่าแรง + ค่าถ่วงล้อ')
             ON DUPLICATE KEY UPDATE total_cost = VALUES(total_cost)`
        );
        console.log('✅ Repair costs seeded\n');

        // Seed maintenance schedules
        console.log('📅 Seeding maintenance schedules...');
        const schedules = [
            [1, 'เปลี่ยนน้ำมันเครื่อง', '2026-08-15', 50000, 180, 10000, 30],
            [1, 'เปลี่ยนผ้าเบรค', '2026-10-01', 60000, 365, 20000, 30],
            [2, 'เปลี่ยนน้ำมันเครื่อง', '2026-07-20', 20000, 180, 10000, 30],
            [3, 'เปลี่ยนยาง', '2026-07-25', 90000, 730, 40000, 30],
            [5, 'เปลี่ยนแบตเตอรี่', '2026-07-15', 125000, 730, 50000, 30],
        ];

        for (const s of schedules) {
            await connection.execute(
                `INSERT INTO maintenance_schedule (vehicle_id, service_type, next_due_date, next_due_mileage, interval_days, interval_mileage, notify_before_days)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                s
            );
        }
        console.log(`✅ ${schedules.length} maintenance schedules seeded\n`);

        console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
