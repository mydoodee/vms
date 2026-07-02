import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './UI/LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = ['admin', 'manager'] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace state={{ error: 'บัญชีของคุณไม่มีสิทธิ์เข้าใช้งานระบบจัดการ (Admin Panel)' }} />;
  }

  return children;
}
