const pool = require('../config/db');

class VehicleService {
    async getAll(query = {}) {
        let sql = 'SELECT v.*, v.assigned_driver as driver_name FROM vehicles v';
        const params = [];
        const conditions = [];

        if (query.status) {
            conditions.push('v.status = ?');
            params.push(query.status);
        }
        if (query.brand) {
            conditions.push('v.brand = ?');
            params.push(query.brand);
        }
        if (query.department) {
            conditions.push('v.department = ?');
            params.push(query.department);
        }
        if (query.assigned_driver) {
            conditions.push('v.assigned_driver = ?');
            params.push(query.assigned_driver);
        }
        if (query.vehicleIds && query.vehicleIds.length > 0) {
            const placeholders = query.vehicleIds.map(() => '?').join(', ');
            conditions.push(`v.id IN (${placeholders})`);
            params.push(...query.vehicleIds);
        }
        if (query.search) {
            conditions.push('(v.plate_number LIKE ? OR v.brand LIKE ? OR v.model LIKE ?)');
            const searchTerm = `%${query.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY v.created_at DESC';

        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    async getById(id) {
        const [rows] = await pool.execute(
            `SELECT v.*, v.assigned_driver as driver_name 
             FROM vehicles v 
             WHERE v.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            const error = new Error('ไม่พบข้อมูลรถยนต์');
            error.statusCode = 404;
            throw error;
        }

        // Get repair history
        const [tickets] = await pool.execute(
            `SELECT rt.*, u.fullname as reporter_name 
             FROM repair_tickets rt 
             LEFT JOIN users u ON rt.reported_by = u.id 
             WHERE rt.vehicle_id = ? 
             ORDER BY rt.created_at DESC 
             LIMIT 10`,
            [id]
        );

        // Get maintenance schedule
        const [schedules] = await pool.execute(
            'SELECT * FROM maintenance_schedule WHERE vehicle_id = ? ORDER BY next_due_date ASC',
            [id]
        );

        return { ...rows[0], repair_history: tickets, maintenance_schedules: schedules };
    }

