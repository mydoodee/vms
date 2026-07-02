const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const path = require('path');

const uploadFiles = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด'
        });
    }

    const ticketId = req.body.ticket_id || req.params.ticketId;

    if (!ticketId) {
        return res.status(400).json({
            success: false,
            message: 'กรุณาระบุ ticket_id'
        });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
        const relativePath = path.relative(
            path.join(__dirname, '..'),
            file.path
        ).replace(/\\/g, '/');

        const [result] = await pool.execute(
            `INSERT INTO ticket_attachments (ticket_id, file_name, original_name, file_path, file_type, file_size, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ticketId, file.filename, file.originalname, relativePath, file.mimetype, file.size, req.user.id]
        );

        uploadedFiles.push({
            id: result.insertId,
            file_name: file.filename,
            original_name: file.originalname,
            file_path: relativePath,
            file_type: file.mimetype,
            file_size: file.size
        });
    }

    res.status(201).json({
        success: true,
        message: `อัปโหลด ${uploadedFiles.length} ไฟล์สำเร็จ`,
        data: uploadedFiles
    });
});

const getAttachments = asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
        'SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at DESC',
        [req.params.ticketId]
    );

    res.json({ success: true, data: rows });
});

const deleteAttachment = asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
        'SELECT * FROM ticket_attachments WHERE id = ?',
        [req.params.id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });
    }

    // Delete from database (file stays on disk for audit)
    await pool.execute('DELETE FROM ticket_attachments WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'ลบไฟล์สำเร็จ' });
});

const uploadVehicleImage = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'กรุณาเลือกไฟล์รูปภาพที่ต้องการอัปโหลด'
        });
    }

    const uploadedFiles = req.files.map(file => {
        const relativePath = path.relative(
            path.join(__dirname, '..'),
            file.path
        ).replace(/\\/g, '/');
        return {
            file_name: file.filename,
            file_path: relativePath
        };
    });

    res.status(201).json({
        success: true,
        message: `อัปโหลด ${uploadedFiles.length} รูปภาพสำเร็จ`,
        data: uploadedFiles
    });
});

module.exports = { uploadFiles, getAttachments, deleteAttachment, uploadVehicleImage };
