const pool = require('../config/db');

class RenewalService {
    /**
     * Get all renewals grouped by vehicle
     */
    async getAll(query = {}) {
        let sql = `
            SELECT r.*, v.plate_number, v.brand, v.model
            FROM vehicle_renewals r
            JOIN vehicles v ON r.vehicle_id = v.id
            ORDER BY r.renew_date DESC
        `;
        const [rows] = await pool.execute(sql);
        return rows;
    }

    /**
     * Get renewals for a specific vehicle
     */
    async getByVehicleId(vehicleId) {
        const [rows] = await pool.execute(
            `SELECT * FROM vehicle_renewals WHERE vehicle_id = ? ORDER BY renew_date DESC`,
            [vehicleId]
        );
        return rows;
    }

    /**
     * Get vehicles summary with renewal counts
     */
    async getVehicleSummary() {
        const [rows] = await pool.execute(`
            SELECT 
                v.id, v.plate_number, v.brand, v.model, v.image_url,
                v.insurance_expire, v.tax_expire, v.act_expire,
                v.insurance_company, v.tax_provider, v.act_provider,
                v.insurance_price, v.tax_price, v.act_price,
                v.insurance_renew_date, v.tax_renew_date, v.act_renew_date,
                COUNT(r.id) AS renewal_count,
                SUM(CASE WHEN r.type = 'insurance' THEN 1 ELSE 0 END) AS insurance_count,
                SUM(CASE WHEN r.type = 'tax' THEN 1 ELSE 0 END) AS tax_count,
                SUM(CASE WHEN r.type = 'act' THEN 1 ELSE 0 END) AS act_count,
                COALESCE(SUM(CASE WHEN r.type = 'insurance' THEN r.total_cost ELSE 0 END), 0) AS insurance_spent,
                COALESCE(SUM(CASE WHEN r.type = 'tax' THEN r.total_cost ELSE 0 END), 0) AS tax_spent,
                COALESCE(SUM(CASE WHEN r.type = 'act' THEN r.total_cost ELSE 0 END), 0) AS act_spent,
                COALESCE(SUM(r.total_cost), 0) AS total_spent
            FROM vehicles v
            LEFT JOIN vehicle_renewals r ON v.id = r.vehicle_id
            GROUP BY v.id
            ORDER BY v.plate_number ASC
        `);
        return rows;
    }

