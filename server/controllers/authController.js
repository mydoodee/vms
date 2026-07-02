const path = require('path');
const pool = require('../config/db');
const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
        });
    }

    const result = await authService.login(username, password);

    res.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        data: result
    });
});

const getProfile = asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user.id);

    res.json({
        success: true,
        data: profile
    });
});

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
        });
    }

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, ...result });
});

const logout = asyncHandler(async (req, res) => {
    // JWT is stateless, client will remove token
    res.json({
        success: true,
        message: 'ออกจากระบบสำเร็จ'
    });
});

const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'กรุณาอัปโหลดรูปภาพ'
        });
    }

    // Relative path to store in DB
    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

    // Update avatar_url in database
    await pool.execute(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [relativePath, req.user.id]
    );

    // Fetch updated profile
    const updatedUser = await authService.getProfile(req.user.id);

    res.json({
        success: true,
        message: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
        data: updatedUser
    });
});

module.exports = { login, getProfile, changePassword, logout, uploadAvatar };

