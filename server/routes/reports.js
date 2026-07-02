const express = require('express');
const router = express.Router();
const { getMaintenanceReport, getAvailableYears } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

// All report routes require authentication and admin/manager authorization
router.use(authenticate);
router.use(authorize('admin', 'manager'));

router.get('/maintenance', getMaintenanceReport);
router.get('/years', getAvailableYears);

module.exports = router;