    /**
     * Create a new renewal record
     */
    async create(data) {
        const {
            vehicle_id, type, renew_date, expire_date, provider, insurance_level,
            price, inspection_fee, service_fee, other_fee, notes, attachments
        } = data;

        const totalCost = (parseFloat(price) || 0)
            + (parseFloat(inspection_fee) || 0)
            + (parseFloat(service_fee) || 0)
            + (parseFloat(other_fee) || 0);

        const [result] = await pool.execute(
            `INSERT INTO vehicle_renewals 
             (vehicle_id, type, renew_date, expire_date, provider, insurance_level, price, inspection_fee, service_fee, other_fee, total_cost, notes, attachments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                vehicle_id, type,
                renew_date, expire_date || null,
                provider || null,
                insurance_level || null,
                parseFloat(price) || 0,
                parseFloat(inspection_fee) || 0,
                parseFloat(service_fee) || 0,
                parseFloat(other_fee) || 0,
                totalCost,
                notes || null,
                attachments || null
            ]
        );

        // Also update the matching column on the vehicles table
        if (type === 'insurance') {
            await pool.execute(
                `UPDATE vehicles SET insurance_expire = ?, insurance_company = ?, insurance_price = ?, insurance_renew_date = ?, insurance_level = ? WHERE id = ?`,
                [expire_date || null, provider || null, parseFloat(price) || 0, renew_date, insurance_level || null, vehicle_id]
            );
        } else if (type === 'tax') {
            await pool.execute(
                `UPDATE vehicles SET tax_expire = ?, tax_provider = ?, tax_price = ?, tax_renew_date = ? WHERE id = ?`,
                [expire_date || null, provider || null, parseFloat(price) || 0, renew_date, vehicle_id]
            );
        } else if (type === 'act') {
            await pool.execute(
                `UPDATE vehicles SET act_expire = ?, act_provider = ?, act_price = ?, act_renew_date = ? WHERE id = ?`,
                [expire_date || null, provider || null, parseFloat(price) || 0, renew_date, vehicle_id]
            );
        }

        return { id: result.insertId, total_cost: totalCost };
    }

    /**
     * Update a renewal record
     */
    async update(id, data) {
        const {
            type, renew_date, expire_date, provider, insurance_level,
            price, inspection_fee, service_fee, other_fee, notes
        } = data;

        const totalCost = (parseFloat(price) || 0)
            + (parseFloat(inspection_fee) || 0)
            + (parseFloat(service_fee) || 0)
            + (parseFloat(other_fee) || 0);

        // Get the vehicle_id first
        const [rows] = await pool.execute('SELECT vehicle_id FROM vehicle_renewals WHERE id = ?', [id]);
        if (rows.length === 0) {
            const error = new Error('ไม่พบรายการต่ออายุ');
            error.statusCode = 404;
            throw error;
        }
        const vehicle_id = rows[0].vehicle_id;

        await pool.execute(
            `UPDATE vehicle_renewals SET 
                type = ?, renew_date = ?, expire_date = ?, provider = ?, insurance_level = ?,
                price = ?, inspection_fee = ?, service_fee = ?, other_fee = ?, total_cost = ?, notes = ?
             WHERE id = ?`,
            [
                type, renew_date, expire_date || null, provider || null, insurance_level || null,
                parseFloat(price) || 0, parseFloat(inspection_fee) || 0, parseFloat(service_fee) || 0, parseFloat(other_fee) || 0,
                totalCost, notes || null, id
            ]
        );

        // Update matching columns on vehicles with the latest data
        if (type === 'insurance') {
            const [latest] = await pool.execute(
                `SELECT expire_date, provider, price, renew_date, insurance_level FROM vehicle_renewals 
                 WHERE vehicle_id = ? AND type = 'insurance' 
                 ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicle_id]
            );
            if (latest.length > 0) {
                await pool.execute(
                    `UPDATE vehicles SET insurance_expire = ?, insurance_company = ?, insurance_price = ?, insurance_renew_date = ?, insurance_level = ? WHERE id = ?`,
                    [latest[0].expire_date, latest[0].provider, latest[0].price, latest[0].renew_date, latest[0].insurance_level, vehicle_id]
                );
            }
        } else if (type === 'tax') {
            const [latest] = await pool.execute(
                `SELECT expire_date, provider, price, renew_date FROM vehicle_renewals 
                 WHERE vehicle_id = ? AND type = 'tax' 
                 ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicle_id]
            );
            if (latest.length > 0) {
                await pool.execute(
                    `UPDATE vehicles SET tax_expire = ?, tax_provider = ?, tax_price = ?, tax_renew_date = ? WHERE id = ?`,
                    [latest[0].expire_date, latest[0].provider, latest[0].price, latest[0].renew_date, vehicle_id]
                );
            }
        } else if (type === 'act') {
            const [latest] = await pool.execute(
                `SELECT expire_date, provider, price, renew_date FROM vehicle_renewals 
                 WHERE vehicle_id = ? AND type = 'act' 
                 ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicle_id]
            );
            if (latest.length > 0) {
                await pool.execute(
                    `UPDATE vehicles SET act_expire = ?, act_provider = ?, act_price = ?, act_renew_date = ? WHERE id = ?`,
                    [latest[0].expire_date, latest[0].provider, latest[0].price, latest[0].renew_date, vehicle_id]
                );
            }
        }

        return { id, total_cost: totalCost };
    }

    /**
     * Delete a renewal entry
     */
    async delete(id) {
        const [rows] = await pool.execute('SELECT * FROM vehicle_renewals WHERE id = ?', [id]);
        if (rows.length === 0) {
            const error = new Error('ไม่พบรายการต่ออายุ');
            error.statusCode = 404;
            throw error;
        }
        const vehicle_id = rows[0].vehicle_id;
        const type = rows[0].type;

        await pool.execute('DELETE FROM vehicle_renewals WHERE id = ?', [id]);

        // Update vehicle dates
        if (type === 'insurance') {
            const [latest] = await pool.execute(
                `SELECT expire_date, provider, price, renew_date, insurance_level FROM vehicle_renewals 
                 WHERE vehicle_id = ? AND type = 'insurance' 
                 ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicle_id]
            );
            if (latest.length > 0) {
                await pool.execute(
                    `UPDATE vehicles SET insurance_expire = ?, insurance_company = ?, insurance_price = ?, insurance_renew_date = ?, insurance_level = ? WHERE id = ?`,
                    [latest[0].expire_date, latest[0].provider, latest[0].price, latest[0].renew_date, latest[0].insurance_level, vehicle_id]
                );
            } else {
                await pool.execute(
                    `UPDATE vehicles SET insurance_expire = NULL, insurance_company = NULL, insurance_price = NULL, insurance_renew_date = NULL, insurance_level = NULL WHERE id = ?`,
                    [vehicle_id]
                );
            }
        } else if (type === 'tax') {
            const [latest] = await pool.execute(
                `SELECT expire_date, provider, price, renew_date FROM vehicle_renewals 
                 WHERE vehicle_id = ? AND type = 'tax' 
                 ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicle_id]
            );
            if (latest.length > 0) {
                await pool.execute(
                    `UPDATE vehicles SET tax_expire = ?, tax_provider = ?, tax_price = ?, tax_renew_date = ? WHERE id = ?`,
                    [latest[0].expire_date, latest[0].provider, latest[0].price, latest[0].renew_date, vehicle_id]
                );
            } else {
                await pool.execute(
                    `UPDATE vehicles SET tax_expire = NULL, tax_provider = NULL, tax_price = NULL, tax_renew_date = NULL WHERE id = ?`,
                    [vehicle_id]
                );
            }
        } else if (type === 'act') {
            const [latest] = await pool.execute(
                `SELECT expire_date, provider, price, renew_date FROM vehicle_renewals 
                 WHERE vehicle_id = ? AND type = 'act' 
                 ORDER BY renew_date DESC, id DESC LIMIT 1`,
                [vehicle_id]
            );
            if (latest.length > 0) {
                await pool.execute(
                    `UPDATE vehicles SET act_expire = ?, act_provider = ?, act_price = ?, act_renew_date = ? WHERE id = ?`,
                    [latest[0].expire_date, latest[0].provider, latest[0].price, latest[0].renew_date, vehicle_id]
                );
            } else {
                await pool.execute(
                    `UPDATE vehicles SET act_expire = NULL, act_provider = NULL, act_price = NULL, act_renew_date = NULL WHERE id = ?`,
                    [vehicle_id]
                );
            }
        }

        return { message: 'ลบรายการต่ออายุสำเร็จ' };
    }

    /**
     * Append attachments to a renewal record
     */
    async appendAttachments(id, newFilesList) {
        const [rows] = await pool.execute('SELECT attachments FROM vehicle_renewals WHERE id = ?', [id]);
        if (rows.length === 0) {
            const error = new Error('ไม่พบรายการต่ออายุ');
            error.statusCode = 404;
            throw error;
        }

        let current = [];
        if (rows[0].attachments) {
            try {
                current = JSON.parse(rows[0].attachments);
            } catch (e) {}
        }

        const updated = [...current, ...newFilesList];
        await pool.execute(
            'UPDATE vehicle_renewals SET attachments = ? WHERE id = ?',
            [JSON.stringify(updated), id]
        );
        return updated;
    }

    /**
     * Remove a specific attachment by its file path
     */
    async removeAttachment(id, filePath) {
        const [rows] = await pool.execute('SELECT attachments FROM vehicle_renewals WHERE id = ?', [id]);
        if (rows.length === 0) {
            const error = new Error('ไม่พบรายการต่ออายุ');
            error.statusCode = 404;
            throw error;
        }

        let current = [];
        if (rows[0].attachments) {
            try {
                current = JSON.parse(rows[0].attachments);
            } catch (e) {}
        }

        const updated = current.filter(f => f.file_path !== filePath);
        await pool.execute(
            'UPDATE vehicle_renewals SET attachments = ? WHERE id = ?',
            [updated.length > 0 ? JSON.stringify(updated) : null, id]
        );
        return updated;
    }
}

module.exports = new RenewalService();
