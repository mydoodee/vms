import React from 'react';

export default function LoadingSpinner({ size = 'medium' }) {
  const dotSizeMap = {
    small: '6px',
    medium: '10px',
    large: '16px'
  };

  const gapMap = {
    small: '4px',
    medium: '6px',
    large: '8px'
  };

  const dotSize = dotSizeMap[size] || dotSizeMap.medium;
  const gap = gapMap[size] || gapMap.medium;

  const dotStyle = (delay) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    animation: 'dotBounce 1.4s infinite ease-in-out both',
    animationDelay: delay
  });

  return (
    <div className="flex-center" style={{ flexDirection: 'column', gap: 'var(--space-md)', padding: '40px 0' }}>
      <div style={{ display: 'flex', gap: gap }}>
        <div style={dotStyle('-0.32s')} />
        <div style={dotStyle('-0.16s')} />
        <div style={dotStyle('0s')} />
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
        กำลังโหลด...
      </span>
    </div>
  );
}
