const ticketService = require('../services/ticketService');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    // If user role is 'user', only show their own tickets
    const query = { ...req.query };
    if (req.user.role === 'user') {
        query.reported_by = req.user.id;
    }

    const tickets = await ticketService.getAll(query);
    res.json({ success: true, data: tickets, total: tickets.length });
});

const getById = asyncHandler(async (req, res) => {
    const ticket = await ticketService.getById(req.params.id);
    res.json({ success: true, data: ticket });
});

const create = asyncHandler(async (req, res) => {
    const { vehicle_id, problem_type, title } = req.body;

    if (!vehicle_id || !problem_type || !title) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกข้อมูลรถยนต์, ประเภทปัญหา และหัวข้อ'
        });
    }

    const ticket = await ticketService.create(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'แจ้งซ่อมสำเร็จ', data: ticket });
});

const update = asyncHandler(async (req, res) => {
    const ticket = await ticketService.update(req.params.id, req.body);
    res.json({ success: true, message: 'อัปเดตใบแจ้งซ่อมสำเร็จ', data: ticket });
});

const updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({
            success: false,
            message: 'กรุณาระบุสถานะ'
        });
    }

    const ticket = await ticketService.updateStatus(req.params.id, status, req.user.id);
    res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ', data: ticket });
});

const addCost = asyncHandler(async (req, res) => {
    const ticket = await ticketService.addCost(req.params.id, req.body);
    res.json({ success: true, message: 'บันทึกค่าใช้จ่ายสำเร็จ', data: ticket });
});

const remove = asyncHandler(async (req, res) => {
    const result = await ticketService.delete(req.params.id);
    res.json({ success: true, ...result });
});

module.exports = { getAll, getById, create, update, updateStatus, addCost, remove };
