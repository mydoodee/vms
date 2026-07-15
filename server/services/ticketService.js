const pool = require('../config/db');
const { generateTicketId } = require('../utils/helpers');

class TicketService {
    async getAll(query = {}) {
        let sql = `
            SELECT rt.*, 
                   v.plate_number, v.brand, v.model,
                   u.fullname as reporter_name,
                   a.fullname as approver_name,
                   g.name as registered_garage_name,
                   rc.parts_cost, rc.labor_cost, rc.other_cost, rc.total_cost
            FROM repair_tickets rt
            LEFT JOIN vehicles v ON rt.vehicle_id = v.id
            LEFT JOIN users u ON rt.reported_by = u.id
            LEFT JOIN users a ON rt.approved_by = a.id
            LEFT JOIN garages g ON rt.garage_id = g.id
            LEFT JOIN repair_costs rc ON rt.id = rc.ticket_id
        `;
        const params = [];
        const conditions = [];

        if (query.status) {
            conditions.push('rt.status = ?');
            params.push(query.status);
        }
        if (query.severity) {
            conditions.push('rt.severity = ?');
            params.push(query.severity);
        }
        if (query.problem_type) {
            conditions.push('rt.problem_type = ?');
            params.push(query.problem_type);
        }
        if (query.vehicle_id) {
            conditions.push('rt.vehicle_id = ?');
            params.push(query.vehicle_id);
        }
        if (query.reported_by) {
            conditions.push('rt.reported_by = ?');
            params.push(query.reported_by);
        }
        if (query.search) {
            conditions.push('(rt.ticket_id LIKE ? OR rt.title LIKE ? OR rt.description LIKE ? OR v.plate_number LIKE ?)');
            const searchTerm = `%${query.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY rt.created_at DESC';

        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    async getById(id) {
        const [rows] = await pool.execute(
            `SELECT rt.*, 
                    v.plate_number, v.brand, v.model, v.year,
                    u.fullname as reporter_name, u.phone as reporter_phone,
                    a.fullname as approver_name,
                    g.name as registered_garage_name, g.phone as registered_garage_phone, g.address as registered_garage_address
             FROM repair_tickets rt
             LEFT JOIN vehicles v ON rt.vehicle_id = v.id
             LEFT JOIN users u ON rt.reported_by = u.id
             LEFT JOIN users a ON rt.approved_by = a.id
             LEFT JOIN garages g ON rt.garage_id = g.id
             WHERE rt.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            const error = new Error('ไม่พบใบแจ้งซ่อม');
            error.statusCode = 404;
            throw error;
        }

        // Get attachments
        const [attachments] = await pool.execute(
            'SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at DESC',
            [id]
        );

        // Get costs
        const [costs] = await pool.execute(
            'SELECT * FROM repair_costs WHERE ticket_id = ?',
            [id]
        );

        return { ...rows[0], attachments, costs: costs[0] || null };
    }

    async create(ticketData, userId) {
        const {
            vehicle_id, problem_type, severity, title, description, estimated_cost, garage_id, garage_name
        } = ticketData;

        // Generate unique ticket ID
        let ticketId = generateTicketId();
        
        // Ensure uniqueness
        const [existing] = await pool.execute(
            'SELECT id FROM repair_tickets WHERE ticket_id = ?',
            [ticketId]
        );
        if (existing.length > 0) {
            ticketId = generateTicketId();
        }

        const [result] = await pool.execute(
            `INSERT INTO repair_tickets (ticket_id, vehicle_id, reported_by, problem_type, severity, title, description, estimated_cost, garage_id, garage_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ticketId, vehicle_id, userId, problem_type, severity || 'medium', title, description || null, estimated_cost || 0, garage_id || null, garage_name || null]
        );

        // Update vehicle status to maintenance if severity is critical
        if (severity === 'critical') {
            await pool.execute(
                'UPDATE vehicles SET status = ? WHERE id = ?',
                ['maintenance', vehicle_id]
            );
        }

        return this.getById(result.insertId);
    }

    async update(id, ticketData) {
        await this.getById(id);

        const fields = [];
        const params = [];
        const allowedFields = [
            'problem_type', 'severity', 'title', 'description',
            'status', 'estimated_cost', 'actual_cost', 'garage_id', 'garage_name', 'notes'
        ];

        for (const field of allowedFields) {
            if (ticketData[field] !== undefined) {
                fields.push(`${field} = ?`);
                params.push(ticketData[field]);
            }
        }

        if (fields.length === 0) {
            const error = new Error('ไม่มีข้อมูลที่ต้องอัปเดต');
            error.statusCode = 400;
            throw error;
        }

        params.push(id);
        await pool.execute(
            `UPDATE repair_tickets SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        return this.getById(id);
    }

    async updateStatus(id, status, userId) {
        const ticket = await this.getById(id);

        // Validate status workflow
        const validTransitions = {
            'reported': ['repairing'],
            'reviewing': ['repairing', 'reported'],
            'approved': ['repairing'],
            'repairing': ['completed'],
            'completed': ['closed'],
            'closed': []
        };

        if (!validTransitions[ticket.status]?.includes(status)) {
            const error = new Error(`ไม่สามารถเปลี่ยนสถานะจาก "${ticket.status}" เป็น "${status}" ได้`);
            error.statusCode = 400;
            throw error;
        }

        const updates = { status };

        // Set timestamps based on status
        if (status === 'approved') {
            updates.approved_by = userId;
            updates.approved_at = new Date();
        } else if (status === 'repairing') {
            updates.repair_started_at = new Date();
        } else if (status === 'completed') {
            updates.completed_at = new Date();
            // Restore vehicle status
            await pool.execute(
                'UPDATE vehicles SET status = ? WHERE id = ?',
                ['active', ticket.vehicle_id]
            );
        } else if (status === 'closed') {
            updates.closed_at = new Date();
        }

        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const params = [...Object.values(updates), id];

        await pool.execute(
            `UPDATE repair_tickets SET ${fields} WHERE id = ?`,
            params
        );

        return this.getById(id);
    }

    async addCost(ticketId, costData) {
        const { labor_cost, parts_cost, other_cost, description } = costData;
        const total_cost = (parseFloat(labor_cost) || 0) + (parseFloat(parts_cost) || 0) + (parseFloat(other_cost) || 0);

        // Upsert costs
        await pool.execute(
            `INSERT INTO repair_costs (ticket_id, labor_cost, parts_cost, other_cost, total_cost, description)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                labor_cost = VALUES(labor_cost),
                parts_cost = VALUES(parts_cost),
                other_cost = VALUES(other_cost),
                total_cost = VALUES(total_cost),
                description = VALUES(description)`,
            [ticketId, labor_cost || 0, parts_cost || 0, other_cost || 0, total_cost, description || null]
        );

        // Update actual cost on ticket
        await pool.execute(
            'UPDATE repair_tickets SET actual_cost = ? WHERE id = ?',
            [total_cost, ticketId]
        );

        return this.getById(ticketId);
    }

    async delete(id) {
        const [rows] = await pool.execute('SELECT * FROM repair_tickets WHERE id = ?', [id]);
        if (rows.length === 0) {
            const error = new Error('ไม่พบใบแจ้งซ่อม');
            error.statusCode = 404;
            throw error;
        }
        await pool.execute('DELETE FROM repair_tickets WHERE id = ?', [id]);
        return { message: 'ลบใบแจ้งซ่อมสำเร็จ' };
    }
}

module.exports = new TicketService();
