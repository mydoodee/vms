import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('vms_token');
    const savedUser = localStorage.getItem('vms_user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('vms_token');
        localStorage.removeItem('vms_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    
    if (data.success) {
      localStorage.setItem('vms_token', data.data.token);
      localStorage.setItem('vms_user', JSON.stringify(data.data.user));
      setUser(data.data.user);
      return data;
    }
    
    throw new Error(data.message);
  };

  const logout = () => {
    localStorage.removeItem('vms_token');
    localStorage.removeItem('vms_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('vms_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
