/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);

    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: `ไฟล์มีขนาดเกิน ${process.env.UPLOAD_LIMIT || 300} MB`
        });
    }

    // Multer file type error
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            message: 'ประเภทไฟล์ไม่ถูกต้อง'
        });
    }

    // MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'ข้อมูลซ้ำในระบบ'
        });
    }

    // MySQL foreign key constraint
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'ข้อมูลอ้างอิงไม่ถูกต้อง'
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดภายในระบบ',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
