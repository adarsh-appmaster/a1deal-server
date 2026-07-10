import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../../api/axios';
import { timeAgo } from '../../../utils/timeAgo';
import EmptyState from '../../../components/common/EmptyState';

const ACTIVITY_ICON  = { user: 'person_add', project: 'apartment', enquiry: 'contact_support' };
const ACTIVITY_COLOR = {
  user:    'text-violet-600 bg-violet-50',
  project: 'text-emerald-600 bg-emerald-50',
  enquiry: 'text-blue-600 bg-blue-50',
};

const ROLE_COLOR = {
  buyer: '#10b981', broker: '#f43f5e', developer: '#3b82f6',
  investor: '#8b5cf6', bank: '#f59e0b', admin: '#64748b', team: '#06b6d4',
};

// Merges the last few users/properties/enquiries (each already sorted by
// createdAt server-side) into one real activity feed — no dedicated
// activity-log endpoint needed for a feed this shallow.
function buildActivity([users, units, mortgages, enquiries]) {
  const items = [
    ...(users?.data.users || []).map(u => ({
      type: 'user', icon: 'person_add',
      title: `New ${u.role} registered`, subtitle: u.name || u.email, time: u.createdAt,
    })),
    ...(units?.data.properties || []).map(p => ({
      type: 'project', icon: 'apartment',
      title: 'Unit property added', subtitle: p.title, time: p.createdAt,
    })),
    ...(mortgages?.data.properties || []).map(p => ({
      type: 'project', icon: 'home_work',
      title: 'Mortgage property added', subtitle: p.title, time: p.createdAt,
    })),
    ...(enquiries?.data.enquiries || []).map(e => ({
      type: 'enquiry', icon: 'contact_support',
      title: 'New property enquiry', subtitle: e.name || e.propertyTitle || 'Guest', time: e.createdAt,
    })),
  ];
  return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]         = useState(null);
  const [propStats, setPropStats] = useState(null);
  const [activity, setActivity]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users/stats').catch(() => null),
      api.get('/unit-properties/stats').catch(() => null),
    ]).then(([u, p]) => {
      if (u) setStats(u.data);
      if (p) setPropStats(p.data);
      setLoading(false);
    });

    Promise.all([
      api.get('/users?page=1&limit=5').catch(() => null),
      api.get('/unit-properties?page=1&limit=5').catch(() => null),
      api.get('/mortgage-properties?page=1&limit=5').catch(() => null),
      api.get('/enquiry?page=1&limit=5').catch(() => null),
    ]).then(results => setActivity(buildActivity(results)))
      .finally(() => setActivityLoading(false));
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

  const roleChartData = (stats?.byRole || [])
    .filter(r => r.count > 0)
    .map(r => ({ name: r.role, value: r.count }));

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
        {/* Role Breakdown chart */}
        <div className="card p-5">
          <h2 className="font-montserrat font-semibold text-on-surface mb-4">User Role Breakdown</h2>
          {roleChartData.length === 0 ? (
            <EmptyState icon="pie_chart" label="No user data yet" className="py-8" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roleChartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {roleChartData.map(r => <Cell key={r.name} fill={ROLE_COLOR[r.name] || '#6366f1'} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name[0].toUpperCase() + name.slice(1)]} />
                <Legend
                  iconType="circle"
                  formatter={value => value[0].toUpperCase() + value.slice(1)}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h2 className="font-montserrat font-semibold text-on-surface mb-4">Recent Activity</h2>
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-container rounded-xl animate-pulse" />)}
            </div>
          ) : activity.length === 0 ? (
            <EmptyState icon="history" label="No recent activity" className="py-8" />
          ) : (
            <div className="space-y-3">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ACTIVITY_COLOR[a.type]}`}>
                    <span className="material-icons-outlined text-lg">{ACTIVITY_ICON[a.type]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface truncate">{a.title}</p>
                    <p className="text-xs text-on-surface-variant truncate">{a.subtitle}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant flex-shrink-0">{timeAgo(a.time)}</p>
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
