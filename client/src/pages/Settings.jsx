import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../api/axios';
import { 
  Building2, 
  Clock, 
  Wifi, 
  PhoneCall, 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { settings, loading: settingsLoading, refreshSettings, setSettings } = useSettings();

  const [formData, setFormData] = useState({
    hostelName: '',
    address: '',
    gateOpeningTime: '06:00',
    gateClosingTime: '22:30',
    visitingHoursStart: '09:00',
    visitingHoursEnd: '20:00',
    silentHoursStart: '23:00',
    silentHoursEnd: '06:00',
    wifiSsid: '',
    wifiDetails: '',
    emergencyContacts: {
      ambulance: '108',
      police: '100',
      wardenPhone: '',
      nearestHospital: ''
    },
    generalRules: []
  });

  const [newRule, setNewRule] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Collapsible section state
  const [openSections, setOpenSections] = useState({
    identity: true,
    timings: true,
    wifi: true,
    emergency: true,
    rules: true
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (settings) {
      setFormData({
        hostelName: settings.hostelName || '',
        address: settings.address || '',
        gateOpeningTime: settings.gateOpeningTime || '06:00',
        gateClosingTime: settings.gateClosingTime || '22:30',
        visitingHoursStart: settings.visitingHoursStart || '09:00',
        visitingHoursEnd: settings.visitingHoursEnd || '20:00',
        silentHoursStart: settings.silentHoursStart || '23:00',
        silentHoursEnd: settings.silentHoursEnd || '06:00',
        wifiSsid: settings.wifiSsid || '',
        wifiDetails: settings.wifiDetails || '',
        emergencyContacts: {
          ambulance: settings.emergencyContacts?.ambulance || '108',
          police: settings.emergencyContacts?.police || '100',
          wardenPhone: settings.emergencyContacts?.wardenPhone || '',
          nearestHospital: settings.emergencyContacts?.nearestHospital || ''
        },
        generalRules: Array.isArray(settings.generalRules) ? [...settings.generalRules] : []
      });
    }
  }, [settings]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: {
        ...prev.emergencyContacts,
        [field]: value
      }
    }));
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    setFormData(prev => ({
      ...prev,
      generalRules: [...prev.generalRules, newRule.trim()]
    }));
    setNewRule('');
  };

  const handleRemoveRule = (index) => {
    setFormData(prev => ({
      ...prev,
      generalRules: prev.generalRules.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await api.put('/settings', formData);
      if (res.data?.success) {
        setSuccessMessage('PG Settings updated successfully!');
        if (setSettings) setSettings(res.data.data);
        if (refreshSettings) refreshSettings();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Hostel Configuration
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-500" />
            {isAdmin ? 'PG Master Settings' : 'Hostel & Facility Info'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Configure hostel identity, gate timings, silent hours, emergency directory, and house rules.'
              : 'Official hostel policies, gate timings, WiFi credentials, emergency helpline, and house rules.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshSettings}
            disabled={settingsLoading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Refresh Settings"
          >
            <RefreshCw className={`w-4 h-4 ${settingsLoading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: Hostel Identity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('identity')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">1. Hostel Identity & Address</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hostel business name and physical premises address</p>
            </div>
          </div>
          {openSections.identity ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.identity && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hostel Name *
                </label>
                {isAdmin ? (
                  <input
                    type="text"
                    required
                    value={formData.hostelName}
                    onChange={(e) => handleInputChange('hostelName', e.target.value)}
                    placeholder="e.g. Greenwood Executive PG & Student Living"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {formData.hostelName || 'Greenwood PG Living'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Premises Address
                </label>
                {isAdmin ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="e.g. 102 Cyber City Road, Tech Zone 4"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {formData.address || 'Address not configured'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Gate & Visiting Timings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('timings')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">2. Gate, Visiting & Silent Hours</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security curfew hours, visitor access slots, and study/silent window</p>
            </div>
          </div>
          {openSections.timings ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.timings && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block">Hostel Main Gate</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Opening</label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={formData.gateOpeningTime}
                      onChange={(e) => handleInputChange('gateOpeningTime', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.gateOpeningTime}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Curfew Closing</label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={formData.gateClosingTime}
                      onChange={(e) => handleInputChange('gateClosingTime', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-rose-500">{formData.gateClosingTime}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">Visiting Hours</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Start Time</label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={formData.visitingHoursStart}
                      onChange={(e) => handleInputChange('visitingHoursStart', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.visitingHoursStart}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">End Time</label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={formData.visitingHoursEnd}
                      onChange={(e) => handleInputChange('visitingHoursEnd', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.visitingHoursEnd}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-violet-500 uppercase tracking-wider block">Silent / Sleep Hours</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Starts</label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={formData.silentHoursStart}
                      onChange={(e) => handleInputChange('silentHoursStart', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.silentHoursStart}</span>
                  )}
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Ends</label>
                  {isAdmin ? (
                    <input
                      type="time"
                      value={formData.silentHoursEnd}
                      onChange={(e) => handleInputChange('silentHoursEnd', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formData.silentHoursEnd}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: WiFi & Connectivity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('wifi')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">3. Resident WiFi & Network</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">High-speed resident internet credentials and support instructions</p>
            </div>
          </div>
          {openSections.wifi ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.wifi && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WiFi Network Name (SSID)
                </label>
                {isAdmin ? (
                  <input
                    type="text"
                    value={formData.wifiSsid}
                    onChange={(e) => handleInputChange('wifiSsid', e.target.value)}
                    placeholder="e.g. Greenwood_Resident_5G"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-cyan-500 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {formData.wifiSsid || 'Network name not set'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Access Password / Login Details
                </label>
                {isAdmin ? (
                  <input
                    type="text"
                    value={formData.wifiDetails}
                    onChange={(e) => handleInputChange('wifiDetails', e.target.value)}
                    placeholder="e.g. Connect using your room# and password"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {formData.wifiDetails || 'Contact warden for password'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Emergency Contacts */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('emergency')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">4. 24x7 Emergency Help Directory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rapid response contacts for medical, police, warden, and hospital care</p>
            </div>
          </div>
          {openSections.emergency ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.emergency && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ambulance</label>
              {isAdmin ? (
                <input
                  type="text"
                  value={formData.emergencyContacts.ambulance}
                  onChange={(e) => handleEmergencyChange('ambulance', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <a href={`tel:${formData.emergencyContacts.ambulance}`} className="text-sm font-bold text-rose-500 block p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 hover:underline">
                  📞 {formData.emergencyContacts.ambulance || '108'}
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Police Control</label>
              {isAdmin ? (
                <input
                  type="text"
                  value={formData.emergencyContacts.police}
                  onChange={(e) => handleEmergencyChange('police', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <a href={`tel:${formData.emergencyContacts.police}`} className="text-sm font-bold text-indigo-500 block p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 hover:underline">
                  🚔 {formData.emergencyContacts.police || '100'}
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Warden Hotline</label>
              {isAdmin ? (
                <input
                  type="text"
                  value={formData.emergencyContacts.wardenPhone}
                  onChange={(e) => handleEmergencyChange('wardenPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <a href={`tel:${formData.emergencyContacts.wardenPhone}`} className="text-sm font-bold text-emerald-500 block p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 hover:underline">
                  👤 {formData.emergencyContacts.wardenPhone || 'Not available'}
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nearest Hospital</label>
              {isAdmin ? (
                <input
                  type="text"
                  value={formData.emergencyContacts.nearestHospital}
                  onChange={(e) => handleEmergencyChange('nearestHospital', e.target.value)}
                  placeholder="e.g. City Care Multispeciality (1.2 km)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <p className="text-sm text-slate-800 dark:text-slate-200 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  🏥 {formData.emergencyContacts.nearestHospital || 'City General Hospital'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: House Rules */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('rules')}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">5. Hostel Rules & Code of Conduct</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Binding community guidelines and disciplinary standards for all residents</p>
            </div>
          </div>
          {openSections.rules ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openSections.rules && (
          <div className="p-6 space-y-4">
            {isAdmin && (
              <form onSubmit={handleAddRule} className="flex gap-2">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Type a new rule and press 'Add Rule'..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </form>
            )}

            <div className="space-y-2">
              {formData.generalRules && formData.generalRules.length > 0 ? (
                formData.generalRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{rule}</span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                        title="Remove Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic p-3">No specific house rules added yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
