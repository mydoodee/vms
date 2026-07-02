const express = require('express');
const router = express.Router();
const { uploadFiles, getAttachments, deleteAttachment, uploadVehicleImage } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Upload vehicle images (max 10 files)
router.post('/vehicle/image', upload.array('files', 10), uploadVehicleImage);

// Upload files for a renewal (max 10 files)
router.post('/renewal/files', upload.array('files', 10), uploadVehicleImage);

// Upload files for a ticket (max 10 files)
router.post('/:ticketId', upload.array('files', 10), uploadFiles);

// Get attachments for a ticket
router.get('/:ticketId', getAttachments);

// Delete attachment
router.delete('/file/:id', deleteAttachment);

module.exports = router;
