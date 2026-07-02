const reportService = require('../services/reportService');
const { asyncHandler } = require('../middleware/errorHandler');

const getMaintenanceReport = asyncHandler(async (req, res) => {
    const reportData = await reportService.getMaintenanceReport(req.query);
    res.json({ success: true, data: reportData });
});

const getAvailableYears = asyncHandler(async (req, res) => {
    const years = await reportService.getAvailableYears();
    res.json({ success: true, data: years });
});

module.exports = { getMaintenanceReport, getAvailableYears };
