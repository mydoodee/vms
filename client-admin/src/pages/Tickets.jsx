import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LuPlus, LuEye, LuTrash2 } from 'react-icons/lu';
import api from '../services/api';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import NeonButton from '../components/UI/NeonButton';
import ConfirmModal from '../components/UI/ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import { formatThaiDate } from '../utils/thaiDate';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering states
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchTickets = async () => {
    try {
      const { data } = await api.get('/tickets');
      setTickets(data.data);
    } catch (err) {
      setError('ไม่สามารถโหลดรายการใบแจ้งซ่อมได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/tickets/${deleteId}`);
      toast.success('ลบรายการสำเร็จ!');
      fetchTickets();
    } catch (err) {
      toast.error('ไม่สามารถลบรายการนี้ได้');
    }
  };

  const columns = [
    { key: 'ticket_id', label: 'Ticket ID', sortable: true },
    { key: 'plate_number', label: 'ทะเบียนรถ', sortable: true },
    { key: 'title', label: 'ปัญหาที่พบ', sortable: true },
    { 
      key: 'severity', 
      label: 'ความเร่งด่วน', 
      sortable: true,
      render: (val) => (
        <StatusBadge 
          type="severity" 
          value={val} 
          label={
            val === 'low' ? 'ต่ำ' :
            val === 'medium' ? 'ปานกลาง' :
            val === 'high' ? 'สูง' : 'วิกฤต'
          } 
        />
      )
    },
    { 
      key: 'status', 
      label: 'สถานะ', 
      sortable: true,
      render: (val) => (
        <StatusBadge 
          type="status" 
          value={val} 
          label={
            val === 'reported' ? 'แจ้งเรื่อง' :
            val === 'reviewing' ? 'กำลังตรวจสอบ' :
            val === 'approved' ? 'อนุมัติแล้ว' :
            val === 'repairing' ? 'กำลังซ่อม' :
            val === 'completed' ? 'ซ่อมเสร็จ' : 'ปิดงาน'
          } 
        />
      )
    },
    { 
      key: 'created_at', 
      label: 'วันที่แจ้ง', 
      sortable: true,
      render: (val) => formatThaiDate(val)
    }
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">รายการใบแจ้งซ่อม</h1>
          <p className="page-subtitle">แสดงรายการแจ้งซ่อมบำรุงรถยนต์และสถานะการดำเนินงานซ่อม</p>
        </div>
        <NeonButton onClick={() => navigate('/tickets/new')} variant="primary" icon={<LuPlus />}>
          แจ้งซ่อมบำรุง
        </NeonButton>
      </div>

      {error && <div className="text-danger mb-md">{error}</div>}

      {/* Filter panel */}
      <div 
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>สถานะ:</span>
          <select 
            className="form-select" 
            style={{ width: '160px', padding: '6px 12px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="reported">แจ้งเรื่อง</option>
            <option value="repairing">กำลังซ่อม</option>
            <option value="completed">ซ่อมเสร็จ</option>
            <option value="closed">ปิดงาน</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ความเร่งด่วน:</span>
          <select 
            className="form-select" 
            style={{ width: '160px', padding: '6px 12px' }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            <option value="low">ต่ำ</option>
            <option value="medium">ปานกลาง</option>
            <option value="high">สูง</option>
            <option value="critical">วิกฤต</option>
          </select>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={tickets.filter(t => {
          if (statusFilter && t.status !== statusFilter) return false;
          if (severityFilter && t.severity !== severityFilter) return false;
          return true;
        })} 
        searchField="ticket_id"
        searchPlaceholder="ค้นหา Ticket ID..."
        loading={loading}
        actions={(row) => (
          <div style={{ display: 'flex', gap: '4px' }}>
            <NeonButton size="sm" variant="ghost" icon={<LuEye size={14} />} onClick={() => navigate(`/tickets/${row.id}`)}>
              ดูรายละเอียด
            </NeonButton>
            {user?.role === 'admin' && (
              <button
                onClick={() => handleDelete(row.id)}
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', padding: '6px', color: 'var(--color-danger)', borderRadius: '8px' }}
                title="ลบใบแจ้งซ่อม"
              >
                <LuTrash2 size={14} />
              </button>
            )}
          </div>
        )}
      />

      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบใบแจ้งซ่อม"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบใบแจ้งซ่อมรายการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบรายการ"
        variant="danger"
      />
    </div>
  );
}
