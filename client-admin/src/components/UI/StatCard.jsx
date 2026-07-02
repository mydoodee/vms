import React from 'react';
import GlassCard from './GlassCard';

export default function StatCard({ title, value, icon, trend, color = 'primary', onClick, style }) {
  const colorMap = {
    primary: {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#10b981'
    },
    accent: {
      bg: 'rgba(59, 130, 246, 0.15)',
      text: '#3b82f6'
    },
    danger: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#ef4444'
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: '#f59e0b'
    },
    info: {
      bg: 'rgba(168, 85, 247, 0.15)',
      text: '#a855f7'
    }
  };

  const currentColors = colorMap[color] || {
    bg: 'rgba(100, 116, 139, 0.1)',
    text: '#64748b'
  };

  return (
    <GlassCard 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        padding: '16px 20px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        boxShadow: 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div 
        style={{ 
          fontSize: '1.4rem', 
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
        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {title}
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '2px 0', color: 'var(--text-primary)', lineHeight: '1.2' }}>
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
