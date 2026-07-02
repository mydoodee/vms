import React from 'react';

export default function GlassCard({ children, className = '', style = {}, onClick }) {
  return (
    <div
      className={`glass-card ${className}`}
      style={{
        padding: 'var(--space-lg)',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
