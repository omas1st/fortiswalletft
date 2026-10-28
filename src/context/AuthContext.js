import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('fortis_user')) || null;
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readUser);
  const [token, setToken] = useState(() => localStorage.getItem('fortis_token') || null);

  const saveSession = useCallback((newToken, newUser) => {
    localStorage.setItem('fortis_token', newToken);
    localStorage.setItem('fortis_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user);
    return data.user;
  }, [saveSession]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    saveSession(data.token, data.user);
    return data.user;
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('fortis_token');
    localStorage.removeItem('fortis_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      const merged = { ...(readUser() || {}), ...(data.user || {}) };
      localStorage.setItem('fortis_user', JSON.stringify(merged));
      setUser(merged);
      return merged;
    } catch (e) {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);