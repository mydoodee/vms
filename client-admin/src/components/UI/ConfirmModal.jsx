import React from 'react';
import Modal from './Modal';
import NeonButton from './NeonButton';
import { IoWarningOutline } from 'react-icons/io5';

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
      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
        <div style={{
          background: variant === 'danger' ? 'rgba(255, 68, 68, 0.1)' : 'var(--color-primary-subtle)',
          borderRadius: '50%',
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: variant === 'danger' ? '#ff4444' : 'var(--color-primary)',
          flexShrink: 0
        }}>
          <IoWarningOutline size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
