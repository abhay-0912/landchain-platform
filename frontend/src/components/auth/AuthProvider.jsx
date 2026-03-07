'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getToken, setToken, removeToken, getUser, setUser } from '@/lib/auth';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getUser();
    if (stored && getToken()) {
      setUserState(stored);
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    setUserState(data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  }

  function logout() {
    removeToken();
    setUserState(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  async function refreshUser() {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setUserState(data.user);
    } catch {
      logout();
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
