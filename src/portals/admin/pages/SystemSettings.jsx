import { useState } from 'react';

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
