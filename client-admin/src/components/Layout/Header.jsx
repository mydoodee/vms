import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  IoPersonCircleOutline, 
  IoPeopleOutline, 
  IoLogOutOutline, 
  IoChevronDownOutline, 
  IoChevronUpOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';

export default function Header() {
  const { user, logout, updateUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef(null);

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
      }
    } catch (err) {
      alert(err.response?.data?.message || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleMeta = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'ผู้ดูแลระบบ', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)' };
      case 'manager':
        return { label: 'ผู้จัดการ', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
      default:
        return { label: 'พนักงาน', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)' };
    }
  };

  const roleMeta = user ? getRoleMeta(user.role) : {};

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: 'var(--sidebar-width)',
        height: 'var(--header-height)',
        background: 'rgba(28, 30, 34, 0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 var(--space-xl)',
        zIndex: 90
      }}
    >
      {user && (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          {/* Profile trigger */}
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '14px',
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: '14px',
              background: dropdownOpen ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: dropdownOpen ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!dropdownOpen) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }
            }}
            onMouseLeave={(e) => {
              if (!dropdownOpen) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
                {user.fullname}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {user.department || 'ไม่ระบุแผนก'}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '20px',
                    background: roleMeta.bg,
                    color: roleMeta.color,
                    border: `1px solid ${roleMeta.border}`,
                    letterSpacing: '0.03em',
                    lineHeight: '1.5'
                  }}
                >
                  {roleMeta.label}
                </span>
              </div>
            </div>
            
            {/* Avatar with gradient ring */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                padding: '2px',
                background: `linear-gradient(135deg, ${roleMeta.color}, rgba(16, 185, 129, 0.6))`,
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}
              >
                {user.avatar_url ? (
                  <img src={getAvatarUrl(user.avatar_url)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <IoPersonCircleOutline size={28} />
                )}
              </div>
            </div>

            {dropdownOpen ? (
              <IoChevronUpOutline size={14} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <IoChevronDownOutline size={14} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>

          {/* === Premium Profile Dropdown === */}
          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '300px',
                background: 'rgba(24, 26, 32, 0.97)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
                overflow: 'hidden',
                animation: 'fadeInUp 0.2s ease-out',
                zIndex: 100
              }}
            >
              {/* Profile Card Header */}
              <div
                style={{
                  padding: '20px',
                  background: `linear-gradient(135deg, rgba(${user.role === 'admin' ? '168, 85, 247' : '59, 130, 246'}, 0.08), rgba(16, 185, 129, 0.04))`,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                {/* Large Avatar */}
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    padding: '2px',
                    background: `linear-gradient(135deg, ${roleMeta.color}, #10b981)`,
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: 'var(--bg-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {user.avatar_url ? (
                      <img src={getAvatarUrl(user.avatar_url)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <IoPersonCircleOutline size={34} />
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {user.fullname}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    @{user.username}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <label
                      htmlFor="avatar-upload-input"
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.15s',
                        borderBottom: '1px dashed var(--color-primary)',
                        paddingBottom: '1px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      {uploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
                    </label>
                    <input
                      id="avatar-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <IoShieldCheckmarkOutline size={13} style={{ color: roleMeta.color }} />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: '20px',
                        background: roleMeta.bg,
                        color: roleMeta.color,
                        border: `1px solid ${roleMeta.border}`,
                        letterSpacing: '0.03em'
                      }}
                    >
                      {roleMeta.label}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <div style={{ padding: '8px' }}>
                {/* Manage Users (Admins only) */}
                {user.role === 'admin' && (
                  <Link
                    to="/users"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-primary)', flexShrink: 0
                    }}>
                      <IoPeopleOutline size={18} />
                    </div>
                    <div>
                      <div>จัดการผู้ใช้งาน</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '1px' }}>
                        เพิ่ม ลบ แก้ไขบัญชีผู้ใช้
                      </div>
                    </div>
                  </Link>
                )}

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)', margin: '4px 8px' }} />

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    color: '#ff6b6b',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 107, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: 'rgba(255, 107, 107, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IoLogOutOutline size={18} />
                  </div>
                  <div>
                    <div>ออกจากระบบ</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '1px' }}>
                      ลงชื่อออกจากบัญชี
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

