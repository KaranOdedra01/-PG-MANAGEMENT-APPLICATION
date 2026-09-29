import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data?.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      // Quiet fail if backend settings not accessible yet
      console.warn('Could not load PG settings:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: null,
      loading: false,
      refreshSettings: () => {},
      setSettings: () => {}
    };
  }
  return context;
};

export default SettingsContext;
