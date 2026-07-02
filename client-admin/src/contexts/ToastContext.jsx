import React, { createContext, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { 
  IoCheckmarkCircleOutline, 
  IoCloseCircleOutline, 
  IoWarningOutline, 
  IoInformationCircleOutline, 
  IoCloseOutline 
} from 'react-icons/io5';
import NeonButton from '../components/UI/NeonButton';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    resolve: null
  });
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    resolve: null
  });

  // Toast Functionality
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const toast = useCallback((message, type) => showToast(message, type), [showToast]);
  toast.success = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  toast.error = useCallback((msg) => showToast(msg, 'error'), [showToast]);
  toast.warning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);
  toast.info = useCallback((msg) => showToast(msg, 'info'), [showToast]);

  // Alert Modal Functionality
  const showAlert = useCallback((message, title = 'แจ้งเตือนระบบ', variant = 'info') => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        variant,
        resolve
      });
    });
  }, []);

  const handleAlertClose = () => {
    if (alertState.resolve) alertState.resolve();
    setAlertState({
      isOpen: false,
      title: '',
      message: '',
      variant: 'info',
      resolve: null
    });
  };

  // Confirm Modal Functionality
  const showConfirm = useCallback((message, title = 'ยืนยันการทำรายการ', variant = 'danger') => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        variant,
        resolve
      });
    });
  }, []);

  const handleConfirmAction = (choice) => {
    if (confirmState.resolve) confirmState.resolve(choice);
    setConfirmState({
      isOpen: false,
      title: '',
      message: '',
      variant: 'danger',
      resolve: null
    });
  };

  return (
    <ToastContext.Provider value={{ toast, alert: showAlert, confirm: showConfirm }}>
      {children}

      {/* Global Toasts rendering */}
      {toasts.length > 0 && ReactDOM.createPortal(
        <div className="toast-container" style={{ zIndex: 9999 }}>
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid',
              minWidth: '320px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem' }}>
                {t.type === 'success' && <IoCheckmarkCircleOutline style={{ color: 'var(--color-success)' }} />}
                {t.type === 'error' && <IoCloseCircleOutline style={{ color: 'var(--color-danger)' }} />}
                {t.type === 'warning' && <IoWarningOutline style={{ color: 'var(--color-warning)' }} />}
                {t.type === 'info' && <IoInformationCircleOutline style={{ color: 'var(--color-info)' }} />}
              </div>
              <div style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                {t.message}
              </div>
              <button 
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  zIndex: 2
                }}
              >
                <IoCloseOutline size={18} />
              </button>
              {/* Progress visual bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                width: '100%',
                background: t.type === 'success' ? 'var(--color-success)' :
                            t.type === 'error' ? 'var(--color-danger)' :
                            t.type === 'warning' ? 'var(--color-warning)' :
                            'var(--color-info)',
                opacity: 0.6,
                animation: 'shrinkWidth 3.5s linear forwards',
                zIndex: 1
              }} />
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Global Alert Modal rendering */}
      {alertState.isOpen && ReactDOM.createPortal(
        <div className="modal-overlay" style={{ zIndex: 9997 }} onClick={handleAlertClose}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px 24px' }}>
              <div style={{
                background: alertState.variant === 'danger' ? 'rgba(255, 68, 68, 0.1)' : 
                            alertState.variant === 'warning' ? 'rgba(255, 170, 0, 0.1)' : 
                            alertState.variant === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                            'rgba(59, 130, 246, 0.1)',
                borderRadius: '50%',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: alertState.variant === 'danger' ? 'var(--color-danger)' : 
                       alertState.variant === 'warning' ? 'var(--color-warning)' : 
                       alertState.variant === 'success' ? 'var(--color-success)' :
                       'var(--color-info)',
                marginBottom: '20px'
              }}>
                {alertState.variant === 'danger' && <IoCloseCircleOutline size={48} />}
                {alertState.variant === 'warning' && <IoWarningOutline size={48} />}
                {alertState.variant === 'success' && <IoCheckmarkCircleOutline size={48} />}
                {alertState.variant === 'info' && <IoInformationCircleOutline size={48} />}
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {alertState.title}
              </h3>
              <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {alertState.message}
              </p>
              <NeonButton 
                variant={alertState.variant === 'danger' ? 'danger' : alertState.variant === 'warning' ? 'warning' : 'primary'}
                onClick={handleAlertClose}
                style={{ minWidth: '120px' }}
              >
                ตกลง
              </NeonButton>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Global Confirm Modal rendering */}
      {confirmState.isOpen && ReactDOM.createPortal(
        <div className="modal-overlay" style={{ zIndex: 9998 }} onClick={() => handleConfirmAction(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '420px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px 24px' }}>
              <div style={{
                background: confirmState.variant === 'danger' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                borderRadius: '50%',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: confirmState.variant === 'danger' ? 'var(--color-danger)' : 'var(--color-warning)',
                marginBottom: '20px'
              }}>
                <IoWarningOutline size={48} />
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {confirmState.title}
              </h3>
              <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {confirmState.message}
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
                <NeonButton 
                  variant="ghost" 
                  onClick={() => handleConfirmAction(false)}
                  style={{ flex: 1, minWidth: '100px' }}
                >
                  ยกเลิก
                </NeonButton>
                <NeonButton 
                  variant={confirmState.variant}
                  onClick={() => handleConfirmAction(true)}
                  style={{ flex: 1, minWidth: '100px' }}
                >
                  ยืนยัน
                </NeonButton>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
