import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IoArrowBack, IoBuildOutline, IoCashOutline, IoDocumentAttachOutline, IoDownloadOutline, IoTrashOutline, IoBusinessOutline } from 'react-icons/io5';
import api from '../services/api';
import GlassCard from '../components/UI/GlassCard';
import StatusBadge from '../components/UI/StatusBadge';
import NeonButton from '../components/UI/NeonButton';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Modal from '../components/UI/Modal';
import ConfirmModal from '../components/UI/ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import { formatThaiDate } from '../utils/thaiDate';
import { getFileUrl } from '../utils/fileUrl';

const formatThaiDateTime = (dateInput) => {
  if (!dateInput) return '-';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '-';
  const formattedDate = formatThaiDate(date);
  const time = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return `${formattedDate} เวลา ${time} น.`;
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [garages, setGarages] = useState([]);
  const [selectedGarageId, setSelectedGarageId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast, confirm: showConfirm } = useToast();

  const showToast = (message, type = 'success') => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  const handleDeleteTicket = () => {
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/tickets/${id}`);
      showToast('ลบใบแจ้งซ่อมสำเร็จ!', 'success');
      setTimeout(() => {
        navigate('/tickets');
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถลบใบแจ้งซ่อมได้', 'error');
    }
  };

  // Cost modal states
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [laborCost, setLaborCost] = useState('0');
  const [partsCost, setPartsCost] = useState('0');
  const [otherCost, setOtherCost] = useState('0');
  const [costDescription, setCostDescription] = useState('');

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data.data);
      setSelectedGarageId(data.data.garage_id ? String(data.data.garage_id) : '');
      if (data.data.costs) {
        setLaborCost(data.data.costs.labor_cost);
        setPartsCost(data.data.costs.parts_cost);
        setOtherCost(data.data.costs.other_cost);
        setCostDescription(data.data.costs.description || '');
      }
    } catch (err) {
      setError('ไม่สามารถเรียกข้อมูลใบแจ้งซ่อมได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    api.get('/garages?status=active').then(r => setGarages(r.data.data)).catch(() => {});
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-danger text-center">{error}</div>;

  const handleStatusChange = async (nextStatus) => {
    try {
      await api.put(`/tickets/${id}/status`, { status: nextStatus });
      fetchTicket();
      toast.success('ปรับปรุงสถานะสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.message || 'ปรับปรุงสถานะไม่สำเร็จ');
    }
  };

  const handleSaveCosts = async () => {
    try {
      await api.post(`/tickets/${id}/costs`, {
        labor_cost: parseFloat(laborCost) || 0,
        parts_cost: parseFloat(partsCost) || 0,
        other_cost: parseFloat(otherCost) || 0,
        description: costDescription
      });
      setIsCostModalOpen(false);
      fetchTicket();
      toast.success('บันทึกข้อมูลค่าใช้จ่ายสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.message || 'บันทึกข้อมูลค่าใช้จ่ายไม่สำเร็จ');
    }
  };

  const handleAssignGarage = async () => {
    try {
      await api.put(`/tickets/${id}`, { garage_id: selectedGarageId ? parseInt(selectedGarageId) : null });
      fetchTicket();
      toast.success('บันทึกข้อมูลอู่/ศูนย์บริการสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const ok = await showConfirm('คุณแน่ใจว่าต้องการลบไฟล์แนบนี้หรือไม่?', 'ยืนยันการลบไฟล์');
    if (!ok) return;
    try {
      await api.delete(`/uploads/file/${attachmentId}`);
      toast.success('ลบไฟล์แนบสำเร็จ!');
      fetchTicket();
    } catch (err) {
      toast.error('ไม่สามารถลบไฟล์ได้');
    }
  };

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

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
  };

  const canApprove = (user?.role === 'admin' || user?.role === 'manager');
  const isWorkflowAllowed = (user?.role === 'admin' || user?.role === 'manager');

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <NeonButton variant="ghost" size="sm" onClick={() => navigate('/tickets')} icon={<IoArrowBack />}>
          กลับ
        </NeonButton>
        <div>
          <h1 className="page-title">รายละเอียดใบแจ้งซ่อม</h1>
          <p className="page-subtitle">ID: {ticket.ticket_id} — สำหรับทะเบียน {ticket.plate_number}</p>
        </div>
      </div>

      <div className="grid grid-3 mb-lg">
        {/* Main Details Panel */}
        <GlassCard style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyStyle: 'flex-start', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
            <IoBuildOutline size={24} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>รายละเอียดอาการและความเสียหาย</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>หัวข้อการแจ้งซ่อม</span>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{ticket.title}</p>
            </div>
            
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>รายละเอียดเชิงลึก</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', minHeight: '80px' }}>
                {ticket.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
              </p>
            </div>

            <div className="grid grid-3" style={{ gap: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ประเภทรถที่เกิดปัญหา</span>
                <p style={{ fontWeight: 600 }}>{ticket.brand} {ticket.model || '-'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ประเภทปัญหา</span>
                <p style={{ fontWeight: 600 }}>{getProblemTypeLabel(ticket.problem_type)}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ระดับความรุนแรง</span>
                <div style={{ marginTop: '2px' }}>
                  <StatusBadge type="severity" value={ticket.severity} label={
                    ticket.severity === 'low' ? 'ต่ำ' :
                    ticket.severity === 'medium' ? 'ปานกลาง' :
                    ticket.severity === 'high' ? 'สูง' : 'วิกฤต'
                  } />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '5px 0' }} />

            <div className="grid grid-3" style={{ gap: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ผู้แจ้งซ่อม</span>
                <p style={{ fontWeight: 600 }}>{ticket.reporter_name}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>เบอร์ติดต่อ</span>
                <p style={{ fontWeight: 600 }}>{ticket.reporter_phone || '-'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>วันแจ้งซ่อม</span>
                <p style={{ fontWeight: 600 }}>{formatThaiDateTime(ticket.created_at)}</p>
              </div>
            </div>

            {/* Garage info */}
            <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '5px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoBusinessOutline size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>อู่ / ศูนย์ซ่อมที่กำหนด</span>
            </div>
            {ticket.registered_garage_name ? (
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                <p style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: '4px' }}>{ticket.registered_garage_name}</p>
                {ticket.registered_garage_phone && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>เบอร์: {ticket.registered_garage_phone}</p>}
                {ticket.registered_garage_address && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ticket.registered_garage_address}</p>}
              </div>
            ) : ticket.garage_name ? (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '10px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{ticket.garage_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(ระบุเอง)</span></p>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>ยังไม่ได้กำหนดอู่/ศูนย์ซ่อม</p>
            )}
          </div>
        </GlassCard>

        {/* Workflow actions & Cost Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Status Box */}
          <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>สถานะปัจจุบัน</span>
              <div style={{ marginTop: '5px' }}>
                <StatusBadge type="status" value={ticket.status} label={getStatusLabel(ticket.status)} />
              </div>
            </div>

            {/* Workflow status action triggers */}
            {isWorkflowAllowed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                {(ticket.status === 'reported' || ticket.status === 'reviewing' || ticket.status === 'approved') && (
                  <NeonButton variant="accent" onClick={() => handleStatusChange('repairing')}>ส่งเข้าซ่อม (Repairing)</NeonButton>
                )}
                {ticket.status === 'repairing' && (
                  <NeonButton variant="primary" onClick={() => handleStatusChange('completed')}>เสร็จสิ้น (Completed)</NeonButton>
                )}
                {ticket.status === 'completed' && (
                  <NeonButton variant="accent" onClick={() => handleStatusChange('closed')}>ปิดงาน (Close Ticket)</NeonButton>
                )}
                {ticket.status === 'closed' && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>ใบแจ้งซ่อมถูกปิดอย่างสมบูรณ์</span>
                )}
              </div>
            )}

            {user?.role === 'admin' && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <NeonButton variant="danger" style={{ width: '100%' }} onClick={handleDeleteTicket} icon={<IoTrashOutline />}>
                  ลบใบแจ้งซ่อม
                </NeonButton>
              </div>
            )}
          </GlassCard>

          {/* Garage Assignment Card */}
          {isWorkflowAllowed && (
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '14px' }}>
                <IoBusinessOutline size={20} style={{ color: 'var(--color-accent)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>กำหนดอู่ / ศูนย์ซ่อม</span>
              </div>
              <select
                className="form-select"
                value={selectedGarageId}
                onChange={(e) => setSelectedGarageId(e.target.value)}
                disabled={ticket.status === 'closed'}
                style={{ fontSize: '0.85rem', marginBottom: '10px' }}
              >
                <option value="">-- ยังไม่ได้กำหนด --</option>
                {garages.map(g => (
                  <option key={g.id} value={String(g.id)}>{g.name}{g.phone ? ` (${g.phone})` : ''}</option>
                ))}
              </select>
              {ticket.status !== 'closed' && (
                <NeonButton size="sm" variant="ghost" style={{ width: '100%' }} onClick={handleAssignGarage}>
                  บันทึกอู่ที่กำหนด
                </NeonButton>
              )}
            </GlassCard>
          )}

          {/* Costs Box */}
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', justifyStyle: 'flex-start', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '15px' }}>
              <IoCashOutline size={20} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>ข้อมูลค่าใช้จ่าย</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ค่าซ่อมเบื้องต้นที่กะประมาณ:</span>
                <span style={{ fontWeight: 600 }}>฿{formatMoney(ticket.estimated_cost)}</span>
              </div>
              <hr style={{ border: 'none', borderBottom: '1px dashed var(--glass-border)' }} />
              {ticket.costs ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ค่าแรง:</span>
                    <span>฿{formatMoney(ticket.costs.labor_cost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ค่าอะไหล่:</span>
                    <span>฿{formatMoney(ticket.costs.parts_cost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ค่าใช้จ่ายอื่นๆ:</span>
                    <span>฿{formatMoney(ticket.costs.other_cost)}</span>
                  </div>
                  <hr style={{ border: 'none', borderBottom: '1px solid var(--glass-border)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--color-primary)' }}>ยอดรวมจริง:</span>
                    <span style={{ color: 'var(--color-primary)' }}>฿{formatMoney(ticket.costs.total_cost)}</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '10px 0' }}>ไม่มีการบันทึกค่าใช้จ่ายจริง</div>
              )}

              {isWorkflowAllowed && ticket.status !== 'closed' && (
                <NeonButton size="sm" variant="ghost" style={{ marginTop: '10px' }} onClick={() => setIsCostModalOpen(true)}>
                  แก้ไขค่าใช้จ่ายจริง
                </NeonButton>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Attachments Section */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyStyle: 'flex-start', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <IoDocumentAttachOutline size={24} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ไฟล์เอกสาร / รูปภาพแนบ</h3>
        </div>

        {ticket.attachments?.length === 0 ? (
          <div className="text-center text-muted py-md">ไม่มีไฟล์หรือภาพถ่ายแนบ</div>
        ) : (
          <div className="grid grid-4" style={{ gap: '15px' }}>
            {ticket.attachments?.map((file) => {
              const ext = '.' + file.file_name.split('.').pop().toLowerCase();
              const isImage = ['.jpg', '.jpeg', '.png'].includes(ext);

              return (
                <div 
                  key={file.id} 
                  style={{
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {isImage ? (
                    <div style={{ height: '140px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={getFileUrl(file.file_path)} alt={file.original_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <IoDocumentAttachOutline size={40} />
                      <span style={{ fontSize: '0.75rem', width: '80%', textAlign: 'center', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {file.original_name}
                      </span>
                    </div>
                  )}
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)' }}>
                    <a 
                      href={getFileUrl(file.file_path)} 
                      download={file.original_name}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                    >
                      <IoDownloadOutline size={16} /> โหลด
                    </a>
                    {user?.id === file.uploaded_by && (
                      <button 
                        onClick={() => handleDeleteAttachment(file.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                      >
                        <IoTrashOutline size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Real cost updates Modal */}
      <Modal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        title="บันทึกรายละเอียดค่าซ่อมบำรุงจริง"
        footer={
          <>
            <NeonButton variant="ghost" onClick={() => setIsCostModalOpen(false)}>ยกเลิก</NeonButton>
            <NeonButton variant="primary" onClick={handleSaveCosts}>บันทึกค่าใช้จ่าย</NeonButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ค่าแรงช่าง (บาท)</label>
            <input type="number" className="form-input" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ค่าชิ้นส่วนอะไหล่ (บาท)</label>
            <input type="number" className="form-input" value={partsCost} onChange={(e) => setPartsCost(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ค่าบริการหรือค่าจิปาถะอื่น (บาท)</label>
            <input type="number" className="form-input" value={otherCost} onChange={(e) => setOtherCost(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">รายละเอียดการซ่อมและการเปลี่ยนอะไหล่</label>
            <textarea className="form-textarea" rows="3" value={costDescription} onChange={(e) => setCostDescription(e.target.value)} placeholder="เช่น เปลี่ยนแบตเตอรี่ใหม่ 1 ลูก, ค่าเจียรจานดิสเบรกคู่หน้า..."></textarea>
          </div>
        </div>
      </Modal>



      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบใบแจ้งซ่อม"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบใบแจ้งซ่อมรายการนี้? การดำเนินการนี้จะลบประวัติและไฟล์แนบทั้งหมดที่เกี่ยวข้องกับ Ticket นี้"
        confirmText="ลบใบแจ้งซ่อม"
        variant="danger"
      />
    </div>
  );
}
