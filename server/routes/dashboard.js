const express = require('express');
const router = express.Router();
const { getStats, getCharts, getRecentTickets } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Dashboard stats (admin/manager)
router.get('/stats', authorize('admin', 'manager'), getStats);
router.get('/charts', authorize('admin', 'manager'), getCharts);
router.get('/recent-tickets', authorize('admin', 'manager'), getRecentTickets);

module.exports = router;
