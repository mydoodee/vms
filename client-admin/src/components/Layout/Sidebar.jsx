import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LuLayoutDashboard, 
  LuCar, 
  LuWrench, 
  LuTrendingUp,
  LuBuilding2,
  LuShieldCheck,
  LuSettings,
  LuLogOut,
  LuChevronLeft,
  LuChevronRight
} from 'react-icons/lu';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { user } = useAuth();

  const menuItems = [
    { path: '/', label: 'แดชบอร์ด', icon: <LuLayoutDashboard size={19} />, roles: ['admin', 'manager'] },
    { path: '/vehicles', label: 'ยานพาหนะ', icon: <LuCar size={19} />, roles: ['admin', 'manager', 'user'] },
    { path: '/renewals', label: 'ต่อประกัน/ภาษี', icon: <LuShieldCheck size={19} />, roles: ['admin', 'manager'] },
    { path: '/tickets', label: 'ใบแจ้งซ่อม', icon: <LuWrench size={19} />, roles: ['admin', 'manager', 'user'] },
    { path: '/reports', label: 'รายงานย้อนหลัง', icon: <LuTrendingUp size={19} />, roles: ['admin', 'manager'] },
    { path: '/garages', label: 'ผู้/ศูนย์บริการ', icon: <LuBuilding2 size={19} />, roles: ['admin', 'manager', 'user'] }
  ];

  const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle Button */}
      <button 
        type="button" 
        className="sidebar-toggle" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "ขยายแถบเมนู" : "ยุบแถบเมนู"}
      >
        {isCollapsed ? <LuChevronRight size={14} /> : <LuChevronLeft size={14} />}
      </button>

      {/* Brand logo */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <LuCar size={19} color="#ffffff" />
        </div>
        <div className="sidebar-title-container">
          <div className="sidebar-title">SPK VMS</div>
          <div className="sidebar-subtitle">Vehicle System</div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">เมนูหลัก</div>
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            end={item.path === '/'}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          title={isCollapsed ? "ตั้งค่า" : undefined}
        >
          <LuSettings size={19} />
          <span>ตั้งค่า</span>
        </NavLink>
      </div>

      {/* User mini profile */}
      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" title={isCollapsed ? (user.full_name || user.username) : undefined}>
            {user.full_name?.charAt(0) || user.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user.full_name || user.username}
            </div>
            <div className="sidebar-user-role">
              {user.role === 'admin' ? 'ผู้ดูแลระบบ' : user.role === 'manager' ? 'ผู้จัดการ' : 'พนักงาน'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
