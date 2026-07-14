import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import GlassCard from '../components/UI/GlassCard';
import NeonButton from '../components/UI/NeonButton';
import Users from './Users';
import { LuUser, LuUsers, LuLock, LuImage } from 'react-icons/lu';
import { getFileUrl } from '../utils/fileUrl';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'users'
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `https://app.spkconstruction.co.th/vms/${url}`;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        updateUser(data.data);
        toast.success('อัปโหลดรูปโปรไฟล์สำเร็จ!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/users/${user.id}/reset-password`, { newPassword });
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    admin: 'ผู้ดูแลระบบสูงสุด (Admin)',
    manager: 'ผู้จัดการแผนก (Manager)',
    user: 'พนักงานทั่วไป (User)'
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 className="page-title">ตั้งค่าระบบ</h1>
        <p className="page-subtitle">จัดการข้อมูลส่วนตัว ความปลอดภัย และสิทธิ์การใช้งานบัญชี</p>
      </div>

      {/* Horizontal Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '6px',
        background: 'rgba(37, 99, 235, 0.04)',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid var(--glass-border)',
        width: 'fit-content',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'profile' 
              ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)' 
              : 'transparent',
            color: activeTab === 'profile' ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            fontSize: '0.88rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'profile' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
          }}
        >
          <LuUser size={17} />
          <span>ข้อมูลส่วนตัว</span>
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'users' 
                ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)' 
                : 'transparent',
              color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'users' ? 700 : 500,
              fontSize: '0.88rem',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'users' ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
            }}
          >
            <LuUsers size={17} />
            <span>จัดการผู้ใช้งาน</span>
          </button>
        )}
      </div>

      {/* Active Content Area (Full Width) */}
      <div style={{ width: '100%' }}>

          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Profile details */}
              <GlassCard style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: '#fff',
                      overflow: 'hidden',
                      border: '3px solid #fff',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      {user?.avatar_url ? (
                        <img 
                          src={getAvatarUrl(user.avatar_url)} 
                          alt="avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        user?.full_name?.charAt(0) || user?.username?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    <label 
                      style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '-6px',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        border: '2px solid #fff'
                      }}
                      title="เปลี่ยนรูปโปรไฟล์"
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        style={{ display: 'none' }} 
                        disabled={uploading}
                      />
                      <LuImage size={14} />
                    </label>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user?.full_name || user?.username}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
                      สังกัด: {user?.department || 'ไม่ระบุสังกัด/แผนก'}
                    </p>
                    <div style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}>
                      {roleLabels[user?.role]}
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '24px 0' }} />

                <div className="grid grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ชื่อลงทะเบียน (Username)</label>
                    <input type="text" className="form-input" value={user?.username} disabled />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ชื่อ-นามสกุล</label>
                    <input type="text" className="form-input" value={user?.full_name || ''} disabled />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">เบอร์โทรศัพท์</label>
                    <input type="text" className="form-input" value={user?.phone || 'ไม่ระบุ'} disabled />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">อีเมล</label>
                    <input type="text" className="form-input" value={user?.email || 'ไม่ระบุ'} disabled />
                  </div>
                </div>
              </GlassCard>

              {/* Password change */}
              <GlassCard style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <LuLock size={18} style={{ color: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>เปลี่ยนรหัสผ่านความปลอดภัย</span>
                </div>

                <form onSubmit={handlePasswordSubmit} className="grid grid-2" style={{ gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                    <label className="form-label">รหัสผ่านใหม่ *</label>
                    <input 
                      type="password" 
                      required 
                      className="form-input" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                    <label className="form-label">ยืนยันรหัสผ่านใหม่ *</label>
                    <input 
                      type="password" 
                      required 
                      className="form-input" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <NeonButton type="submit" variant="primary" disabled={loading}>
                      {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                    </NeonButton>
                  </div>
                </form>
              </GlassCard>
            </div>
          )}

          {activeTab === 'users' && user?.role === 'admin' && (
            <Users />
          )}
        </div>
    </div>
  );
}
