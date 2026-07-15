const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4', '.mov'];
const MAX_FILE_SIZE = (process.env.UPLOAD_LIMIT || 300) * 1024 * 1024; // MB to bytes

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create date-based subdirectory
        const dateDir = new Date().toISOString().slice(0, 7); // YYYY-MM
        const destPath = path.join(uploadDir, dateDir);
        
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `ams-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ALLOWED_EXTENSIONS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`ไม่รองรับไฟล์ประเภท ${ext} (รองรับ: ${ALLOWED_EXTENSIONS.join(', ')})`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});

module.exports = upload;
