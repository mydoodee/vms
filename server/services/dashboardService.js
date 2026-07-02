const pool = require('../config/db');

class DashboardService {
    async getStats() {
        // Total vehicles by status
        const [vehicleStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_vehicles,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_vehicles,
                SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as in_maintenance
            FROM vehicles
        `);

        // Ticket stats
        const [ticketStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_tickets,
                SUM(CASE WHEN status IN ('reported', 'reviewing') THEN 1 ELSE 0 END) as open_tickets,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as pending_approval,
                SUM(CASE WHEN status = 'repairing' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
            FROM repair_tickets
        `);

        // Monthly cost (current month)
        const [monthlyCost] = await pool.execute(`
            SELECT COALESCE(SUM(actual_cost), 0) as monthly_cost
            FROM repair_tickets 
            WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) 
              AND YEAR(created_at) = YEAR(CURRENT_DATE())
        `);

        // PM alerts (due within 30 days)
        const [pmAlerts] = await pool.execute(`
            SELECT COUNT(*) as pm_alerts
            FROM maintenance_schedule 
            WHERE DATEDIFF(next_due_date, CURDATE()) <= 30 
              AND DATEDIFF(next_due_date, CURDATE()) >= 0
              AND is_active = 1
        `);

        return {
            ...vehicleStats[0],
            ...ticketStats[0],
            monthly_cost: monthlyCost[0].monthly_cost,
            pm_alerts: pmAlerts[0].pm_alerts
        };
    }

    async getRepairByCategory() {
        const [rows] = await pool.execute(`
            SELECT problem_type, COUNT(*) as count
            FROM repair_tickets
            GROUP BY problem_type
            ORDER BY count DESC
        `);
        return rows;
    }

    async getCostByMonth() {
        const [rows] = await pool.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COALESCE(SUM(actual_cost), 0) as total_cost,
                COUNT(*) as ticket_count
            FROM repair_tickets
            WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);
        return rows;
    }

    async getTopExpensiveVehicles() {
        const [rows] = await pool.execute(`
            SELECT 
                v.id, v.plate_number, v.brand, v.model,
                COUNT(rt.id) as repair_count,
                COALESCE(SUM(rt.actual_cost), 0) as total_cost
            FROM vehicles v
            LEFT JOIN repair_tickets rt ON v.id = rt.vehicle_id
            GROUP BY v.id
            HAVING total_cost > 0
            ORDER BY total_cost DESC
            LIMIT 10
        `);
        return rows;
    }

    async getRecentTickets() {
        const [rows] = await pool.execute(`
            SELECT rt.*, v.plate_number, v.brand, v.model, u.fullname as reporter_name
            FROM repair_tickets rt
            LEFT JOIN vehicles v ON rt.vehicle_id = v.id
            LEFT JOIN users u ON rt.reported_by = u.id
            ORDER BY rt.created_at DESC
            LIMIT 10
        `);
        return rows;
    }

    async getVehicleDowntime() {
        const [rows] = await pool.execute(`
            SELECT 
                v.plate_number, v.brand, v.model,
                COUNT(rt.id) as repair_count,
                COALESCE(SUM(DATEDIFF(
                    COALESCE(rt.completed_at, CURRENT_DATE()), 
                    rt.created_at
                )), 0) as total_downtime_days
            FROM vehicles v
            LEFT JOIN repair_tickets rt ON v.id = rt.vehicle_id AND rt.status IN ('repairing', 'completed', 'closed')
            GROUP BY v.id
            HAVING repair_count > 0
            ORDER BY total_downtime_days DESC
            LIMIT 10
        `);
        return rows;
    }

    async getTicketsBySeverity() {
        const [rows] = await pool.execute(`
            SELECT severity, COUNT(*) as count
            FROM repair_tickets
            WHERE status NOT IN ('closed')
            GROUP BY severity
        `);
        return rows;
    }
}

module.exports = new DashboardService();
