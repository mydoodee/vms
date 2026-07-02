const express = require('express');
const router = express.Router();
const { getAll, getVehicleSummary, getByVehicleId, create, remove, appendAttachments, removeAttachment, update } = require('../controllers/renewalController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Read access
router.get('/', getAll);
router.get('/summary', getVehicleSummary);
router.get('/vehicle/:id', getByVehicleId);

// Write access for admin/manager
router.post('/', authorize('admin', 'manager'), create);
router.put('/:id', authorize('admin', 'manager'), update);
router.delete('/:id', authorize('admin'), remove);

// Attachment modification
router.post('/:id/attachments', authorize('admin', 'manager'), appendAttachments);
router.delete('/:id/attachments', authorize('admin', 'manager'), removeAttachment);

module.exports = router;
