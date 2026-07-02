const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Verify JWT token middleware
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'กรุณาเข้าสู่ระบบ (No token provided)'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch fresh user data
        const [users] = await pool.execute(
            'SELECT id, username, fullname, email, phone, role, department, avatar_url FROM users WHERE id = ? AND is_active = 1',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบผู้ใช้งานหรือบัญชีถูกระงับ'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Token ไม่ถูกต้อง'
        });
    }
};

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'กรุณาเข้าสู่ระบบ'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
            });
        }

        next();
    };
};

module.exports = { authenticate, authorize };
