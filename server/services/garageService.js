const pool = require('../config/db');

class GarageService {
    async getAll(query = {}) {
        let sql = 'SELECT * FROM garages';
        const params = [];
        const conditions = [];

        if (query.status) {
            conditions.push('status = ?');
            params.push(query.status);
        }

        if (query.search) {
            conditions.push('(name LIKE ? OR phone LIKE ? OR contact_person LIKE ? OR address LIKE ?)');
            const searchTerm = `%${query.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY name ASC';

        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    async getById(id) {
        const [rows] = await pool.execute('SELECT * FROM garages WHERE id = ?', [id]);
        if (rows.length === 0) {
            const error = new Error('ไม่พบข้อมูลอู่/ศูนย์บริการที่ระบุ');
            error.statusCode = 404;
            throw error;
        }
        return rows[0];
    }

    async create(garageData) {
        const { name, phone, address, contact_person, status } = garageData;

        // Check unique name
        const [existing] = await pool.execute('SELECT id FROM garages WHERE name = ?', [name]);
        if (existing.length > 0) {
            const error = new Error('มีอู่/ศูนย์บริการชื่อนี้ในระบบแล้ว');
            error.statusCode = 400;
            throw error;
        }

        const [result] = await pool.execute(
            `INSERT INTO garages (name, phone, address, contact_person, status) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, phone || null, address || null, contact_person || null, status || 'active']
        );

        return this.getById(result.insertId);
    }

    async update(id, garageData) {
        await this.getById(id); // verify exists

        const { name, phone, address, contact_person, status } = garageData;

        // Check unique name on other records
        if (name) {
            const [existing] = await pool.execute('SELECT id FROM garages WHERE name = ? AND id != ?', [name, id]);
            if (existing.length > 0) {
                const error = new Error('มีอู่/ศูนย์บริการชื่อนี้ในระบบแล้ว');
                error.statusCode = 400;
                throw error;
            }
        }

        const fields = [];
        const params = [];

        if (name !== undefined) { fields.push('name = ?'); params.push(name); }
        if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
        if (address !== undefined) { fields.push('address = ?'); params.push(address); }
        if (contact_person !== undefined) { fields.push('contact_person = ?'); params.push(contact_person); }
        if (status !== undefined) { fields.push('status = ?'); params.push(status); }

        if (fields.length === 0) {
            return this.getById(id);
        }

        params.push(id);
        const sql = `UPDATE garages SET ${fields.join(', ')} WHERE id = ?`;
        await pool.execute(sql, params);

        return this.getById(id);
    }

    async delete(id) {
        await this.getById(id); // verify exists
        
        // We will do a physical delete, but MySQL will set NULL in repair_tickets due to FOREIGN KEY constraint
        await pool.execute('DELETE FROM garages WHERE id = ?', [id]);
        return { message: 'ลบข้อมูลอู่/ศูนย์บริการสำเร็จ' };
    }
}

module.exports = new GarageService();