    async create(vehicleData) {
        const {
            plate_number, brand, model, year, color, engine_number, vin,
            mileage, fuel_type, insurance_expire, tax_expire, status,
            department, assigned_driver, image_url, document_url, notes,
            insurance_company, insurance_price, insurance_renew_date, work_registration,
            insurance_level, tax_provider, tax_price, tax_renew_date,
            act_expire, act_provider, act_price, act_renew_date, tax_inspection_fee
        } = vehicleData;

        const [result] = await pool.execute(
            `INSERT INTO vehicles (plate_number, brand, model, year, color, engine_number, vin, mileage, fuel_type, insurance_expire, tax_expire, status, department, assigned_driver, image_url, document_url, notes, insurance_company, insurance_price, insurance_renew_date, work_registration, insurance_level, tax_provider, tax_price, tax_renew_date, act_expire, act_provider, act_price, act_renew_date, tax_inspection_fee)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [plate_number, brand, model || null, year || null, color || null,
             engine_number || null, vin || null, mileage || 0, fuel_type || 'gasoline',
             insurance_expire || null, tax_expire || null, status || 'active',
             department || null, assigned_driver || null, image_url || null, document_url || null, notes || null,
             insurance_company || null, insurance_price || null, insurance_renew_date || null, work_registration || null,
             insurance_level || null, tax_provider || null, tax_price || null, tax_renew_date || null,
             act_expire || null, act_provider || null, act_price || null, act_renew_date || null, tax_inspection_fee || 0]
        );

        const newVehicle = await this.getById(result.insertId);
        await this.syncRenewals(result.insertId, newVehicle);
        return newVehicle;
    }

    async update(id, vehicleData) {
        // Check vehicle exists
        await this.getById(id);

        const fields = [];
        const params = [];
        const allowedFields = [
            'plate_number', 'brand', 'model', 'year', 'color', 'engine_number',
            'vin', 'mileage', 'fuel_type', 'insurance_expire', 'tax_expire',
            'status', 'department', 'assigned_driver', 'image_url', 'document_url', 'notes',
            'insurance_company', 'insurance_price', 'insurance_renew_date', 'work_registration',
            'insurance_level', 'tax_provider', 'tax_price', 'tax_renew_date',
            'act_expire', 'act_provider', 'act_price', 'act_renew_date', 'tax_inspection_fee'
        ];

        for (const field of allowedFields) {
            if (vehicleData[field] !== undefined) {
                fields.push(`${field} = ?`);
                params.push(vehicleData[field]);
            }
        }

        if (fields.length === 0) {
            const error = new Error('ไม่มีข้อมูลที่ต้องอัปเดต');
            error.statusCode = 400;
            throw error;
        }

        params.push(id);
        await pool.execute(
            `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        const updatedVehicle = await this.getById(id);
        await this.syncRenewals(id, updatedVehicle);
        return updatedVehicle;
    }

    async delete(id) {
        await this.getById(id);
        await pool.execute('DELETE FROM vehicles WHERE id = ?', [id]);
        return { message: 'ลบรถยนต์สำเร็จ' };
    }

    async getStats() {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as in_maintenance,
                SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled,
                SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold
            FROM vehicles
        `);
        return stats[0];
    }

    async syncRenewals(vehicleId, vehicleData) {
        // Sync insurance
        if (vehicleData.insurance_renew_date) {
            const [rows] = await pool.execute(
                `SELECT id FROM vehicle_renewals WHERE vehicle_id = ? AND type = 'insurance' ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicleId]
            );
            const price = parseFloat(vehicleData.insurance_price) || 0;
            if (rows.length > 0) {
                await pool.execute(
                    `UPDATE vehicle_renewals SET provider = ?, price = ?, renew_date = ?, expire_date = ?, insurance_level = ?, total_cost = ?, inspection_fee = 0 WHERE id = ?`,
                    [vehicleData.insurance_company || null, price, vehicleData.insurance_renew_date, vehicleData.insurance_expire || null, vehicleData.insurance_level || null, price, rows[0].id]
                );
            } else {
                await pool.execute(
                    `INSERT INTO vehicle_renewals (vehicle_id, type, provider, price, renew_date, expire_date, insurance_level, total_cost, inspection_fee) VALUES (?, 'insurance', ?, ?, ?, ?, ?, ?, 0)`,
                    [vehicleId, vehicleData.insurance_company || null, price, vehicleData.insurance_renew_date, vehicleData.insurance_expire || null, vehicleData.insurance_level || null, price]
                );
            }
        }

        // Sync tax
        if (vehicleData.tax_renew_date) {
            const [rows] = await pool.execute(
                `SELECT id FROM vehicle_renewals WHERE vehicle_id = ? AND type = 'tax' ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicleId]
            );
            const price = parseFloat(vehicleData.tax_price) || 0;
            const inspectionFee = parseFloat(vehicleData.tax_inspection_fee) || 0;
            const totalCost = price + inspectionFee;
            if (rows.length > 0) {
                await pool.execute(
                    `UPDATE vehicle_renewals SET provider = ?, price = ?, inspection_fee = ?, renew_date = ?, expire_date = ?, total_cost = ? WHERE id = ?`,
                    [vehicleData.tax_provider || null, price, inspectionFee, vehicleData.tax_renew_date, vehicleData.tax_expire || null, totalCost, rows[0].id]
                );
            } else {
                await pool.execute(
                    `INSERT INTO vehicle_renewals (vehicle_id, type, provider, price, inspection_fee, renew_date, expire_date, total_cost) VALUES (?, 'tax', ?, ?, ?, ?, ?, ?)`,
                    [vehicleId, vehicleData.tax_provider || null, price, inspectionFee, vehicleData.tax_renew_date, vehicleData.tax_expire || null, totalCost]
                );
            }
        }

        // Sync act
        if (vehicleData.act_renew_date) {
            const [rows] = await pool.execute(
                `SELECT id FROM vehicle_renewals WHERE vehicle_id = ? AND type = 'act' ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicleId]
            );
            const price = parseFloat(vehicleData.act_price) || 0;
            if (rows.length > 0) {
                await pool.execute(
                    `UPDATE vehicle_renewals SET provider = ?, price = ?, renew_date = ?, expire_date = ?, total_cost = ?, inspection_fee = 0 WHERE id = ?`,
                    [vehicleData.act_provider || null, price, vehicleData.act_renew_date, vehicleData.act_expire || null, price, rows[0].id]
                );
            } else {
                await pool.execute(
                    `INSERT INTO vehicle_renewals (vehicle_id, type, provider, price, renew_date, expire_date, total_cost, inspection_fee) VALUES (?, 'act', ?, ?, ?, ?, ?, 0)`,
                    [vehicleId, vehicleData.act_provider || null, price, vehicleData.act_renew_date, vehicleData.act_expire || null, price]
                );
            }
        }
    }
}

module.exports = new VehicleService();
