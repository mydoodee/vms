const userService = require('../services/userService');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const users = await userService.getAll(req.query);
    res.json({ success: true, data: users, total: users.length });
});

const getById = asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.id);
    res.json({ success: true, data: user });
});

const create = asyncHandler(async (req, res) => {
    const { username, password, fullname } = req.body;

    if (!username || !password || !fullname) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอก username, password และ fullname'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
        });
    }

    const user = await userService.create(req.body);
    res.status(201).json({ success: true, message: 'สร้างผู้ใช้งานสำเร็จ', data: user });
});

const update = asyncHandler(async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    res.json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ', data: user });
});

const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร'
        });
    }

    const result = await userService.resetPassword(req.params.id, newPassword);
    res.json({ success: true, ...result });
});

const remove = asyncHandler(async (req, res) => {
    const result = await userService.delete(req.params.id);
    res.json({ success: true, ...result });
});

const getVehicleAccess = asyncHandler(async (req, res) => {
    const access = await userService.getVehicleAccess(req.params.id);
    res.json({ success: true, data: access });
});

const setVehicleAccess = asyncHandler(async (req, res) => {
    const { vehicleIds } = req.body;
    const result = await userService.setVehicleAccess(req.params.id, vehicleIds || []);
    res.json({ success: true, ...result });
});

module.exports = { getAll, getById, create, update, resetPassword, remove, getVehicleAccess, setVehicleAccess };
