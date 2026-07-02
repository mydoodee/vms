import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  IoSpeedometerOutline, 
  IoCarOutline, 
  IoBuildOutline, 
  IoStatsChartOutline,
  IoBusinessOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';

export default function Sidebar() {
  const { user } = useAuth();

  const menuItems = [
    { path: '/', label: 'แดชบอร์ด', icon: <IoSpeedometerOutline size={20} />, roles: ['admin', 'manager'] },
    { path: '/vehicles', label: 'ยานพาหนะ', icon: <IoCarOutline size={20} />, roles: ['admin', 'manager', 'user'] },
    { path: '/renewals', label: 'ต่อประกัน/ภาษี', icon: <IoShieldCheckmarkOutline size={20} />, roles: ['admin', 'manager'] },
    { path: '/tickets', label: 'ใบแจ้งซ่อม', icon: <IoBuildOutline size={20} />, roles: ['admin', 'manager', 'user'] },
    { path: '/reports', label: 'รายงานซ่อมบำรุง', icon: <IoStatsChartOutline size={20} />, roles: ['admin', 'manager'] },
    { path: '/garages', label: 'อู่/ศูนย์บริการ', icon: <IoBusinessOutline size={20} />, roles: ['admin', 'manager', 'user'] }
  ];

  const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(user?.role));

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 'var(--sidebar-width)',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Brand logo */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 var(--space-lg)',
          borderBottom: '1px solid var(--glass-border)'
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>🚗</span>
        <span
          style={{
            fontWeight: 800,
            fontSize: '1.2rem',
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em'
          }}
        >
          SPK VMS
        </span>
      </div>

      {/* Nav Menu */}
      <nav style={{ flex: 1, padding: 'var(--space-md) 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 20px',
              margin: '2px 16px',
              borderRadius: '8px',
              color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.9rem',
              transition: 'all var(--transition-fast)'
            })}
            end={item.path === '/'}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
