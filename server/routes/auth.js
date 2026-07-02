const express = require('express');
const router = express.Router();
const { login, getProfile, changePassword, logout, uploadAvatar } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/change-password', authenticate, changePassword);
router.post('/logout', authenticate, logout);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

module.exports = router;
