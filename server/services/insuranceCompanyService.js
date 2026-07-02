const pool = require('../config/db');

class InsuranceCompanyService {
    async getAll(query = {}) {
        let sql = 'SELECT * FROM insurance_companies WHERE is_active = 1';
        const params = [];
        const conditions = [];

        if (query.search) {
            conditions.push('(name LIKE ? OR phone LIKE ? OR contact_person LIKE ? OR address LIKE ?)');
            const searchTerm = `%${query.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            sql += ' AND ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY name ASC';

        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    async getById(id) {
        const [rows] = await pool.execute('SELECT * FROM insurance_companies WHERE id = ?', [id]);
        if (rows.length === 0) {
            const error = new Error('ไม่พบข้อมูลบริษัทประกัน');
            error.statusCode = 404;
            throw error;
        }
        return rows[0];
    }

    async create(data) {
        const { name, phone, contact_person, address } = data;
        if (!name || !name.trim()) {
            const error = new Error('กรุณากรอกชื่อบริษัทประกัน');
            error.statusCode = 400;
            throw error;
        }
        const trimmed = name.trim();

        // Check duplicate
        const [existing] = await pool.execute(
            'SELECT id, is_active FROM insurance_companies WHERE name = ?',
            [trimmed]
        );
        if (existing.length > 0) {
            // If exists but inactive, reactivate and update fields
            if (existing[0].is_active === 0) {
                await pool.execute(
                    'UPDATE insurance_companies SET is_active = 1, phone = ?, contact_person = ?, address = ? WHERE id = ?',
                    [phone || null, contact_person || null, address || null, existing[0].id]
                );
                return this.getById(existing[0].id);
            }
            const error = new Error('บริษัทประกันนี้มีอยู่แล้ว');
            error.statusCode = 409;
            throw error;
        }

        const [result] = await pool.execute(
            'INSERT INTO insurance_companies (name, phone, contact_person, address, is_active) VALUES (?, ?, ?, ?, 1)',
            [trimmed, phone || null, contact_person || null, address || null]
        );
        return this.getById(result.insertId);
    }

    async update(id, data) {
        await this.getById(id); // verify exists

        const { name, phone, contact_person, address, is_active } = data;
        if (name) {
            const trimmed = name.trim();
            const [existing] = await pool.execute(
                'SELECT id FROM insurance_companies WHERE name = ? AND id != ?',
                [trimmed, id]
            );
            if (existing.length > 0) {
                const error = new Error('มีบริษัทประกันชื่อนี้ในระบบแล้ว');
                error.statusCode = 400;
                throw error;
            }
        }

        const fields = [];
        const params = [];

        if (name !== undefined) { fields.push('name = ?'); params.push(name.trim()); }
        if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
        if (contact_person !== undefined) { fields.push('contact_person = ?'); params.push(contact_person); }
        if (address !== undefined) { fields.push('address = ?'); params.push(address); }
        if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active); }

        if (fields.length === 0) {
            return this.getById(id);
        }

        params.push(id);
        const sql = `UPDATE insurance_companies SET ${fields.join(', ')} WHERE id = ?`;
        await pool.execute(sql, params);

        return this.getById(id);
    }

    async delete(id) {
        await this.getById(id); // verify exists
        
        // Soft delete for insurance companies (set is_active = 0)
        await pool.execute(
            'UPDATE insurance_companies SET is_active = 0 WHERE id = ?',
            [id]
        );
        return { message: 'ลบบริษัทประกันสำเร็จ' };
    }
}

module.exports = new InsuranceCompanyService();
