import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/UI/GlassCard';
import NeonButton from '../components/UI/NeonButton';

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: 'var(--space-md)'
      }}
    >
      <GlassCard
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: 'var(--space-xl)',
          boxShadow: 'var(--shadow-glow-primary)',
          border: '1px solid rgba(0, 178, 255, 0.2)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <span style={{ fontSize: '3rem' }}>🚗</span>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginTop: '10px'
            }}
          >
            SPK VEHICLE SYSTEM
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '5px', letterSpacing: '0.05em' }}>
            ENTER YOUR SECURE ACCESS CREDENTIALS
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {(error || stateError) && (
            <div
              style={{
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                color: 'var(--color-danger)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: 'var(--space-lg)',
                textAlign: 'center',
                fontWeight: 500
              }}
            >
              ⚠️ {error || stateError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">USERNAME</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="กรอกชื่อผู้ใช้งาน"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <NeonButton
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full"
            style={{ marginTop: 'var(--space-md)' }}
          >
            {loading ? 'SECURE AUTHORIZING...' : 'SECURE ACCESS'}
          </NeonButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          © 2026 Vehicle Maintenance System. All rights secured.
        </div>
      </GlassCard>
    </div>
  );
}
