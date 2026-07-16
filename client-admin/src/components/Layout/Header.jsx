import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { 
  LuUser, 
  LuUsers, 
  LuLogOut, 
  LuChevronDown, 
  LuShieldAlert,
  LuMoon,
  LuFolder
} from 'react-icons/lu';

export default function Header() {
  const { user, logout, updateUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

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
        return { label: 'ผู้ดูแลระบบ', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };
      case 'manager':
        return { label: 'ผู้จัดการ', color: 'var(--color-primary)', bg: 'var(--color-primary-light)', border: 'var(--color-primary-ring)' };
      default:
        return { label: 'พนักงาน', color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
    }
  };

  const roleMeta = user ? getRoleMeta(user.role) : {};

  // Simple Breadcrumbs based on path
  const getPageTitle = (path) => {
    if (path === '/') return 'แดชบอร์ดภาพรวม';
    if (path.startsWith('/vehicles')) return 'จัดการยานพาหนะ';
    if (path.startsWith('/renewals')) return 'การต่อประกันและภาษี';
    if (path.startsWith('/tickets')) return 'รายการใบแจ้งซ่อม';
    if (path.startsWith('/reports')) return 'รายงานและสถิติ';
    if (path.startsWith('/garages')) return 'ข้อมูลศูนย์บริการ';
    if (path.startsWith('/users')) return 'จัดการผู้ใช้งาน';
    if (path.startsWith('/settings')) return 'ตั้งค่าระบบ';
    return 'ระบบสารสนเทศ AMS';
  };

  return (
    <header className="header">
      {/* Breadcrumb / Page Title */}
      <div className="header-breadcrumb">
        <LuFolder size={16} className="header-breadcrumb-icon" />
        <span className="header-breadcrumb-text">ระบบจัดการ</span>
        <span className="header-breadcrumb-separator">/</span>
        <span className="header-breadcrumb-current">
          {getPageTitle(location.pathname)}
        </span>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Department Name */}
          <span className="header-dept-tag">
            {user.department || 'ทั่วไป'}
          </span>

          {/* Profile Dropdown Container */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Profile trigger */}
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="header-profile-trigger"
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                <span className="header-profile-name">
                  {user.fullname || user.username}
                </span>
                <span className="header-profile-role">
                  {roleMeta.label}
                </span>
              </div>
              
              {/* Avatar circle */}
              <div className="header-profile-avatar">
                {user.avatar_url ? (
                  <img src={getAvatarUrl(user.avatar_url)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <LuUser size={20} style={{ color: '#94a3b8' }} />
                )}
              </div>

              <LuChevronDown size={14} style={{ color: '#94a3b8', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
            </div>

            {/* Profile Dropdown */}
            {dropdownOpen && (
              <div className="header-dropdown">
                {/* Profile Card Header */}
                <div className="header-dropdown-header">
                  <div className="header-dropdown-avatar-outer">
                    <div className="header-dropdown-avatar-inner">
                      {user.avatar_url ? (
                        <img src={getAvatarUrl(user.avatar_url)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <LuUser size={24} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="header-dropdown-name">
                      {user.fullname}
                    </div>
                    <div className="header-dropdown-username">
                      @{user.username}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <label
                        htmlFor="avatar-upload-input"
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
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
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="header-dropdown-menu">

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="header-dropdown-item header-dropdown-item-danger"
                  >
                    <LuLogOut size={16} />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
