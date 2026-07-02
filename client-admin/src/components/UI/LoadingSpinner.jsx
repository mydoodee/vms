import React from 'react';

export default function LoadingSpinner({ size = 'medium' }) {
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '60px'
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  return (
    <div className="flex-center" style={{ flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div
        className="spinner"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '3px solid rgba(0, 178, 255, 0.1)',
          borderTop: '3px solid var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        LOADING SYSTEM...
      </span>
    </div>
  );
}
