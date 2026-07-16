import React, { useState, useEffect } from 'react';
import { LuPlus, LuPen, LuTrash2, LuKey, LuCircleCheck, LuCar as IoCarSport } from 'react-icons/lu';
import api from '../services/api';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import NeonButton from '../components/UI/NeonButton';
import Modal from '../components/UI/Modal';
import { useToast } from '../contexts/ToastContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast, confirm } = useToast();
  
  // Tab state: 'active' or 'suspended'
  const [activeTab, setActiveTab] = useState('active');

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [department, setDepartment] = useState('');
  
  const [newPassword, setNewPassword] = useState('');

  // Vehicle access modal
  const [isVehicleAccessModalOpen, setIsVehicleAccessModalOpen] = useState(false);
  const [allVehicles, setAllVehicles] = useState([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [vehicleAccessLoading, setVehicleAccessLoading] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch (err) {
      setError('ไม่สามารถเรียกข้อมูลผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setSelectedUser(null);
    setUsername('');
    setPassword('');
    setFullname('');
    setEmail('');
    setPhone('');
    setRole('user');
    setDepartment('');
    setIsUserModalOpen(true);
  };

  const openEditModal = (usr) => {
    setSelectedUser(usr);
    setUsername(usr.username);
    setPassword('');
    setFullname(usr.fullname);
    setEmail(usr.email || '');
    setPhone(usr.phone || '');
    setRole(usr.role);
    setDepartment(usr.department || '');
    setIsUserModalOpen(true);
  };

  const openPasswordModal = (usr) => {
    setSelectedUser(usr);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleDelete = async (usr) => {
    const isSuspended = usr.is_active === 0;
    const confirmMessage = isSuspended
      ? `คุณแน่ใจว่าต้องการลบข้อมูลบัญชีของ "${usr.fullname}" ออกจากระบบถาวรหรือไม่?`
      : `คุณแน่ใจว่าต้องการระงับบัญชีผู้ใช้งาน "${usr.fullname}" หรือไม่? (ข้อมูลประวัติการทำงานจะยังคงอยู่)`;
    
    const confirmTitle = isSuspended ? 'ยืนยันลบถาวร' : 'ยืนยันระงับบัญชี';
    const ok = await confirm(confirmMessage, confirmTitle);
    if (!ok) return;

    try {
      const { data } = await api.delete(`/users/${usr.id}`);
      toast.success(data.message || 'ลบผู้ใช้สำเร็จ!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const handleReactivate = async (usr) => {
    const ok = await confirm(`คุณต้องการเปิดการใช้งานบัญชี "${usr.fullname}" อีกครั้งหรือไม่?`, 'ยืนยันเปิดใช้งานบัญชี');
    if (!ok) return;

    try {
      await api.put(`/users/${usr.id}`, { is_active: 1 });
      toast.success('เปิดใช้งานบัญชีผู้ใช้งานสำเร็จ!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เปิดใช้งานบัญชีไม่สำเร็จ');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username,
      fullname,
      email,
      phone,
      role,
      department
    };

    try {
      if (selectedUser) {
        await api.put(`/users/${selectedUser.id}`, payload);
      } else {
        await api.post('/users', { ...payload, password });
      }
      setIsUserModalOpen(false);
      toast.success(selectedUser ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มผู้ใช้งานสำเร็จ!');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.warning('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      await api.put(`/users/${selectedUser.id}/reset-password`, { newPassword });
      setIsPasswordModalOpen(false);
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (err) {
      toast.error(err.response?.data?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
    }
  };

  const openVehicleAccessModal = async (usr) => {
    setSelectedUser(usr);
    setVehicleAccessLoading(true);
    setVehicleSearchTerm('');
    setIsVehicleAccessModalOpen(true);
    try {
      const [vehiclesRes, accessRes] = await Promise.all([
        api.get('/vehicles'),
        api.get(`/users/${usr.id}/vehicle-access`)
      ]);
      setAllVehicles(vehiclesRes.data.data || []);
      setSelectedVehicleIds((accessRes.data.data || []).map(a => a.vehicle_id));
    } catch (err) {
      toast.error('ไม่สามารถโหลดข้อมูลรถยนต์ได้');
    } finally {
      setVehicleAccessLoading(false);
    }
  };

  const handleVehicleAccessSubmit = async () => {
    try {
      await api.put(`/users/${selectedUser.id}/vehicle-access`, { vehicleIds: selectedVehicleIds });
      toast.success('อัปเดตสิทธิ์การมองเห็นรถยนต์สำเร็จ!');
      setIsVehicleAccessModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'บันทึกสิทธิ์ไม่สำเร็จ');
    }
  };

  const toggleVehicleAccess = (vehicleId) => {
    setSelectedVehicleIds(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const selectAllVehicles = () => {
    setSelectedVehicleIds(allVehicles.map(v => v.id));
  };

  const deselectAllVehicles = () => {
    setSelectedVehicleIds([]);
  };

  const columns = [
    { key: 'username', label: 'Username (ลงชื่อเข้าใช้)', sortable: true },
    { key: 'fullname', label: 'ชื่อ-นามสกุล', sortable: true },
    { key: 'department', label: 'แผนก/ฝ่าย', sortable: true },
    { key: 'email', label: 'อีเมล', sortable: true },
    { 
      key: 'role', 
      label: 'สิทธิ์การใช้งาน', 
      sortable: true,
      render: (val) => {
        const roles = { admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการ', user: 'พนักงานทั่วไป' };
        return <StatusBadge type="role" value={val} label={roles[val]} />;
      }
    },
    {
      key: 'is_active',
      label: 'สถานะ',
      sortable: true,
      render: (val) => val === 1 ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>เปิดใช้งาน</span> : <span style={{ color: 'var(--color-danger)' }}>ระงับการใช้งาน</span>
    }
  ];

  // Filter users based on activeTab
  const filteredUsers = users.filter((u) => {
    if (activeTab === 'active') return u.is_active === 1;
    return u.is_active === 0;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">จัดการผู้ใช้งานระบบ</h1>
          <p className="page-subtitle">จัดการระดับสิทธิ์การควบคุม คัดสรรตำแหน่งจัดสรร กำหนดสิทธิ์ และรีเซ็ตรหัสผ่าน</p>
        </div>
        <NeonButton onClick={openAddModal} variant="primary" icon={<LuPlus />}>
          เพิ่มผู้ใช้งาน
        </NeonButton>
      </div>

      {error && <div className="text-danger mb-md">{error}</div>}

      {/* Segmented Tab Controls */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid var(--glass-border)',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            background: activeTab === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'active' ? 'var(--color-primary)' : 'var(--text-secondary)',
            border: activeTab === 'active' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            fontSize: '0.9rem'
          }}
        >
          บัญชีใช้งานอยู่ ({users.filter(u => u.is_active === 1).length})
        </button>
        <button
          onClick={() => setActiveTab('suspended')}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            background: activeTab === 'suspended' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            color: activeTab === 'suspended' ? 'var(--color-danger)' : 'var(--text-secondary)',
            border: activeTab === 'suspended' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            fontSize: '0.9rem'
          }}
        >
          บัญชีถูกระงับ ({users.filter(u => u.is_active === 0).length})
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredUsers} 
        searchField="fullname"
        searchPlaceholder="ค้นหาตามชื่อจริง..."
        loading={loading}
        actions={(row) => (
          <>
            <NeonButton size="sm" variant="ghost" icon={<IoCarSport />} onClick={() => openVehicleAccessModal(row)}>
              สิทธิ์รถ
            </NeonButton>
            <NeonButton size="sm" variant="ghost" icon={<LuKey />} onClick={() => openPasswordModal(row)}>
              รหัสผ่าน
            </NeonButton>
            <NeonButton size="sm" variant="ghost" icon={<LuPen />} onClick={() => openEditModal(row)} />
            {row.username !== 'admin' && (
              activeTab === 'active' ? (
                <NeonButton size="sm" variant="danger" icon={<LuTrash2 />} onClick={() => handleDelete(row)} />
              ) : (
                <>
                  <NeonButton size="sm" variant="success" icon={<LuCircleCheck />} onClick={() => handleReactivate(row)}>
                    เปิดใช้งานอีกครั้ง
                  </NeonButton>
                  <NeonButton size="sm" variant="danger" icon={<LuTrash2 />} onClick={() => handleDelete(row)} />
                </>
              )
            )}
          </>
        )}
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={selectedUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
        footer={
          <>
            <NeonButton variant="ghost" onClick={() => setIsUserModalOpen(false)}>ยกเลิก</NeonButton>
            <NeonButton variant="primary" onClick={handleUserSubmit}>บันทึก</NeonButton>
          </>
        }
      >
        <form onSubmit={handleUserSubmit} className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Username *</label>
            <input 
              type="text" 
              required 
              disabled={!!selectedUser}
              className="form-input" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>
          {!selectedUser && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password *</label>
              <input 
                type="password" 
                required 
                className="form-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ชื่อ-นามสกุล *</label>
            <input type="text" required className="form-input" value={fullname} onChange={(e) => setFullname(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">อีเมล</label>
            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">เบอร์โทรศัพท์</label>
            <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">แผนก/สังกัด</label>
            <input type="text" className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
            <label className="form-label">ระดับสิทธิ์ *</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">พนักงานทั่วไป / คนขับรถ (User)</option>
              <option value="manager">ผู้จัดการแผนก (Manager)</option>
              <option value="admin">ผู้ดูแลระบบสูงสุด (Admin)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`รีเซ็ตรหัสผ่านใหม่: ${selectedUser?.fullname}`}
        footer={
          <>
            <NeonButton variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>ยกเลิก</NeonButton>
            <NeonButton variant="primary" onClick={handlePasswordSubmit}>รีเซ็ต</NeonButton>
          </>
        }
      >
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">รหัสผ่านใหม่ *</label>
            <input 
              type="password" 
              required 
              placeholder="กรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร"
              className="form-input" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
            />
          </div>
        </form>
      </Modal>

      {/* Vehicle Access Modal */}
      <Modal
        isOpen={isVehicleAccessModalOpen}
        onClose={() => setIsVehicleAccessModalOpen(false)}
        title={`จัดการสิทธิ์การมองเห็นรถยนต์: ${selectedUser?.fullname}`}
        footer={
          <>
            <NeonButton variant="ghost" onClick={() => setIsVehicleAccessModalOpen(false)}>ยกเลิก</NeonButton>
            <NeonButton variant="primary" onClick={handleVehicleAccessSubmit}>บันทึกสิทธิ์</NeonButton>
          </>
        }
      >
        {vehicleAccessLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>กำลังโหลด...</div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.85rem' }}>
              เลือกรถยนต์ที่ผู้ใช้งานนี้สามารถมองเห็นได้ (ผู้ใช้ระดับ Admin/Manager จะมองเห็นทุกคันโดยอัตโนมัติ)
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={selectAllVehicles}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-primary)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >เลือกทั้งหมด</button>
              <button
                type="button"
                onClick={deselectAllVehicles}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--color-danger)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >ยกเลิกทั้งหมด</button>
              <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', alignSelf: 'center' }}>
                เลือกแล้ว {selectedVehicleIds.length}/{allVehicles.length} คัน
              </span>
            </div>
            <input
              type="text"
              placeholder="ค้นหาทะเบียน / ยี่ห้อ..."
              className="form-input"
              value={vehicleSearchTerm}
              onChange={(e) => setVehicleSearchTerm(e.target.value)}
              style={{ marginBottom: '12px' }}
            />
            <div style={{
              maxHeight: '320px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {allVehicles
                .filter(v => {
                  if (!vehicleSearchTerm) return true;
                  const term = vehicleSearchTerm.toLowerCase();
                  return (v.plate_number || '').toLowerCase().includes(term) ||
                    (v.brand || '').toLowerCase().includes(term) ||
                    (v.model || '').toLowerCase().includes(term);
                })
                .map(v => {
                  const isChecked = selectedVehicleIds.includes(v.id);
                  return (
                    <label
                      key={v.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : 'var(--glass-border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleVehicleAccess(v.id)}
                        style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {v.plate_number}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {v.brand} {v.model || ''} {v.assigned_driver ? `• ผู้ดูแล: ${v.assigned_driver}` : ''}
                        </div>
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100,100,100,0.15)',
                        color: isChecked ? 'var(--color-primary)' : 'var(--text-muted)'
                      }}>
                        {isChecked ? 'มองเห็น' : 'ซ่อน'}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
