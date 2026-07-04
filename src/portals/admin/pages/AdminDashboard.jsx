import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

const ACTIVITY_ICON  = { user: 'person_add', revenue: 'payments', project: 'apartment', alert: 'warning', security: 'security' };
const ACTIVITY_COLOR = {
  user:     'text-violet-600 bg-violet-50',
  revenue:  'text-amber-600 bg-amber-50',
  project:  'text-emerald-600 bg-emerald-50',
  alert:    'text-rose-600 bg-rose-50',
  security: 'text-blue-600 bg-blue-50',
};

const RECENT_ACTIVITY = [
  { action: 'New developer registered', user: 'Auto-approved', time: 'Latest', type: 'user' },
  { action: 'Mortgage property approved', user: 'Admin', time: 'Latest', type: 'project' },
  { action: 'Unit split configured', user: 'Admin', time: 'Latest', type: 'revenue' },
  { action: 'User suspended', user: 'Admin Team', time: 'Latest', type: 'alert' },
  { action: 'Bulk WhatsApp sent', user: 'Admin', time: 'Latest', type: 'security' },
];

function fmt(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return n?.toLocaleString('en-IN') ?? '—';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]       = useState(null);
  const [propStats, setPropStats] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/stats').catch(() => null),
      api.get('/unit-properties/stats').catch(() => null),
    ]).then(([u, p]) => {
      if (u) setStats(u.data);
      if (p) setPropStats(p.data);
      setLoading(false);
    });
  }, []);

  const totalUsers   = stats?.total ?? '—';
  const activeUsers  = stats?.active ?? '—';
  const pendingUsers = stats?.pending ?? 0;
  const brokers      = stats?.byRole?.find(r => r.role === 'broker')?.count ?? '—';
  const developers   = stats?.byRole?.find(r => r.role === 'developer')?.count ?? '—';
  const buyers       = stats?.byRole?.find(r => r.role === 'buyer')?.count ?? '—';
  const investors    = stats?.byRole?.find(r => r.role === 'investor')?.count ?? '—';

  const totalProps   = propStats?.total ?? '—';
  const availProps   = propStats?.available ?? '—';
  const soldProps    = propStats?.sold ?? '—';

  const METRICS = [
    { label: 'Total Users',       value: loading ? '…' : totalUsers,   change: pendingUsers > 0 ? `${pendingUsers} pending` : '', icon: 'people',       color: 'text-violet-600' },
    { label: 'Active Users',      value: loading ? '…' : activeUsers,  change: '',              icon: 'how_to_reg',   color: 'text-emerald-600' },
    { label: 'Unit Properties',   value: loading ? '…' : totalProps,   change: '',              icon: 'apartment',    color: 'text-blue-600' },
    { label: 'Available Units',   value: loading ? '…' : availProps,   change: '',              icon: 'domain',       color: 'text-amber-600' },
    { label: 'Developers',        value: loading ? '…' : developers,   change: '',              icon: 'business',     color: 'text-blue-600' },
    { label: 'Brokers',           value: loading ? '…' : brokers,      change: '',              icon: 'badge',        color: 'text-rose-600' },
    { label: 'Buyers',            value: loading ? '…' : buyers,       change: '',              icon: 'person',       color: 'text-teal-600' },
    { label: 'Investors',         value: loading ? '…' : investors,    change: '',              icon: 'trending_up',  color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Global Admin Dashboard</h1>
        <p className="text-on-surface-variant text-sm">Platform-wide overview — live data</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(m => (
          <div key={m.label} className="metric-card">
            <div className="flex items-start justify-between mb-3">
              <span className={`material-icons-outlined text-2xl ${m.color}`}>{m.icon}</span>
              {m.change && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-amber-700 bg-amber-50">{m.change}</span>
              )}
            </div>
            <p className="font-montserrat font-bold text-2xl text-on-surface">{m.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Role Breakdown */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-montserrat font-semibold text-on-surface mb-4">User Role Breakdown</h2>
          {stats ? (
            <div className="space-y-3">
              {(stats.byRole || []).filter(r => r.count > 0).map(r => {
                const pct = stats.total > 0 ? Math.round((r.count / stats.total) * 100) : 0;
                const colors = {
                  buyer: '#10b981', broker: '#f43f5e', developer: '#3b82f6',
                  investor: '#8b5cf6', bank: '#f59e0b', admin: '#64748b', team: '#06b6d4',
                };
                return (
                  <div key={r.role}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-on-surface-variant font-medium">{r.role}</span>
                      <span className="font-semibold text-on-surface">{r.count} <span className="text-on-surface-variant font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[r.role] || '#6366f1' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ACTIVITY_COLOR[a.type]}`}>
                    <span className="material-icons-outlined text-lg">{ACTIVITY_ICON[a.type]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-on-surface">{a.action}</p>
                    <p className="text-xs text-on-surface-variant">{a.user}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant flex-shrink-0">{a.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="font-montserrat font-semibold text-on-surface mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Manage Users',      icon: 'manage_accounts', path: '/admin/users' },
              { label: 'Revenue Analytics', icon: 'analytics',       path: '/admin/revenue' },
              { label: 'Team Directory',    icon: 'groups',           path: '/admin/team' },
              { label: 'System Settings',   icon: 'settings',         path: '/admin/settings' },
              { label: 'Pending Approvals', icon: 'pending_actions',  path: '/admin/pending', badge: pendingUsers > 0 ? pendingUsers : null },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container transition-colors text-left">
                <span className="material-icons-outlined text-primary-container text-xl">{a.icon}</span>
                <span className="text-sm font-medium text-on-surface flex-1">{a.label}</span>
                {a.badge && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{a.badge}</span>
                )}
                <span className="material-icons-outlined text-on-surface-variant text-sm">chevron_right</span>
              </button>
            ))}
          </div>

          {stats && (
            <div className="mt-4 pt-4 border-t border-outline-variant grid grid-cols-2 gap-3">
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="font-bold text-amber-700 text-xl">{pendingUsers}</p>
                <p className="text-xs text-amber-600 mt-0.5">Pending</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 text-center">
                <p className="font-bold text-rose-600 text-xl">{stats.suspended ?? 0}</p>
                <p className="text-xs text-rose-500 mt-0.5">Suspended</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
