import { useState, useEffect } from 'react';
import api from '../../../api/axios';

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

const SOURCES = [
  { label: 'Developer Listings', value: 42, color: '#451886' },
  { label: 'Broker Commissions', value: 28, color: '#f43f5e' },
  { label: 'Premium Packages',   value: 18, color: '#1a73e8' },
  { label: 'Mortgage Referrals', value: 12, color: '#34a853' },
];

export default function RevenueAnalytics() {
  const [userStats, setUserStats]   = useState(null);
  const [propStats, setPropStats]   = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/stats').catch(() => null),
      api.get('/unit-properties/stats').catch(() => null),
    ]).then(([u, p]) => {
      if (u) setUserStats(u.data);
      if (p) setPropStats(p.data);
      setLoading(false);
    });
  }, []);

  const totalUsers  = userStats?.total ?? 0;
  const totalProps  = propStats?.total ?? 0;
  const soldProps   = propStats?.sold ?? 0;
  const availProps  = propStats?.available ?? 0;
  const featProps   = propStats?.featured ?? 0;

  const conversionRate = totalProps > 0 ? ((soldProps / totalProps) * 100).toFixed(1) : '0.0';

  // Role breakdown for bar chart
  const roleData = (userStats?.byRole || []).filter(r => r.count > 0);
  const maxRoleCount = Math.max(...roleData.map(r => r.count), 1);

  const ROLE_COLORS = {
    buyer: '#10b981', broker: '#f43f5e', developer: '#3b82f6',
    investor: '#8b5cf6', bank: '#f59e0b', admin: '#64748b', team: '#06b6d4',
  };

  const KEY_METRICS = [
    { label: 'Total Users',       value: loading ? '…' : totalUsers,         icon: 'people',        color: 'text-violet-600' },
    { label: 'Unit Properties',   value: loading ? '…' : totalProps,          icon: 'apartment',     color: 'text-blue-600' },
    { label: 'Sold / Closed',     value: loading ? '…' : soldProps,           icon: 'handshake',     color: 'text-emerald-600' },
    { label: 'Conversion Rate',   value: loading ? '…' : `${conversionRate}%`, icon: 'percent',      color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Revenue Analytics</h1>
        <p className="text-sm text-on-surface-variant">Platform performance overview — live data</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KEY_METRICS.map(m => (
          <div key={m.label} className="metric-card">
            <span className={`material-icons-outlined text-2xl mb-2 block ${m.color}`}>{m.icon}</span>
            <p className="font-montserrat font-bold text-xl text-on-surface">{m.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User distribution bar chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-montserrat font-semibold text-on-surface mb-5">User Distribution by Role</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400">Loading…</div>
          ) : roleData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400">No data</div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {roleData.map(r => (
                <div key={r.role} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold" style={{ color: ROLE_COLORS[r.role] || '#6366f1' }}>{r.count}</span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${(r.count / maxRoleCount) * 150}px`,
                      backgroundColor: ROLE_COLORS[r.role] || '#6366f1',
                      opacity: 0.85,
                    }}
                  />
                  <span className="text-xs text-on-surface-variant capitalize">{r.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Property status + Revenue sources */}
        <div className="space-y-5">
          {/* Property Status */}
          <div className="card p-5">
            <h2 className="font-montserrat font-semibold text-on-surface mb-4">Property Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Available',   value: availProps, color: '#10b981', pct: totalProps > 0 ? (availProps/totalProps)*100 : 0 },
                { label: 'Sold / Closed', value: soldProps, color: '#6366f1', pct: totalProps > 0 ? (soldProps/totalProps)*100 : 0 },
                { label: 'Featured',    value: featProps,  color: '#f59e0b', pct: totalProps > 0 ? (featProps/totalProps)*100 : 0 },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-on-surface-variant">{s.label}</span>
                    <span className="font-semibold text-on-surface">{loading ? '…' : s.value}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Sources */}
          <div className="card p-5">
            <h2 className="font-montserrat font-semibold text-on-surface mb-4">Revenue Sources</h2>
            <div className="space-y-3">
              {SOURCES.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-on-surface-variant">{s.label}</span>
                    <span className="font-semibold text-on-surface">{s.value}%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary table */}
      {userStats && (
        <div className="card p-5">
          <h2 className="font-montserrat font-semibold text-on-surface mb-4">User Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Role', 'Count', 'Share', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {(userStats.byRole || []).map(r => (
                  <tr key={r.role} className="hover:bg-surface-container-low">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROLE_COLORS[r.role] || '#6366f1' }} />
                        <span className="capitalize font-medium text-on-surface">{r.role}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-on-surface">{r.count}</td>
                    <td className="px-4 py-2.5 text-on-surface-variant">
                      {userStats.total > 0 ? `${((r.count / userStats.total) * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {r.count > 0 ? 'Active' : 'Empty'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
