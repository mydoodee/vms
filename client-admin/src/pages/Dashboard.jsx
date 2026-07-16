import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LuCar, 
  LuWrench, 
  LuCircleCheck, 
  LuClock, 
  LuCircleDollarSign, 
  LuTriangleAlert 
} from 'react-icons/lu';
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

  const COLORS = ['#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed'];

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
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">ระบบรายงาน และสถิติ</h1>
        <p className="page-subtitle">ภาพรวมการใช้งาน ยานพาหนะ และประวัติการแจ้งซ่อม</p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-5 mb-lg">
          <StatCard 
            title="รถยนต์ทั้งหมด" 
            value={`${stats.total_vehicles || 0} คัน`} 
            icon={<LuCar size={20} />} 
            color="accent" 
            onClick={() => navigate('/vehicles')}
          />
          <StatCard 
            title="กำลังซ่อมบำรุง" 
            value={`${stats.in_maintenance || 0} คัน`} 
            icon={<LuWrench size={20} />} 
            color="danger" 
            onClick={() => navigate('/vehicles')}
          />
          <StatCard 
            title="ซ่อมใหม่/ตรวจสอบ" 
            value={`${stats.open_tickets || 0} รายการ`} 
            icon={<LuClock size={20} />} 
            color="warning" 
            onClick={() => navigate('/tickets')}
          />
          <StatCard 
            title="ซ่อมเสร็จแล้ว" 
            value={`${(stats.completed || 0) + (stats.closed || 0)} รายการ`} 
            icon={<LuCircleCheck size={20} />} 
            color="primary" 
            onClick={() => navigate('/tickets')}
          />
          <StatCard 
            title="ค่าใช้จ่ายเดือนนี้" 
            value={`฿${Number(stats.monthly_cost || 0).toLocaleString()}`} 
            icon={<LuCircleDollarSign size={20} />} 
            color="info" 
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
            background: 'var(--color-warning-light)',
            border: '1px solid var(--color-warning-border)',
            color: 'var(--color-warning)',
            padding: '16px 20px',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginBottom: 'var(--space-lg)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          <LuTriangleAlert size={20} style={{ color: 'var(--color-warning)' }} />
          <span>มีงานซ่อมบำรุงเชิงป้องกัน (PM) ใกล้ครบกำหนด {stats.pm_alerts} คัน ในช่วง 30 วันนี้!</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.8 }}>คลิกเพื่อดูรายละเอียด →</span>
        </div>
      )}

      {/* Main layout charts */}
      <div className="grid grid-2 mb-lg">
        {/* Cost Monthly Chart */}
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="total_cost" name="ค่าใช้จ่าย" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Repair by Category (Pie chart) */}
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
            สัดส่วนปัญหาการแจ้งซ่อมแยกตามหมวดหมู่
          </h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center' }}>
            {pieData.length === 0 ? (
              <div className="w-full text-center text-muted" style={{ fontSize: '0.88rem' }}>ไม่มีข้อมูลปัญหาการแจ้งซ่อม</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }} height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Extra detailed grids */}
      <div className="grid grid-2">
        {/* Expensive vehicles */}
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
            รถยนต์ที่มีค่าใช้จ่ายสะสมสูงสุด
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {charts?.topExpensiveVehicles?.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '20px 0', fontSize: '0.88rem' }}>ไม่มีข้อมูลค่าใช้จ่าย</div>
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
                    background: 'var(--glass-bg)',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'var(--color-primary-subtle)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'var(--glass-bg)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{v.plate_number}</span>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{v.brand} {v.model} ({v.repair_count} ครั้ง)</p>
                  </div>
                  <span style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '0.95rem' }}>
                    ฿{Number(v.total_cost).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Recent Tickets list */}
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
            ประวัติการแจ้งซ่อมล่าสุด
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTickets.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '20px 0', fontSize: '0.88rem' }}>ไม่มีประวัติการแจ้งซ่อมใหม่</div>
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
                    background: 'var(--glass-bg)',
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'var(--color-primary-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.background = 'var(--glass-bg)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}>{t.ticket_id}</span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>{t.plate_number}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
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
