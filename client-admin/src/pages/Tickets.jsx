import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IoAdd, IoEye, IoTrash } from 'react-icons/io5';
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

  const showToast = (message, type = 'success') => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/tickets/${deleteId}`);
      fetchTickets();
      showToast('ลบใบแจ้งซ่อมสำเร็จ!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถลบข้อมูลได้', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const fetchTickets = async () => {
    try {
      let url = '/tickets';
      const params = [];
      if (statusFilter) params.push(`status=${statusFilter}`);
      if (severityFilter) params.push(`severity=${severityFilter}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const { data } = await api.get(url);
      setTickets(data.data);
    } catch (err) {
      setError('ไม่สามารถเรียกข้อมูลใบแจ้งซ่อมได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, severityFilter]);

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

  const columns = [
    { key: 'ticket_id', label: 'Ticket ID', sortable: true },
    { key: 'plate_number', label: 'ทะเบียนรถ', sortable: true },
    { key: 'title', label: 'หัวข้อการแจ้งซ่อม', sortable: true },
    { 
      key: 'problem_type', 
      label: 'หมวดหมู่ปัญหา', 
      sortable: true,
      render: (val) => getProblemTypeLabel(val)
    },
    { 
      key: 'severity', 
      label: 'ความเร่งด่วน', 
      sortable: true,
      render: (val) => {
        const severities = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง', critical: 'วิกฤต' };
        return <StatusBadge type="severity" value={val} label={severities[val]} />;
      }
    },
    { 
      key: 'status', 
      label: 'สถานะ', 
      sortable: true,
      render: (val) => <StatusBadge type="status" value={val} label={getStatusLabel(val)} />
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
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">รายการแจ้งซ่อมทั้งหมด</h1>
          <p className="page-subtitle">ติดตามและอัปเดตสถานะของทุกรายการแจ้งซ่อม และบันทึกค่าใช้จ่าย</p>
        </div>
        <NeonButton onClick={() => navigate('/tickets/new')} variant="primary" icon={<IoAdd />}>
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
        data={tickets} 
        searchField="ticket_id"
        searchPlaceholder="ค้นหา Ticket ID..."
        loading={loading}
        actions={(row) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <NeonButton size="sm" variant="ghost" icon={<IoEye />} onClick={() => navigate(`/tickets/${row.id}`)}>
              ดูรายละเอียด
            </NeonButton>
            {user?.role === 'admin' && (
              <NeonButton size="sm" variant="danger" icon={<IoTrash />} onClick={() => handleDelete(row.id)} />
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
