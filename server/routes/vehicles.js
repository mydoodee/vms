const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove, getStats } = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Read access for all roles
router.get('/', getAll);
router.get('/stats', getStats);
router.get('/:id', getById);

// Write access for admin/manager
router.post('/', authorize('admin', 'manager'), create);
router.put('/:id', authorize('admin', 'manager'), update);
router.delete('/:id', authorize('admin'), remove);

module.exports = router;
