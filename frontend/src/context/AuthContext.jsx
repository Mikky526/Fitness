import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export const AuthContext = createContext();

const COOKIE_NAME = 'userInfo';
const COOKIE_EXPIRES = 30; // days

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookie = Cookies.get(COOKIE_NAME);
    if (cookie) {
      try {
        setUser(JSON.parse(cookie));
      } catch {
        Cookies.remove(COOKIE_NAME);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://fitness-nmmf.onrender.com/api';
      const { data } = await axios.post(`${baseUrl}/auth/login`, { email, password });
      setUser(data);
      Cookies.set(COOKIE_NAME, JSON.stringify(data), { expires: COOKIE_EXPIRES });
      return { success: true, role: data.role, firstLogin: data.firstLogin || false };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove(COOKIE_NAME);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};