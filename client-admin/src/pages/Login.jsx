import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/UI/GlassCard';
import NeonButton from '../components/UI/NeonButton';
import { LuShieldCheck, LuLock, LuUser, LuTriangleAlert } from 'react-icons/lu';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateError = location.state?.error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res && res.data && res.data.user && res.data.user.role === 'user') {
        logout();
        setError('บัญชีของคุณไม่มีสิทธิ์เข้าใช้งานระบบจัดการ (Admin Panel) กรุณาใช้งานผ่านแอปมือถือ');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        background: '#ffffff'
      }}
      className="login-container-split"
    >
      {/* Left Banner Pane */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="login-banner-pane"
      >
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <LuShieldCheck size={22} color="#818cf8" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>SPK VMS</span>
        </div>

        {/* Text Graphics Content */}
        <div style={{ maxWidth: '480px', margin: 'auto 0' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '20px', letterSpacing: '-0.03em' }}>
            ระบบจัดการยานพาหนะ และการแจ้งซ่อมบำรุง
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            ควบคุม ตรวจสอบ และบริหารจัดการกองยานพาหนะของบริษัทอย่างมีประสิทธิภาพสูงสุด ติดตามสถานะเอกสาร การแจ้งซ่อมบำรุง และสถิติต่างๆ ได้ในที่เดียว
          </p>
        </div>

        {/* Footer info */}
        <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.4)' }}>
          © SPK Construction Co., Ltd. All rights reserved.
        </div>
      </div>

      {/* Right Form Pane */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          background: 'var(--bg-primary)'
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              เข้าสู่ระบบผู้ดูแล
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
              ระบุชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าใช้งาน
            </p>
          </div>

          {(error || stateError) && (
            <div
              style={{
                background: 'var(--color-danger-light)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger)',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600
              }}
            >
              <LuTriangleAlert size={16} style={{ flexShrink: 0 }} />
              <span>{error || stateError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">ชื่อผู้ใช้งาน (USERNAME)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)',
                  display: 'flex'
                }}>
                  <LuUser size={18} />
                </span>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">รหัสผ่าน (PASSWORD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)',
                  display: 'flex'
                }}>
                  <LuLock size={18} />
                </span>
                <input
                  type="password"
                  required
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <NeonButton
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
              style={{ padding: '12px' }}
            >
              {loading ? 'กำลังยืนยันตัวตน...' : 'เข้าสู่ระบบ'}
            </NeonButton>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 868px) {
          .login-container-split {
            grid-template-columns: 1fr !important;
          }
          .login-banner-pane {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
