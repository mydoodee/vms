import React, { useState, useEffect } from 'react';
import { IoAdd, IoCreate, IoTrash, IoBusinessOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import api from '../services/api';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import NeonButton from '../components/UI/NeonButton';
import Modal from '../components/UI/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Garages() {
  const [activeTab, setActiveTab] = useState('garages'); // 'garages' | 'insurance'
  const [garages, setGarages] = useState([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Auth checks
  const { user } = useAuth();
  const isManagerOrAdmin = ['admin', 'manager'].includes(user?.role);
  const isAdmin = user?.role === 'admin';
  const { toast, confirm } = useToast();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [status, setStatus] = useState('active');

  const fetchGarages = async () => {
    try {
      const { data } = await api.get('/garages');
      setGarages(data.data);
      setError('');
    } catch (err) {
      setError('ไม่สามารถเรียกข้อมูลอู่/ศูนย์บริการได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsuranceCompanies = async () => {
    try {
      const { data } = await api.get('/insurance-companies');
      // Normalize database field is_active (1/0) into status ('active'/'inactive')
      const normalized = data.data.map(item => ({
        ...item,
        status: item.is_active === 1 ? 'active' : 'inactive'
      }));
      setInsuranceCompanies(normalized);
      setError('');
    } catch (err) {
      setError('ไม่สามารถเรียกข้อมูลบริษัทประกันได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'garages') {
      fetchGarages();
    } else {
      fetchInsuranceCompanies();
    }
  }, [activeTab]);

  const openAddModal = () => {
    setSelectedItem(null);
    setName('');
    setPhone('');
    setAddress('');
    setContactPerson('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setName(item.name);
    setPhone(item.phone || '');
    setAddress(item.address || '');
    setContactPerson(item.contact_person || '');
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, itemName) => {
    const isGarage = activeTab === 'garages';
    const msg = isGarage 
      ? `คุณแน่ใจว่าต้องการลบข้อมูลอู่/ศูนย์ซ่อม "${itemName}" หรือไม่?\n(การลบข้อมูลนี้จะไม่มีผลกระทบต่อประวัติการซ่อมที่มีอยู่เดิม)`
      : `คุณแน่ใจว่าต้องการลบข้อมูลบริษัทประกันภัย "${itemName}" หรือไม่?`;
    
    const ok = await confirm(msg, 'ยืนยันการลบข้อมูล');
    if (!ok) return;

    try {
      const endpoint = isGarage ? `/garages/${id}` : `/insurance-companies/${id}`;
      await api.delete(endpoint);
      toast.success(isGarage ? 'ลบข้อมูลอู่/ศูนย์ซ่อมสำเร็จ!' : 'ลบข้อมูลบริษัทประกันสำเร็จ!');
      if (isGarage) fetchGarages();
      else fetchInsuranceCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถลบข้อมูลได้');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isGarage = activeTab === 'garages';
    const payload = isGarage ? {
      name,
      phone,
      address,
      contact_person: contactPerson,
      status
    } : {
      name,
      phone,
      address,
      contact_person: contactPerson,
      is_active: status === 'active' ? 1 : 0
    };

    const endpoint = isGarage ? '/garages' : '/insurance-companies';

    try {
      if (selectedItem) {
        await api.put(`${endpoint}/${selectedItem.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      setIsModalOpen(false);
      toast.success(selectedItem ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มข้อมูลสำเร็จ!');
      if (isGarage) fetchGarages();
      else fetchInsuranceCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: activeTab === 'garages' ? 'ชื่ออู่ / ศูนย์บริการ' : 'ชื่อบริษัทประกันภัย', 
      sortable: true 
    },
    { key: 'phone', label: 'เบอร์โทรศัพท์', sortable: true },
    { key: 'contact_person', label: 'ผู้ติดต่อ', sortable: true },
    { 
      key: 'status', 
      label: 'สถานะ', 
      sortable: true,
      render: (val) => (
        <StatusBadge 
          type="vehicle" 
          value={val} 
          label={val === 'active' ? 'เปิดใช้งาน' : 'ระงับใช้งาน'} 
        />
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h1 className="page-title">
            {activeTab === 'garages' ? 'จัดการอู่และศูนย์บริการซ่อม' : 'จัดการบริษัทประกันภัย'}
          </h1>
          <p className="page-subtitle">
            {activeTab === 'garages' 
              ? 'บันทึกรายชื่ออู่พันธมิตร ศูนย์บริการรถยนต์ หรือร้านซ่อม สำหรับใช้อ้างอิงการส่งซ่อมและบันทึกบิล' 
              : 'บันทึกรายชื่อบริษัทประกันภัยสำหรับใช้อ้างอิงการทำประกันภัยและต่ออายุรถยนต์'}
          </p>
        </div>
        {isManagerOrAdmin && (
          <NeonButton onClick={openAddModal} variant="primary" icon={<IoAdd size={18} />}>
            {activeTab === 'garages' ? 'เพิ่มอู่/ศูนย์บริการ' : 'เพิ่มบริษัทประกัน'}
          </NeonButton>
        )}
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-md)' }}>
        <button 
          onClick={() => setActiveTab('garages')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '20px',
            border: activeTab === 'garages' ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
            background: activeTab === 'garages' ? 'var(--color-primary-subtle)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'garages' ? 'var(--color-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: activeTab === 'garages' ? 700 : 500,
            transition: 'all var(--transition-fast)'
          }}
        >
          <IoBusinessOutline size={18} />
          <span>อู่ซ่อม</span>
        </button>
        <button 
          onClick={() => setActiveTab('insurance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '20px',
            border: activeTab === 'insurance' ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
            background: activeTab === 'insurance' ? 'var(--color-primary-subtle)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'insurance' ? 'var(--color-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: activeTab === 'insurance' ? 700 : 500,
            transition: 'all var(--transition-fast)'
          }}
        >
          <IoShieldCheckmarkOutline size={18} />
          <span>ประกัน</span>
        </button>
      </div>

      {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-md)' }}>{error}</div>}

      <DataTable
        columns={columns}
        data={activeTab === 'garages' ? garages : insuranceCompanies}
        loading={loading}
        searchPlaceholder={activeTab === 'garages' ? 'ค้นหาชื่ออู่, เบอร์โทร, ผู้ติดต่อ...' : 'ค้นหาบริษัทประกัน, เบอร์โทร, ผู้ติดต่อ...'}
        searchField="name"
        actions={isManagerOrAdmin ? (row) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => openEditModal(row)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', padding: '6px' }}
              title="แก้ไขข้อมูล"
            >
              <IoCreate size={16} />
            </button>
            {isAdmin && (
              <button
                onClick={() => handleDelete(row.id, row.name)}
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', padding: '6px', color: 'var(--color-danger)' }}
                title="ลบข้อมูล"
              >
                <IoTrash size={16} />
              </button>
            )}
          </div>
        ) : null}
      />

      {/* Add / Edit Garage or Insurance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedItem 
          ? (activeTab === 'garages' ? 'แก้ไขข้อมูลอู่/ศูนย์บริการ' : 'แก้ไขข้อมูลบริษัทประกัน') 
          : (activeTab === 'garages' ? 'เพิ่มอู่/ศูนย์บริการซ่อม' : 'เพิ่มบริษัทประกันภัย')}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {activeTab === 'garages' ? 'ชื่ออู่ หรือศูนย์บริการ *' : 'ชื่อบริษัทประกันภัย *'}
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder={activeTab === 'garages' ? 'เช่น ศูนย์บริการโตโยต้า พระราม 9, อู่เจริญยนต์' : 'เช่น วิริยะประกันภัย, กรุงเทพประกันภัย'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">เบอร์โทรศัพท์ติดต่อ</label>
            <input
              type="text"
              className="form-input"
              placeholder="กรอกเบอร์โทรศัพท์"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ผู้ติดต่อประสานงาน</label>
            <input
              type="text"
              className="form-input"
              placeholder={activeTab === 'garages' ? 'กรอกชื่อผู้ประสานงานของอู่' : 'กรอกชื่อตัวแทนประสานงานของบริษัทประกัน'}
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ที่อยู่ / พิกัดที่ตั้ง</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder={activeTab === 'garages' ? 'กรอกข้อมูลที่อยู่อู่ซ่อมบำรุง' : 'กรอกข้อมูลที่อยู่สำนักงานบริษัทประกัน'}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">สถานะการใช้งาน</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">เปิดใช้งาน (ใช้งานได้ปกติ)</option>
              <option value="inactive">ระงับการใช้งาน</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--space-xl)' }}>
            <NeonButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              ยกเลิก
            </NeonButton>
            <NeonButton type="submit" variant="primary">
              บันทึกข้อมูล
            </NeonButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
