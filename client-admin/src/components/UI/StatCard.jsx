import React from 'react';
import GlassCard from './GlassCard';

export default function StatCard({ title, value, icon, trend, color = 'primary', onClick, style }) {
  const colorMap = {
    primary: {
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      text: '#059669',
      borderLeft: '4px solid #10b981'
    },
    accent: {
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      text: '#2563eb',
      borderLeft: '4px solid #3b82f6'
    },
    danger: {
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      text: '#dc2626',
      borderLeft: '4px solid #ef4444'
    },
    warning: {
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      text: '#d97706',
      borderLeft: '4px solid #f59e0b'
    },
    info: {
      bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      text: '#7c3aed',
      borderLeft: '4px solid #8b5cf6'
    }
  };

  const currentColors = colorMap[color] || {
    bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    text: '#64748b',
    borderLeft: '4px solid #94a3b8'
  };

  return (
    <GlassCard 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        padding: '18px 20px',
        border: '1px solid var(--glass-border)',
        borderLeft: currentColors.borderLeft,
        background: 'var(--bg-card)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--glass-border)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      <div 
        style={{ 
          fontSize: '1.5rem', 
          color: currentColors.text, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: currentColors.bg, 
          width: '46px', 
          height: '46px', 
          borderRadius: '10px',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '2px 0', color: 'var(--text-primary)', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
          {value}
        </h2>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', marginTop: '2px' }}>
            <span style={{ color: trend.type === 'up' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
              {trend.type === 'up' ? '▲' : '▼'} {trend.value}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>จากเดือนที่แล้ว</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
