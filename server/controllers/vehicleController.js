const vehicleService = require('../services/vehicleService');
const userService = require('../services/userService');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const query = { ...req.query };

    // Enforce role-based vehicle visibility via user_vehicle_access table
    if (req.user && req.user.role === 'user') {
        const accessibleIds = await userService.getAccessibleVehicleIds(req.user.id);
        if (accessibleIds.length === 0) {
            return res.json({ success: true, data: [], total: 0 });
        }
        query.vehicleIds = accessibleIds;
    }

    const vehicles = await vehicleService.getAll(query);
    res.json({ success: true, data: vehicles, total: vehicles.length });
});

const getById = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.getById(req.params.id);
    res.json({ success: true, data: vehicle });
});

const create = asyncHandler(async (req, res) => {
    const { plate_number, brand } = req.body;

    if (!plate_number || !brand) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกทะเบียนรถและยี่ห้อ'
        });
    }

    const vehicle = await vehicleService.create(req.body);
    res.status(201).json({ success: true, message: 'เพิ่มรถยนต์สำเร็จ', data: vehicle });
});

const update = asyncHandler(async (req, res) => {
    const vehicle = await vehicleService.update(req.params.id, req.body);
    res.json({ success: true, message: 'อัปเดตข้อมูลรถยนต์สำเร็จ', data: vehicle });
});

const remove = asyncHandler(async (req, res) => {
    const result = await vehicleService.delete(req.params.id);
    res.json({ success: true, ...result });
});

const getStats = asyncHandler(async (req, res) => {
    const stats = await vehicleService.getStats();
    res.json({ success: true, data: stats });
});

module.exports = { getAll, getById, create, update, remove, getStats };
