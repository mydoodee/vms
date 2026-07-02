const insuranceCompanyService = require('../services/insuranceCompanyService');
const { asyncHandler } = require('../middleware/errorHandler');

const getAll = asyncHandler(async (req, res) => {
    const companies = await insuranceCompanyService.getAll(req.query);
    res.json({ success: true, data: companies, total: companies.length });
});

const getById = asyncHandler(async (req, res) => {
    const company = await insuranceCompanyService.getById(req.params.id);
    res.json({ success: true, data: company });
});

const create = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'กรุณากรอกชื่อบริษัทประกัน'
        });
    }

    const company = await insuranceCompanyService.create(req.body);
    res.status(201).json({ success: true, message: 'เพิ่มบริษัทประกันสำเร็จ', data: company });
});

const update = asyncHandler(async (req, res) => {
    const company = await insuranceCompanyService.update(req.params.id, req.body);
    res.json({ success: true, message: 'อัปเดตข้อมูลบริษัทประกันสำเร็จ', data: company });
});

const remove = asyncHandler(async (req, res) => {
    const result = await insuranceCompanyService.delete(req.params.id);
    res.json({ success: true, ...result });
});

module.exports = { getAll, getById, create, update, remove };
