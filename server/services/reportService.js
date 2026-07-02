const pool = require('../config/db');

class ReportService {
    async getAvailableYears() {
        const [rows] = await pool.execute(`
            SELECT DISTINCT YEAR(created_at) as year 
            FROM repair_tickets 
            ORDER BY year DESC
        `);
        // If no records, return current year as option
        if (rows.length === 0) {
            return [new Date().getFullYear()];
        }
        return rows.map(r => r.year);
    }

    async getMaintenanceReport(filters = {}) {
        const { vehicle_id, year, problem_type } = filters;
        const params = [];
        const conditions = [];

        // Base Query for tickets list
        let sql = `
            SELECT rt.*, 
                   v.plate_number, v.brand, v.model, v.year as vehicle_year,
                   u.fullname as reporter_name,
                   rc.labor_cost, rc.parts_cost, rc.other_cost
            FROM repair_tickets rt
            LEFT JOIN vehicles v ON rt.vehicle_id = v.id
            LEFT JOIN users u ON rt.reported_by = u.id
            LEFT JOIN repair_costs rc ON rt.id = rc.ticket_id
        `;

        if (vehicle_id) {
            conditions.push('rt.vehicle_id = ?');
            params.push(vehicle_id);
        }
        if (year) {
            conditions.push('YEAR(rt.created_at) = ?');
            params.push(year);
        }
        if (problem_type) {
            conditions.push('rt.problem_type = ?');
            params.push(problem_type);
        }

        // Only show completed/closed or approved/repairing reports that have actual costs or work completed
        // Actually, let's show all tickets matching filters but order by date
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY rt.created_at DESC';

        const [tickets] = await pool.execute(sql, params);

        // Get Summary Stats based on same filters
        let statsSql = `
            SELECT 
                COUNT(*) as total_repairs,
                COALESCE(SUM(rt.actual_cost), 0) as total_cost,
                COALESCE(AVG(rt.actual_cost), 0) as avg_cost
            FROM repair_tickets rt
        `;
        const statsParams = [];
        const statsConditions = [];

        if (vehicle_id) {
            statsConditions.push('rt.vehicle_id = ?');
            statsParams.push(vehicle_id);
        }
        if (year) {
            statsConditions.push('YEAR(rt.created_at) = ?');
            statsParams.push(year);
        }
        if (problem_type) {
            statsConditions.push('rt.problem_type = ?');
            statsParams.push(problem_type);
        }

        if (statsConditions.length > 0) {
            statsSql += ' WHERE ' + statsConditions.join(' AND ');
        }
        const [statsRows] = await pool.execute(statsSql, statsParams);
        const statsSummary = statsRows[0];

        // Cost by Problem Type (Pie Chart data)
        let categorySql = `
            SELECT 
                rt.problem_type,
                COUNT(*) as count,
                COALESCE(SUM(rt.actual_cost), 0) as total_cost
            FROM repair_tickets rt
        `;
        const catParams = [];
        const catConditions = [];

        if (vehicle_id) {
            catConditions.push('rt.vehicle_id = ?');
            catParams.push(vehicle_id);
        }
        if (year) {
            catConditions.push('YEAR(rt.created_at) = ?');
            catParams.push(year);
        }
        if (problem_type) {
            catConditions.push('rt.problem_type = ?');
            catParams.push(problem_type);
        }

        if (catConditions.length > 0) {
            categorySql += ' WHERE ' + catConditions.join(' AND ');
        }
        categorySql += ' GROUP BY rt.problem_type ORDER BY total_cost DESC';
        const [categoryRows] = await pool.execute(categorySql, catParams);

        // Monthly cost trend for the chart
        let trendSql = `
            SELECT 
                MONTH(rt.created_at) as month_num,
                COALESCE(SUM(rt.actual_cost), 0) as monthly_cost,
                COUNT(*) as count
            FROM repair_tickets rt
        `;
        const trendParams = [];
        const trendConditions = [];

        if (vehicle_id) {
            trendConditions.push('rt.vehicle_id = ?');
            trendParams.push(vehicle_id);
        }
        if (year) {
            trendConditions.push('YEAR(rt.created_at) = ?');
            trendParams.push(year);
        } else {
            // default to current year if no year selected for trend
            trendConditions.push('YEAR(rt.created_at) = YEAR(CURRENT_DATE())');
        }

        if (trendConditions.length > 0) {
            trendSql += ' WHERE ' + trendConditions.join(' AND ');
        }
        trendSql += ' GROUP BY MONTH(rt.created_at) ORDER BY month_num ASC';
        const [trendRows] = await pool.execute(trendSql, trendParams);

        // Map months 1-12 to standard output
        const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
            const monthNum = i + 1;
            const match = trendRows.find(r => r.month_num === monthNum);
            return {
                month: monthNum.toString(),
                monthName: getThaiMonthName(monthNum),
                cost: match ? parseFloat(match.monthly_cost) : 0,
                count: match ? match.count : 0
            };
        });

        return {
            tickets,
            summary: {
                total_repairs: statsSummary.total_repairs || 0,
                total_cost: parseFloat(statsSummary.total_cost || 0),
                avg_cost: parseFloat(statsSummary.avg_cost || 0)
            },
            categories: categoryRows.map(r => ({
                problem_type: r.problem_type,
                count: r.count,
                total_cost: parseFloat(r.total_cost)
            })),
            monthlyTrend
        };
    }
}

function getThaiMonthName(monthNum) {
    const months = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return months[monthNum - 1] || '';
}

module.exports = new ReportService();
