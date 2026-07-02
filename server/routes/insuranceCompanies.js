const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../controllers/insuranceCompanyController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// View list of insurance companies (all roles)
router.get('/', getAll);
router.get('/:id', getById);

// Write/Edit operations restricted to admin & manager
router.post('/', authorize('admin', 'manager'), create);
router.put('/:id', authorize('admin', 'manager'), update);
router.delete('/:id', authorize('admin'), remove);

module.exports = router;
