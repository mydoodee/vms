const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send email notification
 */
async function sendEmail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: `"Automotive Maintenance System" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });

        if (process.env.LOGGING_ENABLED === 'true') {
            console.log(`📧 Email sent: ${info.messageId} -> ${to}`);
        }

        return info;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw error;
    }
}

/**
 * Send new ticket notification
 */
async function notifyNewTicket(ticket, recipientEmail) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
            <h2 style="color: #39FF14;">🔧 แจ้งซ่อมใหม่</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p><strong>Ticket:</strong> ${ticket.ticket_id}</p>
                <p><strong>ทะเบียน:</strong> ${ticket.plate_number}</p>
                <p><strong>ปัญหา:</strong> ${ticket.title}</p>
                <p><strong>ความเร่งด่วน:</strong> <span style="color: ${ticket.severity === 'critical' ? '#ff4444' : '#ffaa00'}">${ticket.severity}</span></p>
                <p><strong>แจ้งโดย:</strong> ${ticket.reporter_name}</p>
            </div>
            <p style="color: #888; font-size: 12px;">Automotive Maintenance System - Automated Notification</p>
        </div>
    `;
    return sendEmail(recipientEmail, `[AMS] แจ้งซ่อมใหม่: ${ticket.ticket_id}`, html);
}

/**
 * Send PM alert notification
 */
async function notifyPMAlert(schedule, vehicle, recipientEmail) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;">
            <h2 style="color: #00e5ff;">📅 แจ้งเตือน PM รถยนต์</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p><strong>ทะเบียน:</strong> ${vehicle.plate_number}</p>
                <p><strong>ประเภท:</strong> ${schedule.service_type}</p>
                <p><strong>ครบกำหนด:</strong> ${schedule.next_due_date}</p>
            </div>
            <p style="color: #888; font-size: 12px;">Automotive Maintenance System - Automated Notification</p>
        </div>
    `;
    return sendEmail(recipientEmail, `[AMS] PM Alert: ${vehicle.plate_number} - ${schedule.service_type}`, html);
}

module.exports = { sendEmail, notifyNewTicket, notifyPMAlert };
