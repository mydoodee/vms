import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IoCarOutline, 
  IoBuildOutline, 
  IoCashOutline, 
  IoCalendarOutline, 
  IoStatsChartOutline, 
  IoEyeOutline,
  IoDocumentTextOutline
} from 'react-icons/io5';
import { formatThaiDate } from '../utils/thaiDate';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import api from '../services/api';
import GlassCard from '../components/UI/GlassCard';
import StatCard from '../components/UI/StatCard';
import StatusBadge from '../components/UI/StatusBadge';
import LoadingSpinner from '../components/UI/LoadingSpinner';

export default function Reports() {
  const [vehicles, setVehicles] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial select options
  const fetchFilters = async () => {
    try {
      const [vehiclesRes, yearsRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/reports/years')
      ]);
      setVehicles(vehiclesRes.data.data);
      setYears(yearsRes.data.data);
    } catch (err) {
      console.error('Failed to load filter options', err);
    }
  };

  // Fetch the report data based on current selections
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedVehicle) params.append('vehicle_id', selectedVehicle);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedCategory) params.append('problem_type', selectedCategory);

      const { data } = await api.get(`/reports/maintenance?${params.toString()}`);
      setReportData(data.data);
    } catch (err) {
      setError('ไม่สามารถเรียกข้อมูลรายงานการซ่อมบำรุงได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedVehicle, selectedYear, selectedCategory]);

  const getProblemTypeLabel = (prob) => {
    const labels = {
      engine: 'เครื่องยนต์',
      brake: 'ระบบเบรค',
      tire: 'ยางรถยนต์',
      air_conditioner: 'ระบบแอร์',
      battery: 'แบตเตอรี่',
      electrical: 'ระบบไฟส่องสว่าง',
      body: 'ตัวถัง/สี',
      suspension: 'ระบบช่วงล่าง',
      transmission: 'เกียร์',
      other: 'อื่นๆ'
    };
    return labels[prob] || prob;
  };

  const getStatusLabel = (st) => {
    const labels = {
      reported: 'แจ้งเรื่อง',
      reviewing: 'กำลังตรวจสอบ',
      approved: 'อนุมัติแล้ว',
      repairing: 'กำลังซ่อม',
      completed: 'ซ่อมเสร็จ',
      closed: 'ปิดงาน'
    };
    return labels[st] || st;
  };

  const CHART_COLORS = ['#00b2ff', '#3b82f6', '#ffaa00', '#ff4444', '#a855f7', '#ec4899', '#6366f1'];

  // Map category data for Pie chart
  const pieData = reportData?.categories?.map(item => ({
    name: getProblemTypeLabel(item.problem_type),
    value: item.total_cost,
    count: item.count
  })) || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 className="page-title">รายงานการซ่อมบำรุงรถยนต์</h1>
        <p className="page-subtitle">แสดงข้อมูลประวัติงานซ่อมและค่าใช้จ่ายสะสม แยกตามรถยนต์และรายปี</p>
      </div>

      {/* Filter panel */}
      <GlassCard style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '6px' }}>เลือกทะเบียนรถ</label>
            <select 
              className="form-select" 
              value={selectedVehicle} 
              onChange={(e) => setSelectedVehicle(e.target.value)}
              style={{ padding: '10px 14px' }}
            >
              <option value="">ทั้งหมด (ทุกคัน)</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '6px' }}>ประจำปี</label>
            <select 
              className="form-select" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ padding: '10px 14px' }}
            >
              {years.map(y => (
                <option key={y} value={y}>พ.ศ. {parseInt(y) + 543} ({y})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '6px' }}>ประเภทปัญหา</label>
            <select 
              className="form-select" 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '10px 14px' }}
            >
              <option value="">ทั้งหมด</option>
              <option value="engine">เครื่องยนต์</option>
              <option value="brake">ระบบเบรค</option>
              <option value="tire">ยางรถยนต์</option>
              <option value="air_conditioner">ระบบแอร์</option>
              <option value="battery">แบตเตอรี่</option>
              <option value="electrical">ระบบไฟส่องสว่าง</option>
              <option value="body">ตัวถัง/สี</option>
              <option value="suspension">ระบบช่วงล่าง</option>
              <option value="transmission">เกียร์</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {loading && !reportData ? (
        <LoadingSpinner />
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', textAlign: 'center', padding: 'var(--space-xl)' }}>{error}</div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-3 mb-lg">
            <StatCard 
              title="จำนวนการส่งซ่อมสะสม" 
              value={`${reportData?.summary?.total_repairs || 0} ครั้ง`} 
              icon={<IoBuildOutline />} 
              color="primary" 
            />
            <StatCard 
              title="ค่าใช้จ่ายทั้งหมดของปีนี้" 
              value={`฿${Number(reportData?.summary?.total_cost || 0).toLocaleString()}`} 
              icon={<IoCashOutline />} 
              color="danger" 
            />
            <StatCard 
              title="ค่าเฉลี่ยต่อการซ่อมหนึ่งครั้ง" 
              value={`฿${Number(reportData?.summary?.avg_cost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              icon={<IoStatsChartOutline />} 
              color="accent" 
            />
          </div>

          {/* Charts block */}
          <div className="grid grid-2 mb-lg">
            <GlassCard style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>
                แนวโน้มค่าใช้จ่ายรายเดือนประจำปี {parseInt(selectedYear) + 543}
              </h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData?.monthlyTrend || []}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="monthName" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                      labelStyle={{ fontWeight: 'bold', color: 'var(--color-accent)' }}
                    />
                    <Area type="monotone" dataKey="cost" name="ค่าซ่อมบำรุง" stroke="var(--color-primary)" fillOpacity={1} fill="url(#areaGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>
                สัดส่วนค่าซ่อมบำรุงตามประเภทปัญหา
              </h3>
              <div style={{ height: '280px', display: 'flex', alignItems: 'center' }}>
                {pieData.length === 0 ? (
                  <div className="w-full text-center text-muted">ไม่มีข้อมูลค่าใช้จ่าย</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                        formatter={(value) => `฿${Number(value).toLocaleString()}`}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Details list of repairs */}
          <GlassCard style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  รายการประวัติการซ่อมบำรุงละเอียด
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>รายละเอียดรายการซ่อม รายชื่ออะไหล่ และค่าใช้จ่ายสุทธิ</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>วันที่ซ่อม</th>
                    <th>Ticket ID</th>
                    <th>ทะเบียนรถ</th>
                    <th>แบรนด์/รุ่น</th>
                    <th>หัวข้อและปัญหา ("ซ่อมอะไร")</th>
                    <th>หมวดหมู่</th>
                    <th style={{ textAlign: 'right' }}>ค่าแรง (฿)</th>
                    <th style={{ textAlign: 'right' }}>ค่าอะไหล่ (฿)</th>
                    <th style={{ textAlign: 'right' }}>ค่าใช้จ่ายรวม (฿)</th>
                    <th style={{ textAlign: 'center' }}>ดูรายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.tickets?.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                        ไม่พบรายการประวัติการซ่อมบำรุงที่ตรงกับเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    reportData?.tickets?.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{formatThaiDate(ticket.created_at)}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{ticket.ticket_id}</td>
                        <td style={{ fontWeight: 'bold' }}>{ticket.plate_number}</td>
                        <td>{ticket.brand} {ticket.model}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.title}</div>
                          {ticket.description && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ticket.description}>
                              {ticket.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem' }}>{getProblemTypeLabel(ticket.problem_type)}</span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {ticket.labor_cost ? Number(ticket.labor_cost).toLocaleString() : '-'}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {ticket.parts_cost ? Number(ticket.parts_cost).toLocaleString() : '-'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-danger)' }}>
                          ฿{Number(ticket.actual_cost || 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Link to={`/tickets/${ticket.id}`} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', padding: '6px' }}>
                            <IoEyeOutline size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
