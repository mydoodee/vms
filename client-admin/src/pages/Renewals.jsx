import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAdd, IoChevronDown, IoChevronForward, IoTrash, IoShieldCheckmarkOutline, IoDocumentTextOutline, IoCreate } from 'react-icons/io5';
import api from '../services/api';
import GlassCard from '../components/UI/GlassCard';
import NeonButton from '../components/UI/NeonButton';
import Modal from '../components/UI/Modal';
import ConfirmModal from '../components/UI/ConfirmModal';
import { useToast } from '../contexts/ToastContext';
import FileUpload from '../components/UI/FileUpload';
import ThaiDateInput from '../components/UI/ThaiDateInput';
import { formatThaiDate } from '../utils/thaiDate';
import { getFileUrl } from '../utils/fileUrl';

const typeLabels = { insurance: 'ประกันภัย', tax: 'ภาษีประจำปี', act: 'พ.ร.บ.' };
const typeColors = { insurance: 'var(--color-primary)', tax: 'var(--color-accent)', act: 'var(--color-success)' };

export default function Renewals() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [vehicleRenewals, setVehicleRenewals] = useState({});
  const [loadingRenewals, setLoadingRenewals] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('insurance'); // 'insurance' | 'tax'

  // Insurance companies state
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [renewType, setRenewType] = useState('insurance');
  const [insuranceLevel, setInsuranceLevel] = useState('1');
  const [renewDate, setRenewDate] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [provider, setProvider] = useState('');
  const [price, setPrice] = useState('0');
  const [inspectionFee, setInspectionFee] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');
  const [otherFee, setOtherFee] = useState('0');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteVid, setDeleteVid] = useState(null);

  const showToast = (message, type = 'success') => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/renewals/summary');
      setVehicles(data.data);
    } catch (err) {
      console.error('Failed to load summary', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/insurance-companies');
      setInsuranceCompanies(data.data);
    } catch (err) {
      console.error('Failed to load insurance companies', err);
    }
  };

  useEffect(() => { 
    fetchSummary(); 
    fetchCompanies();
  }, []);

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!vehicleRenewals[id]) {
      setLoadingRenewals(true);
      try {
        const { data } = await api.get(`/renewals/vehicle/${id}`);
        setVehicleRenewals(prev => ({ ...prev, [id]: data.data }));
      } catch (err) {
        console.error('Failed to load renewals for vehicle', id, err);
      } finally {
        setLoadingRenewals(false);
      }
    }
  };

  const openAddModal = (vid = '', type = null) => {
    setEditId(null);
    setVehicleId(vid || '');
    setRenewType(type || activeTab);
    setInsuranceLevel('1');
    setRenewDate('');
    setExpireDate('');
    setProvider('');
    setPrice('0');
    setInspectionFee('0');
    setServiceFee('0');
    setOtherFee('0');
    setNotes('');
    setShowNewCompanyInput(false);
    setNewCompanyName('');
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const openEditModal = (renewal, vid) => {
    setEditId(renewal.id);
    setVehicleId(vid);
    setRenewType(renewal.type);
    setInsuranceLevel(renewal.insurance_level || '1');
    // Format date string to YYYY-MM-DD
    setRenewDate(renewal.renew_date ? renewal.renew_date.slice(0, 10) : '');
    setExpireDate(renewal.expire_date ? renewal.expire_date.slice(0, 10) : '');
    setProvider(renewal.provider || '');
    setPrice(renewal.price ? String(renewal.price) : '0');
    setInspectionFee(renewal.inspection_fee ? String(renewal.inspection_fee) : '0');
    setServiceFee(renewal.service_fee ? String(renewal.service_fee) : '0');
    setOtherFee(renewal.other_fee ? String(renewal.other_fee) : '0');
    setNotes(renewal.notes || '');
    setShowNewCompanyInput(false);
    setNewCompanyName('');
    setSelectedFiles([]);
    setIsModalOpen(true);
  };

  const handleAddCompany = async () => {
    if (!newCompanyName || !newCompanyName.trim()) {
      showToast('กรุณากรอกชื่อบริษัทประกันภัย', 'error');
      return;
    }
    setLoadingCompanies(true);
    try {
      const { data } = await api.post('/insurance-companies', { name: newCompanyName });
      showToast('เพิ่มบริษัทประกันภัยสำเร็จ!', 'success');
      await fetchCompanies();
      setProvider(data.data.name);
      setShowNewCompanyInput(false);
      setNewCompanyName('');
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถเพิ่มบริษัทประกันได้', 'error');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    let uploadedPaths = [];
    if (!editId && selectedFiles.length > 0) {
      try {
        const formData = new FormData();
        selectedFiles.forEach(f => formData.append('files', f));
        const uploadRes = await api.post('/uploads/renewal/files', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedPaths = uploadRes.data.data;
      } catch (uploadErr) {
        showToast('อัปโหลดไฟล์แนบไม่สำเร็จ: ' + (uploadErr.response?.data?.message || uploadErr.message), 'error');
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        type: renewType,
        insurance_level: renewType === 'insurance' ? insuranceLevel : null,
        renew_date: renewDate,
        expire_date: expireDate || null,
        provider,
        price: parseFloat(price) || 0,
        inspection_fee: renewType === 'tax' ? (parseFloat(inspectionFee) || 0) : 0,
        service_fee: parseFloat(serviceFee) || 0,
        other_fee: parseFloat(otherFee) || 0,
        notes
      };

      if (editId) {
        await api.put(`/renewals/${editId}`, payload);
        showToast('แก้ไขข้อมูลการต่ออายุสำเร็จ!', 'success');
      } else {
        await api.post('/renewals', {
          ...payload,
          vehicle_id: parseInt(vehicleId),
          attachments: uploadedPaths.length > 0 ? JSON.stringify(uploadedPaths) : null
        });
        showToast('บันทึกการต่ออายุสำเร็จ!', 'success');
      }

      setIsModalOpen(false);
      setVehicleRenewals(prev => {
        const copy = { ...prev };
        delete copy[vehicleId];
        return copy;
      });
      fetchSummary();
      if (expandedId == vehicleId) {
        const { data } = await api.get(`/renewals/vehicle/${vehicleId}`);
        setVehicleRenewals(prev => ({ ...prev, [vehicleId]: data.data }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (renewalId, vid) => {
    setDeleteId(renewalId);
    setDeleteVid(vid);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/renewals/${deleteId}`);
      showToast('ลบรายการต่ออายุสำเร็จ!', 'success');
      setVehicleRenewals(prev => ({
        ...prev,
        [deleteVid]: prev[deleteVid].filter(r => r.id !== deleteId)
      }));
      fetchSummary();
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถลบข้อมูลได้', 'error');
    } finally {
      setDeleteId(null);
      setDeleteVid(null);
    }
  };

  const handleAppendAttachments = async (renewalId, fileList, vehicleId) => {
    if (!fileList || fileList.length === 0) return;
    try {
      const formData = new FormData();
      Array.from(fileList).forEach(f => formData.append('files', f));
      const uploadRes = await api.post('/uploads/renewal/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedFiles = uploadRes.data.data;
      const { data } = await api.post(`/renewals/${renewalId}/attachments`, { files: uploadedFiles });
      showToast('อัปโหลดไฟล์ย้อนหลังสำเร็จ!', 'success');
      setVehicleRenewals(prev => {
        const list = prev[vehicleId] || [];
        const updatedList = list.map(item => {
          if (item.id === renewalId) {
            return { ...item, attachments: JSON.stringify(data.data) };
          }
          return item;
        });
        return { ...prev, [vehicleId]: updatedList };
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถอัปโหลดไฟล์ย้อนหลังได้', 'error');
    }
  };

  const handleRemoveAttachment = async (renewalId, filePath, vehicleId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์แนบนี้?')) return;
    try {
      const { data } = await api.delete(`/renewals/${renewalId}/attachments`, {
        data: { file_path: filePath }
      });
      showToast('ลบไฟล์แนบสำเร็จ!', 'success');
      setVehicleRenewals(prev => {
        const list = prev[vehicleId] || [];
        const updatedList = list.map(item => {
          if (item.id === renewalId) {
            return { ...item, attachments: data.data ? JSON.stringify(data.data) : null };
          }
          return item;
        });
        return { ...prev, [vehicleId]: updatedList };
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'ไม่สามารถลบไฟล์แนบได้', 'error');
    }
  };

  const calcTotal = () => {
    const insp = renewType === 'tax' ? (parseFloat(inspectionFee) || 0) : 0;
    return ((parseFloat(price) || 0) + insp + (parseFloat(serviceFee) || 0) + (parseFloat(otherFee) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 });
  };

  const fmtDate = (d) => formatThaiDate(d);
  const fmtMoney = (v) => v ? `฿${Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '฿0.00';

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isNearExpired = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const renderAttachments = (r, vid) => {
    let attachedFiles = [];
    if (r.attachments) {
      try {
        attachedFiles = JSON.parse(r.attachments);
      } catch (e) {}
    }
    return (
      <div style={{ marginTop: '12px', borderTop: '1px dashed var(--glass-border)', paddingTop: '8px' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>เอกสารแนบ:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          {attachedFiles.map((file, fIdx) => (
            <div
              key={fIdx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                fontSize: '0.75rem',
                color: 'var(--color-primary)',
                transition: 'all 0.2s'
              }}
            >
              <a
                href={getFileUrl(file.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                📎 {file.original_name || file.file_name}
              </a>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAttachment(r.id, file.file_path, vid);
                }}
                style={{
                  color: '#ff4444',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  paddingLeft: '4px',
                  display: 'inline-block'
                }}
                title="ลบไฟล์แนบนี้"
              >
                ×
              </span>
            </div>
          ))}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed var(--glass-border)',
              borderRadius: '16px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-primary)';
              e.currentTarget.style.borderColor = 'var(--color-primary-dim)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
            }}
          >
            <input
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleAppendAttachments(r.id, e.target.files, vid)}
            />
            <span>➕ แนบเอกสารเพิ่ม</span>
          </label>
        </div>
      </div>
    );
  };

  const renderActions = (r, vid) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, alignSelf: 'stretch', justifyContent: 'flex-start' }}>
        <button
          onClick={(e) => { e.stopPropagation(); openEditModal(r, vid); }}
          style={{
            background: 'rgba(0,178,255,0.1)', border: '1px solid rgba(0,178,255,0.2)',
            borderRadius: '6px', color: 'var(--color-primary)', padding: '6px',
            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="แก้ไขข้อมูล"
        >
          <IoCreate size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(r.id, vid); }}
          style={{
            background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)',
            borderRadius: '6px', color: '#ff4444', padding: '6px',
            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title="ลบรายการ"
        >
          <IoTrash size={14} />
        </button>
      </div>
    );
  };

  if (loading) return <div className="text-center py-xl"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '4px' }}>ต่อประกันและภาษี</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>จัดการประวัติการต่ออายุประกันภัยและภาษีรถยนต์</p>
        </div>
        <NeonButton onClick={() => openAddModal(null, 'insurance')}>
          <IoAdd size={18} style={{ marginRight: '6px' }} /> บันทึกการต่ออายุ
        </NeonButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {vehicles.map((v) => (
          <GlassCard key={v.id} style={{ padding: 0, overflow: 'hidden' }}>
            {/* Vehicle Header Row */}
            <div
              onClick={() => toggleExpand(v.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                background: expandedId === v.id ? 'rgba(255,255,255,0.03)' : 'transparent'
              }}
            >
              {/* Expand icon */}
              <div style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expandedId === v.id ? 'rotate(0)' : 'rotate(0)' }}>
                {expandedId === v.id ? <IoChevronDown size={20} /> : <IoChevronForward size={20} />}
              </div>

              {/* Clickable Vehicle Wrapper */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/vehicles/${v.id}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer'
                }}
                title="ดูรายละเอียดรถยนต์"
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {/* Vehicle image or placeholder */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden',
                  border: '1px solid var(--glass-border)', flexShrink: 0,
                  background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {(() => {
                    if (!v.image_url) return <span style={{ fontSize: '1.2rem' }}>🚗</span>;
                    let imgs = [];
                    try {
                      imgs = JSON.parse(v.image_url);
                    } catch (e) {
                      imgs = [v.image_url];
                    }
                    const first = imgs[0];
                    if (!first) return <span style={{ fontSize: '1.2rem' }}>🚗</span>;
                    return (
                      <img 
                        src={getFileUrl(first)} 
                        alt="" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    );
                  })()}
                </div>

                {/* Vehicle info */}
                <div style={{ minWidth: '160px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary-dim)' }}>{v.plate_number}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.brand} {v.model}</div>
                </div>
              </div>

              {/* Grid of Renewal Info: ประกัน, ภาษี, พรบ. */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flex: 1, padding: '0 16px' }}>
                {/* ประกัน */}
                <div style={{ borderLeft: '2px solid var(--color-primary)', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>🛡️ ประกันภัย</span>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 600, 
                    color: isExpired(v.insurance_expire) ? 'var(--color-danger)' : isNearExpired(v.insurance_expire) ? 'var(--color-warning)' : 'var(--text-secondary)'
                  }}>
                    {fmtDate(v.insurance_expire)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ต่อ {v.insurance_count || 0} ครั้ง ({fmtMoney(v.insurance_spent)})</span>
                </div>

                {/* ภาษี */}
                <div style={{ borderLeft: '2px solid var(--color-accent)', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>📄 ภาษีประจำปี</span>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 600, 
                    color: isExpired(v.tax_expire) ? 'var(--color-danger)' : isNearExpired(v.tax_expire) ? 'var(--color-warning)' : 'var(--text-secondary)'
                  }}>
                    {fmtDate(v.tax_expire)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ต่อ {v.tax_count || 0} ครั้ง ({fmtMoney(v.tax_spent)})</span>
                </div>

                {/* พรบ. */}
                <div style={{ borderLeft: '2px solid var(--color-success)', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>⚡ พ.ร.บ.</span>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 600, 
                    color: isExpired(v.act_expire) ? 'var(--color-danger)' : isNearExpired(v.act_expire) ? 'var(--color-warning)' : 'var(--text-secondary)'
                  }}>
                    {fmtDate(v.act_expire)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ต่อ {v.act_count || 0} ครั้ง ({fmtMoney(v.act_spent)})</span>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <NeonButton
                  variant="ghost"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={(e) => { e.stopPropagation(); openAddModal(v.id); }}
                >
                  <IoAdd size={16} /> ต่ออายุ
                </NeonButton>
              </div>
            </div>

            {/* Expanded Detail */}
            {expandedId === v.id && (
              <div style={{
                borderTop: '1px solid var(--glass-border)',
                padding: '16px 20px',
                background: 'rgba(0,0,0,0.15)'
              }}>
                {loadingRenewals ? (
                  <div className="text-center py-md"><div className="spinner" /></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
                    {/* Column 1: Insurance History */}
                    <div>
                      <h4 style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        paddingBottom: '6px'
                      }}>
                        🛡️ ประวัติประกันภัย ({(vehicleRenewals[v.id] || []).filter(r => r.type === 'insurance').length})
                      </h4>
                      {(!vehicleRenewals[v.id] || vehicleRenewals[v.id].filter(r => r.type === 'insurance').length === 0) ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>ยังไม่มีประวัติการต่อประกันภัย</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {vehicleRenewals[v.id].filter(r => r.type === 'insurance').map((r) => (
                            <div key={r.id} style={{
                              display: 'flex', alignItems: 'flex-start', gap: '14px',
                              padding: '14px 16px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 'var(--radius-md)',
                              borderLeft: `3px solid var(--color-primary)`
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <span style={{
                                    fontSize: '0.7rem', fontWeight: 700,
                                    padding: '2px 8px', borderRadius: '4px',
                                    background: 'var(--color-primary-subtle)',
                                    color: 'var(--color-primary)'
                                  }}>
                                    ประกันภัย {r.insurance_level && `(ชั้น ${r.insurance_level})`}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {fmtDate(r.renew_date)} → {fmtDate(r.expire_date)}
                                  </span>
                                </div>
                                {r.provider && (
                                  <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>บริษัทประกัน: </span>
                                    <span style={{ fontWeight: 600 }}>{r.provider}</span>
                                  </div>
                                )}
                                {/* 3-column or flex grid breakdown */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px', marginTop: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>เบี้ยประกัน</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.price)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่าดำเนินการ</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.service_fee)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่าอื่น ๆ</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.other_fee)}</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-success)' }}>
                                    รวม: {fmtMoney(r.total_cost)}
                                  </span>
                                  {r.notes && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📝 {r.notes}</span>}
                                </div>
                                {renderAttachments(r, v.id)}
                              </div>
                              {renderActions(r, v.id)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Tax History */}
                    <div>
                      <h4 style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--color-accent)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        paddingBottom: '6px'
                      }}>
                        📄 ประวัติภาษีประจำปี ({(vehicleRenewals[v.id] || []).filter(r => r.type === 'tax').length})
                      </h4>
                      {(!vehicleRenewals[v.id] || vehicleRenewals[v.id].filter(r => r.type === 'tax').length === 0) ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>ยังไม่มีประวัติการต่อภาษีประจำปี</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {vehicleRenewals[v.id].filter(r => r.type === 'tax').map((r) => (
                            <div key={r.id} style={{
                              display: 'flex', alignItems: 'flex-start', gap: '14px',
                              padding: '14px 16px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 'var(--radius-md)',
                              borderLeft: `3px solid var(--color-accent)`
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <span style={{
                                    fontSize: '0.7rem', fontWeight: 700,
                                    padding: '2px 8px', borderRadius: '4px',
                                    background: 'var(--color-accent-subtle)',
                                    color: 'var(--color-accent)'
                                  }}>
                                    ภาษีประจำปี
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {fmtDate(r.renew_date)} → {fmtDate(r.expire_date)}
                                  </span>
                                </div>
                                {r.provider && (
                                  <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>ผู้ดำเนินการ: </span>
                                    <span style={{ fontWeight: 600 }}>{r.provider}</span>
                                  </div>
                                )}
                                {/* 2x2 grid breakdown */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginTop: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่าภาษี</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.price)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่าตรวจสภาพ</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.inspection_fee)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่าดำเนินการ</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.service_fee)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่าอื่น ๆ</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.other_fee)}</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-success)' }}>
                                    รวม: {fmtMoney(r.total_cost)}
                                  </span>
                                  {r.notes && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📝 {r.notes}</span>}
                                </div>
                                {renderAttachments(r, v.id)}
                              </div>
                              {renderActions(r, v.id)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 3: Act History */}
                    <div>
                      <h4 style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--color-success)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        paddingBottom: '6px'
                      }}>
                        ⚡ ประวัติ พ.ร.บ. ({(vehicleRenewals[v.id] || []).filter(r => r.type === 'act').length})
                      </h4>
                      {(!vehicleRenewals[v.id] || vehicleRenewals[v.id].filter(r => r.type === 'act').length === 0) ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>ยังไม่มีประวัติการต่อ พ.ร.บ.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {vehicleRenewals[v.id].filter(r => r.type === 'act').map((r) => (
                            <div key={r.id} style={{
                              display: 'flex', alignItems: 'flex-start', gap: '14px',
                              padding: '14px 16px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 'var(--radius-md)',
                              borderLeft: `3px solid var(--color-success)`
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <span style={{
                                    fontSize: '0.7rem', fontWeight: 700,
                                    padding: '2px 8px', borderRadius: '4px',
                                    background: 'var(--color-success-subtle)',
                                    color: 'var(--color-success)'
                                  }}>
                                    พ.ร.บ.
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {fmtDate(r.renew_date)} → {fmtDate(r.expire_date)}
                                  </span>
                                </div>
                                {r.provider && (
                                  <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>ผู้ดำเนินการ: </span>
                                    <span style={{ fontWeight: 600 }}>{r.provider}</span>
                                  </div>
                                )}
                                {/* 3-column breakdown */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 12px', marginTop: '8px' }}>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่า พ.ร.บ.</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.price)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่าดำเนินการ</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.service_fee)}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ค่าอื่น ๆ</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmtMoney(r.other_fee)}</div>
                                  </div>
                                </div>
                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-success)' }}>
                                    รวม: {fmtMoney(r.total_cost)}
                                  </span>
                                  {r.notes && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📝 {r.notes}</span>}
                                </div>
                                {renderAttachments(r, v.id)}
                              </div>
                              {renderActions(r, v.id)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        ))}

        {vehicles.length === 0 && (
          <div className="text-center text-muted py-xl">ไม่พบข้อมูลรถยนต์ในระบบ</div>
        )}
      </div>

      {/* Add Renewal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title={editId ? "แก้ไขรายละเอียดการต่ออายุ" : "บันทึกการต่อประกัน / ภาษี"}
        footer={
          <>
            <NeonButton variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>ยกเลิก</NeonButton>
            <NeonButton variant="primary" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  <span>กำลังบันทึก...</span>
                </div>
              ) : (
                'บันทึก'
              )}
            </NeonButton>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
            <label className="form-label">เลือกรถยนต์</label>
            <select className="form-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required disabled={!!editId}>
              <option value="">-- เลือกรถยนต์ --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: '4px' }}>
            <label className="form-label">ประเภทการต่ออายุ</label>
            <div style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.03)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              width: '100%',
              opacity: editId ? 0.6 : 1,
              pointerEvents: editId ? 'none' : 'auto',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => !editId && setRenewType('insurance')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: renewType === 'insurance' ? 'var(--color-primary)' : 'transparent',
                  color: renewType === 'insurance' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: editId ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                disabled={!!editId}
              >
                🛡️ ประกันภัย
              </button>
              <button
                type="button"
                onClick={() => !editId && setRenewType('tax')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: renewType === 'tax' ? 'var(--color-accent)' : 'transparent',
                  color: renewType === 'tax' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: editId ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                disabled={!!editId}
              >
                📄 ภาษีประจำปี
              </button>
              <button
                type="button"
                onClick={() => !editId && setRenewType('act')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: renewType === 'act' ? 'var(--color-success)' : 'transparent',
                  color: renewType === 'act' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: editId ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                disabled={!!editId}
              >
                ⚡ พ.ร.บ.
              </button>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              {renewType === 'insurance' ? 'บริษัทประกันภัย' : renewType === 'act' ? 'บริษัท พ.ร.บ.' : 'ผู้ให้บริการ / บริษัท'}
            </label>
            {renewType === 'insurance' || renewType === 'act' ? (
              !showNewCompanyInput ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    className="form-select"
                    value={provider}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setShowNewCompanyInput(true);
                      } else {
                        setProvider(e.target.value);
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    <option value="">{renewType === 'insurance' ? '-- เลือกบริษัทประกัน --' : '-- เลือกบริษัท พ.ร.บ. --'}</option>
                    {insuranceCompanies.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="new" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>+ เพิ่มบริษัทใหม่</option>
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ระบุบริษัทใหม่"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCompany}
                    disabled={loadingCompanies}
                    style={{
                      background: 'var(--color-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      padding: '0 12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    เพิ่ม
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCompanyInput(false);
                      setNewCompanyName('');
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      padding: '0 12px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ยกเลิก
                  </button>
                </div>
              )
            ) : (
              <input type="text" className="form-input" placeholder="เช่น กรมการขนส่งทางบก" value={provider} onChange={(e) => setProvider(e.target.value)} />
            )}
          </div>
           {renewType === 'insurance' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ระดับประกันภัย</label>
              <select className="form-select" value={insuranceLevel} onChange={(e) => setInsuranceLevel(e.target.value)}>
                <option value="1">ชั้น 1</option>
                <option value="2">ชั้น 2</option>
                <option value="2+">ชั้น 2+</option>
                <option value="3">ชั้น 3</option>
                <option value="3+">ชั้น 3+</option>
                <option value="อื่น ๆ">อื่น ๆ</option>
              </select>
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 0, gridColumn: (renewType === 'tax' || renewType === 'act') ? 'span 2' : 'auto' }}>
            <label className="form-label">วันที่ต่ออายุ</label>
            <ThaiDateInput value={renewDate} onChange={(v) => setRenewDate(v)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: (renewType === 'tax' || renewType === 'act') ? 'span 2' : 'auto' }}>
            <label className="form-label">วันหมดอายุ</label>
            <ThaiDateInput value={expireDate} onChange={(v) => setExpireDate(v)} />
          </div>

          {/* Fee breakdown */}
          <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>รายละเอียดค่าใช้จ่าย</span>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              {renewType === 'insurance' ? 'เบี้ยประกัน (บาท)' : renewType === 'act' ? 'ค่า พ.ร.บ. (บาท)' : 'ค่าภาษี (บาท)'}
            </label>
            <input type="number" step="0.01" className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          {renewType === 'tax' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">ค่าตรวจสภาพ (บาท)</label>
              <input type="number" step="0.01" className="form-input" value={inspectionFee} onChange={(e) => setInspectionFee(e.target.value)} />
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ค่าดำเนินการ (บาท)</label>
            <input type="number" step="0.01" className="form-input" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ค่าอื่น ๆ (บาท)</label>
            <input type="number" step="0.01" className="form-input" value={otherFee} onChange={(e) => setOtherFee(e.target.value)} />
          </div>

          <div style={{
            gridColumn: 'span 2',
            background: 'var(--color-primary-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>ยอมรวมทั้งสิ้น</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>฿{calcTotal()}</span>
          </div>

          {!editId && (
            <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
              <label className="form-label">แนบไฟล์เอกสาร (ใบเสร็จ, สำเนากรมธรรม์, สำเนาทะเบียนรถ)</label>
              <FileUpload onFilesSelected={(files) => setSelectedFiles(files)} />
            </div>
          )}

          <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
            <label className="form-label">หมายเหตุ</label>
            <textarea className="form-textarea" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </form>
      </Modal>



      {/* Custom Confirm Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบประวัติการต่ออายุ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการประวัติการต่อประกันหรือต่อภาษีรายการนี้? การดำเนินการนี้จะส่งผลต่อการคำนวณยอดใช้จ่ายรวมของรถคันนี้"
        confirmText="ลบประวัติ"
        variant="danger"
      />
    </div>
  );
}
