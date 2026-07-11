import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from '../../../components/common/Toast';

function CustomerCareCard() {
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setPhone(data.supportPhone || '');
      setSaved(data.supportPhone || '');
    }).catch(() => toast.error('Could not load customer care number.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!phone.trim()) { toast.error('Enter a phone number.'); return; }
    setSaving(true);
    try {
      const { data } = await api.patch('/settings', { supportPhone: phone.trim() });
      setSaved(data.supportPhone);
      toast.success('Customer care number updated.');
    } catch (ex) {
      toast.error(ex.response?.data?.message || 'Failed to save.');
    }
    setSaving(false);
  }

  return (
    <div className="card p-5">
      <h2 className="font-montserrat font-semibold text-on-surface mb-1 flex items-center gap-2">
        <span className="material-icons-outlined text-primary-container">call</span>Customer Care
      </h2>
      <p className="text-xs text-on-surface-variant mb-4">
        Shown to buyers in the support chat's "Talk to a human" screen.
      </p>
      {loading ? (
        <div className="h-10 bg-surface-container rounded-xl animate-pulse" />
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="tel" placeholder="e.g. +91 98765 43210"
            value={phone} onChange={e => setPhone(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            onClick={handleSave} disabled={saving || phone.trim() === saved}
            className="btn-primary text-sm py-2.5 px-4 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    twoFactorRequired: true,
    emailNotifications: true,
    autoApproveListings: false,
    maxListingsPerDev: 50,
    commissionRate: 2.0,
    platformFee: 1.5,
  });

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-montserrat font-bold text-2xl text-on-surface">System Settings</h1>

      <CustomerCareCard />

      {/* Security */}
      <div className="card p-5">
        <h2 className="font-montserrat font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-icons-outlined text-primary-container">security</span>Security
        </h2>
        <div className="space-y-4">
          {[
            { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Take the platform offline for maintenance' },
            { key: 'twoFactorRequired', label: '2FA Required', desc: 'Force all admin users to use two-factor auth' },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
              <div>
                <p className="font-medium text-on-surface text-sm">{s.label}</p>
                <p className="text-xs text-on-surface-variant">{s.desc}</p>
              </div>
              <button
                onClick={() => toggle(s.key)}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings[s.key] ? 'bg-primary-container' : 'bg-outline-variant'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings[s.key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Config */}
      <div className="card p-5">
        <h2 className="font-montserrat font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-icons-outlined text-primary-container">tune</span>Platform Config
        </h2>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send automated emails to users' },
            { key: 'autoApproveListings', label: 'Auto-Approve Listings', desc: 'Skip manual review for verified developers' },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
              <div>
                <p className="font-medium text-on-surface text-sm">{s.label}</p>
                <p className="text-xs text-on-surface-variant">{s.desc}</p>
              </div>
              <button
                onClick={() => toggle(s.key)}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings[s.key] ? 'bg-primary-container' : 'bg-outline-variant'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings[s.key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rates */}
      <div className="card p-5">
        <h2 className="font-montserrat font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-icons-outlined text-primary-container">percent</span>Fee Structure
        </h2>
        <div className="space-y-4">
          {[
            { key: 'commissionRate', label: 'Broker Commission (%)', min: 0, max: 10, step: 0.1 },
            { key: 'platformFee', label: 'Platform Fee (%)', min: 0, max: 5, step: 0.1 },
            { key: 'maxListingsPerDev', label: 'Max Listings Per Developer', min: 5, max: 500, step: 5 },
          ].map(s => (
            <div key={s.key}>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-on-surface">{s.label}</label>
                <span className="font-bold text-primary-container text-sm">{settings[s.key]}{s.key !== 'maxListingsPerDev' ? '%' : ''}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={settings[s.key]}
                onChange={e => setSettings(prev => ({ ...prev, [s.key]: parseFloat(e.target.value) }))}
                className="w-full accent-primary" />
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary">Save Settings</button>
    </div>
  );
}
