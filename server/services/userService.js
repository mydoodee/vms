const bcrypt = require('bcrypt');
const pool = require('../config/db');

class UserService {
    async getAll(query = {}) {
        let sql = 'SELECT id, username, fullname, email, phone, role, department, avatar_url, is_active, created_at, updated_at FROM users';
        const params = [];
        const conditions = [];

        if (query.role) {
            conditions.push('role = ?');
            params.push(query.role);
        }
        if (query.department) {
            conditions.push('department = ?');
            params.push(query.department);
        }
        if (query.search) {
            conditions.push('(fullname LIKE ? OR username LIKE ? OR email LIKE ?)');
            const searchTerm = `%${query.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    async getById(id) {
        const [rows] = await pool.execute(
            'SELECT id, username, fullname, email, phone, role, department, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            const error = new Error('ไม่พบผู้ใช้งาน');
            error.statusCode = 404;
            throw error;
        }

        return rows[0];
    }

    async create(userData) {
        const { username, password, fullname, email, phone, role, department } = userData;

        // Check duplicate username
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );
        if (existing.length > 0) {
            const error = new Error('ชื่อผู้ใช้นี้มีอยู่แล้ว');
            error.statusCode = 409;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            'INSERT INTO users (username, password, fullname, email, phone, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, fullname, email || null, phone || null, role || 'user', department || null]
        );

        return this.getById(result.insertId);
    }

    async update(id, userData) {
        const { fullname, email, phone, role, department, is_active } = userData;

        // Check user exists
        await this.getById(id);

        const fields = [];
        const params = [];

        if (fullname !== undefined) { fields.push('fullname = ?'); params.push(fullname); }
        if (email !== undefined) { fields.push('email = ?'); params.push(email); }
        if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
        if (role !== undefined) { fields.push('role = ?'); params.push(role); }
        if (department !== undefined) { fields.push('department = ?'); params.push(department); }
        if (is_active !== undefined) { fields.push('is_active = ?'); params.push(is_active); }

        if (fields.length === 0) {
            const error = new Error('ไม่มีข้อมูลที่ต้องอัปเดต');
            error.statusCode = 400;
            throw error;
        }

        params.push(id);
        await pool.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        return this.getById(id);
    }

    async resetPassword(id, newPassword) {
        await this.getById(id);
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
        return { message: 'รีเซ็ตรหัสผ่านสำเร็จ' };
    }

    async delete(id) {
        await this.getById(id);
        try {
            // Attempt to hard-delete the user first
            await pool.execute('DELETE FROM users WHERE id = ?', [id]);
            return { message: 'ลบผู้ใช้งานออกจากระบบเรียบร้อยแล้ว' };
        } catch (err) {
            // Fallback to soft-delete if foreign key constraint blocks deletion (e.g., has reported tickets)
            if (err.errno === 1451 || err.code === 'ER_ROW_IS_REFERENCED_2') {
                await pool.execute('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
                return { message: 'ระงับการใช้งานบัญชีเนื่องจากมีข้อมูลประวัติเชื่อมโยงในระบบ' };
            }
            throw err;
        }
    }
    async getVehicleAccess(userId) {
        const [rows] = await pool.execute(
            `SELECT uva.vehicle_id, v.plate_number, v.brand, v.model 
             FROM user_vehicle_access uva
             JOIN vehicles v ON v.id = uva.vehicle_id
             WHERE uva.user_id = ?
             ORDER BY v.plate_number`,
            [userId]
        );
        return rows;
    }

    async setVehicleAccess(userId, vehicleIds) {
        // Verify user exists
        await this.getById(userId);

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Remove all current access
            await conn.execute('DELETE FROM user_vehicle_access WHERE user_id = ?', [userId]);

            // Insert new access entries
            if (vehicleIds && vehicleIds.length > 0) {
                const placeholders = vehicleIds.map(() => '(?, ?)').join(', ');
                const params = [];
                vehicleIds.forEach(vid => {
                    params.push(userId, vid);
                });
                await conn.execute(
                    `INSERT INTO user_vehicle_access (user_id, vehicle_id) VALUES ${placeholders}`,
                    params
                );
            }

            await conn.commit();
            return { message: 'อัปเดตสิทธิ์การมองเห็นรถยนต์สำเร็จ' };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    async getAccessibleVehicleIds(userId) {
        const [rows] = await pool.execute(
            'SELECT vehicle_id FROM user_vehicle_access WHERE user_id = ?',
            [userId]
        );
        return rows.map(r => r.vehicle_id);
    }
}

module.exports = new UserService();
