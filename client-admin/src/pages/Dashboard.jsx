import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  IoCarOutline, 
  IoBuildOutline, 
  IoCheckmarkCircleOutline, 
  IoTimeOutline, 
  IoCashOutline, 
  IoAlertCircleOutline 
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
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/UI/StatCard';
import GlassCard from '../components/UI/GlassCard';
import StatusBadge from '../components/UI/StatusBadge';
import LoadingSpinner from '../components/UI/LoadingSpinner';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [statsRes, chartsRes, recentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/recent-tickets')
      ]);

      setStats(statsRes.data.data);
      setCharts(chartsRes.data.data);
      setRecentTickets(recentRes.data.data);
    } catch (err) {
      setError('ไม่สามารถเรียกข้อมูลสถิติแดชบอร์ดได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger text-center">{error}</div>;

  const COLORS = ['#0d9488', '#3b82f6', '#ffaa00', '#ff4444', '#a855f7'];

  // Map category data for PieChart
  const pieData = charts?.repairByCategory?.map(item => ({
    name: item.problem_type === 'engine' ? 'เครื่องยนต์' :
          item.problem_type === 'brake' ? 'เบรค' :
          item.problem_type === 'tire' ? 'ยาง' :
          item.problem_type === 'air_conditioner' ? 'แอร์' :
          item.problem_type === 'battery' ? 'แบตเตอรี่' :
          item.problem_type === 'electrical' ? 'ระบบไฟ' : 'อื่นๆ',
    value: item.count
  })) || [];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">ระบบรายงาน และสถิติ</h1>
        <p className="page-subtitle">ภาพรวมการใช้งาน ยานพาหนะ และประวัติการแจ้งซ่อม</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-5 mb-lg">
          <StatCard 
            title="รถยนต์ทั้งหมด" 
            value={stats.total_vehicles} 
            icon={<IoCarOutline />} 
            color="accent" 
            onClick={() => navigate('/vehicles')}
          />
          <StatCard 
            title="กำลังซ่อมบำรุง" 
            value={stats.in_maintenance} 
            icon={<IoBuildOutline />} 
            color="danger" 
            onClick={() => navigate('/vehicles')}
          />
          <StatCard 
            title="แจ้งซ่อมใหม่/กำลังตรวจสอบ" 
            value={stats.open_tickets} 
            icon={<IoTimeOutline />} 
            color="primary" 
            onClick={() => navigate('/tickets')}
          />
          <StatCard 
            title="ซ่อมเสร็จแล้ว" 
            value={stats.completed + stats.closed} 
            icon={<IoCheckmarkCircleOutline />} 
            color="primary" 
            onClick={() => navigate('/tickets')}
          />
          <StatCard 
            title="ค่าใช้จ่ายเดือนนี้" 
            value={`฿${Number(stats.monthly_cost).toLocaleString()}`} 
            icon={<IoCashOutline />} 
            color="accent" 
            onClick={() => navigate('/reports')}
          />
        </div>
      )}

      {/* Warn indicator */}
      {stats?.pm_alerts > 0 && (
        <div 
          onClick={() => navigate('/renewals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 170, 0, 0.08)',
            border: '1px solid rgba(255, 170, 0, 0.2)',
            color: 'var(--color-warning)',
            padding: '16px 20px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: 'var(--space-lg)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 170, 0, 0.14)';
            e.currentTarget.style.borderColor = 'rgba(255, 170, 0, 0.4)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 170, 0, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 170, 0, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <IoAlertCircleOutline size={22} style={{ color: 'var(--color-warning)' }} />
          <span>มีงานซ่อมบำรุงเชิงป้องกัน (PM) ใกล้ครบกำหนด {stats.pm_alerts} คัน ในช่วง 30 วันนี้!</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.7 }}>คลิกเพื่อดูรายละเอียด →</span>
        </div>
      )}

      {/* Main layout charts */}
      <div className="grid grid-2 mb-lg">
        {/* Cost Monthly Chart */}
        <GlassCard>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>
            สถิติค่าใช้จ่ายรายเดือน (บาท)
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.costByMonth || []}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--color-accent)' }}
                />
                <Bar dataKey="total_cost" name="ค่าใช้จ่าย" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Repair by Category (Pie chart) */}
        <GlassCard>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>
            สัดส่วนปัญหาการแจ้งซ่อมแยกตามหมวดหมู่
          </h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center' }}>
            {pieData.length === 0 ? (
              <div className="w-full text-center text-muted">ไม่มีข้อมูลปัญหาการแจ้งซ่อม</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Extra detailed grids */}
      <div className="grid grid-2">
        {/* Expensive vehicles */}
        <GlassCard>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>
            รถยนต์ที่มีค่าใช้จ่ายสะสมสูงสุด
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {charts?.topExpensiveVehicles?.length === 0 ? (
              <div className="text-center text-muted py-sm">ไม่มีข้อมูลค่าใช้จ่าย</div>
            ) : (
              charts?.topExpensiveVehicles?.map((v) => (
                <div 
                  key={v.id} 
                  onClick={() => navigate(`/vehicles/${v.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary-dim)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.plate_number}</span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.brand} {v.model} ({v.repair_count} ครั้ง)</p>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>
                    ฿{Number(v.total_cost).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Recent Tickets list */}
        <GlassCard>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>
            ประวัติการแจ้งซ่อมล่าสุด
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTickets.length === 0 ? (
              <div className="text-center text-muted py-sm">ไม่มีประวัติการแจ้งซ่อมใหม่</div>
            ) : (
              recentTickets.map((t) => (
                <Link 
                  key={t.id} 
                  to={`/tickets/${t.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary-dim)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-accent)' }}>{t.ticket_id}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.plate_number}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                      {t.title}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <StatusBadge type="status" value={t.status} label={
                      t.status === 'reported' ? 'แจ้งเรื่อง' :
                      t.status === 'reviewing' ? 'กำลังตรวจสอบ' :
                      t.status === 'approved' ? 'อนุมัติแล้ว' :
                      t.status === 'repairing' ? 'กำลังซ่อม' :
                      t.status === 'completed' ? 'ซ่อมเสร็จ' : 'ปิดงาน'
                    } />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatThaiDate(t.created_at)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
