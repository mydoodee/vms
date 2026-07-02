const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

class AuthService {
    /**
     * Login user and return JWT token
     */
    async login(username, password) {
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND is_active = 1',
            [username]
        );

        if (users.length === 0) {
            const error = new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            error.statusCode = 401;
            throw error;
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            const error = new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return { token, user: userWithoutPassword };
    }

    /**
     * Get user profile by ID
     */
    async getProfile(userId) {
        const [users] = await pool.execute(
            'SELECT id, username, fullname, email, phone, role, department, avatar_url, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            const error = new Error('ไม่พบผู้ใช้งาน');
            error.statusCode = 404;
            throw error;
        }

        return users[0];
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const [users] = await pool.execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            const error = new Error('ไม่พบผู้ใช้งาน');
            error.statusCode = 404;
            throw error;
        }

        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            const error = new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
            error.statusCode = 400;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
    }
}

module.exports = new AuthService();
