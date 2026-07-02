const dashboardService = require('../services/dashboardService');
const { asyncHandler } = require('../middleware/errorHandler');

const getStats = asyncHandler(async (req, res) => {
    const stats = await dashboardService.getStats();
    res.json({ success: true, data: stats });
});

const getCharts = asyncHandler(async (req, res) => {
    const [repairByCategory, costByMonth, topExpensiveVehicles, vehicleDowntime, ticketsBySeverity] = await Promise.all([
        dashboardService.getRepairByCategory(),
        dashboardService.getCostByMonth(),
        dashboardService.getTopExpensiveVehicles(),
        dashboardService.getVehicleDowntime(),
        dashboardService.getTicketsBySeverity()
    ]);

    res.json({
        success: true,
        data: {
            repairByCategory,
            costByMonth,
            topExpensiveVehicles,
            vehicleDowntime,
            ticketsBySeverity
        }
    });
});

const getRecentTickets = asyncHandler(async (req, res) => {
    const tickets = await dashboardService.getRecentTickets();
    res.json({ success: true, data: tickets });
});

module.exports = { getStats, getCharts, getRecentTickets };
