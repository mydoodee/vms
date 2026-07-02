const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, resetPassword, remove, getVehicleAccess, setVehicleAccess } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Admin and Manager routes
router.get('/', authorize('admin', 'manager'), getAll);
router.get('/:id', authorize('admin', 'manager'), getById);
router.post('/', authorize('admin'), create);
router.put('/:id', authorize('admin'), update);
router.put('/:id/reset-password', authorize('admin'), resetPassword);
router.delete('/:id', authorize('admin'), remove);

// Vehicle access management
router.get('/:id/vehicle-access', authorize('admin', 'manager'), getVehicleAccess);
router.put('/:id/vehicle-access', authorize('admin'), setVehicleAccess);

module.exports = router;
