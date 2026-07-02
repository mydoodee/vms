const renewalService = require('../services/renewalService');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const renewals = await renewalService.getAll(req.query);
    res.json({ success: true, data: renewals });
});

const getVehicleSummary = asyncHandler(async (req, res) => {
    const summary = await renewalService.getVehicleSummary();
    res.json({ success: true, data: summary });
});

const getByVehicleId = asyncHandler(async (req, res) => {
    const renewals = await renewalService.getByVehicleId(req.params.id);
    res.json({ success: true, data: renewals });
});

const create = asyncHandler(async (req, res) => {
    const { vehicle_id, type, renew_date } = req.body;
    if (!vehicle_id || !type || !renew_date) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกข้อมูลรถยนต์, ประเภท, และวันที่ต่ออายุ'
        });
    }
    const result = await renewalService.create(req.body);
    res.status(201).json({ success: true, message: 'บันทึกการต่ออายุสำเร็จ', data: result });
});

const remove = asyncHandler(async (req, res) => {
    const result = await renewalService.delete(req.params.id);
    res.json({ success: true, ...result });
});

const appendAttachments = asyncHandler(async (req, res) => {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
        return res.status(400).json({ success: false, message: 'กรุณาส่งข้อมูลไฟล์แนบ' });
    }
    const updated = await renewalService.appendAttachments(req.params.id, files);
    res.json({ success: true, message: 'แนบไฟล์สำเร็จ', data: updated });
});

const removeAttachment = asyncHandler(async (req, res) => {
    const { file_path } = req.body;
    if (!file_path) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุพาธไฟล์ที่ต้องการลบ' });
    }
    const updated = await renewalService.removeAttachment(req.params.id, file_path);
    res.json({ success: true, message: 'ลบไฟล์แนบสำเร็จ', data: updated });
});

const update = asyncHandler(async (req, res) => {
    const { type, renew_date } = req.body;
    if (!type || !renew_date) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกข้อมูลประเภทและวันที่ต่ออายุ'
        });
    }
    const result = await renewalService.update(req.params.id, req.body);
    res.json({ success: true, message: 'แก้ไขข้อมูลการต่ออายุสำเร็จ', data: result });
});

module.exports = { getAll, getVehicleSummary, getByVehicleId, create, remove, appendAttachments, removeAttachment, update };
