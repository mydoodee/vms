const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust first proxy (Nginx reverse proxy)
app.set('trust proxy', 1);

// ==========================================
// Security Middleware
// ==========================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://app.spkconstruction.co.th', 'http://localhost', 'http://192.168.1.146']
        : '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: { success: false, message: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง' }
});
app.use('/api/', limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'พยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ภายหลัง' }
});
app.use('/api/auth/login', authLimiter);

// ==========================================
// Body Parsing
// ==========================================
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ limit: '300mb', extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} - path: ${req.path}`);
    next();
});

// ==========================================
// Static Files (uploads)
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static APK folder through `/api/apk` route
app.use('/api/apk', express.static(path.join(__dirname, 'apk')));

// App update version check
app.get('/api/app/version', (req, res) => {
    res.json({
        success: true,
        version: '1.0.6',
        buildNumber: 7,
        downloadUrl: 'https://app.spkconstruction.co.th/vms/api/apk/app-release.apk',
        releaseNotes: 'ระบบอัปเดตใหม่ — ดาวน์โหลดและติดตั้งได้ภายในแอปโดยตรง พร้อมแสดงสถานะการดาวน์โหลดแบบ Real-time'
    });
});

// ==========================================
// API Routes
// ==========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/garages', require('./routes/garages'));
app.use('/api/renewals', require('./routes/renewals'));
app.use('/api/insurance-companies', require('./routes/insuranceCompanies'));

// ==========================================
// Health Check
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Automotive Maintenance System API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ==========================================
// Error Handling
// ==========================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'ไม่พบ API ที่ร้องขอ' });
});

app.use(errorHandler);

module.exports = app;
