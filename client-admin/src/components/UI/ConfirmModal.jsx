import React from 'react';
import Modal from './Modal';
import NeonButton from './NeonButton';
import { LuTriangleAlert } from 'react-icons/lu';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'ยืนยันการทำรายการ', 
  message, 
  confirmText = 'ยืนยัน', 
  cancelText = 'ยกเลิก', 
  variant = 'danger' 
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <NeonButton variant="ghost" onClick={onClose}>{cancelText}</NeonButton>
          <NeonButton variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</NeonButton>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '10px 0' }}>
        <div 
          className={variant === 'danger' ? 'confirm-icon-danger' : 'confirm-icon-primary'}
          style={{
            background: variant === 'danger' ? '#fef2f2' : 'var(--color-primary-subtle)',
            borderRadius: '50%',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: variant === 'danger' ? '#ef4444' : 'var(--color-primary)',
            flexShrink: 0,
            border: variant === 'danger' ? '1px solid #fca5a5' : '1px solid var(--color-primary-ring)',
            width: '56px',
            height: '56px'
          }}
        >
          <LuTriangleAlert size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 600, lineHeight: '1.6', margin: 0 }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
