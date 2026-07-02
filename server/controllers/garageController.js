const garageService = require('../services/garageService');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const garages = await garageService.getAll(req.query);
    res.json({ success: true, data: garages, total: garages.length });
});

const getById = asyncHandler(async (req, res) => {
    const garage = await garageService.getById(req.params.id);
    res.json({ success: true, data: garage });
});

const create = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกชื่ออู่/ศูนย์บริการ'
        });
    }

    const garage = await garageService.create(req.body);
    res.status(201).json({ success: true, message: 'เพิ่มข้อมูลอู่/ศูนย์บริการสำเร็จ', data: garage });
});

const update = asyncHandler(async (req, res) => {
    const garage = await garageService.update(req.params.id, req.body);
    res.json({ success: true, message: 'อัปเดตข้อมูลอู่/ศูนย์บริการสำเร็จ', data: garage });
});

const remove = asyncHandler(async (req, res) => {
    const result = await garageService.delete(req.params.id);
    res.json({ success: true, ...result });
});

module.exports = { getAll, getById, create, update, remove };
