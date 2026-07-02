const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, updateStatus, addCost, remove } = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// All roles can read and create tickets
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);

// Update ticket details
router.put('/:id', authorize('admin', 'manager'), update);

// Status workflow
router.put('/:id/status', authorize('admin', 'manager'), updateStatus);

// Cost management
router.post('/:id/costs', authorize('admin', 'manager'), addCost);

// Delete ticket (admin only)
router.delete('/:id', authorize('admin'), remove);

module.exports = router;
