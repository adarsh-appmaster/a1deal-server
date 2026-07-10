import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

const STAGE_META = [
  { key: 'new',         label: 'New',         color: 'bg-blue-400' },
  { key: 'contacted',   label: 'Contacted',   color: 'bg-indigo-400' },
  { key: 'site_visit',  label: 'Site Visit',  color: 'bg-amber-400' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-orange-400' },
  { key: 'closed_won',  label: 'Closed Won',  color: 'bg-emerald-500' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'bg-slate-400' },
];
const STATUS_LABEL = {
  new: 'New', contacted: 'Contacted', site_visit: 'Site Visit',
  negotiating: 'Negotiating', closed_won: 'Closed Won', closed_lost: 'Closed Lost',
};
const CLOSED = ['closed_won', 'closed_lost'];

function fmtBudget(n) {
  if (!n) return null;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function TeamDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/leads?assignedTo=${user.id}&limit=100`)
      .then(r => setLeads(r.data.leads || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const active = leads.filter(l => !CLOSED.includes(l.status));
  const now = new Date();
  const closedWonThisMonth = leads.filter(l => {
    if (l.status !== 'closed_won') return false;
    const d = new Date(l.updatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const followUpsDue = leads.filter(l =>
    l.followUpDate && new Date(l.followUpDate) <= now && !CLOSED.includes(l.status)
  );

  const METRICS = [
    { label: 'My Leads',             value: leads.length,              icon: 'people',           color: 'text-primary-container' },
    { label: 'Active',               value: active.length,             icon: 'trending_up',      color: 'text-amber-600' },
    { label: 'Closed Won (This Mo)', value: closedWonThisMonth.length, icon: 'handshake',        color: 'text-emerald-600' },
    { label: 'Follow-ups Due',       value: followUpsDue.length,       icon: 'event_available',  color: 'text-purple-600' },
  ];

  const pipeline = STAGE_META.map(s => ({ ...s, count: leads.filter(l => l.status === s.key).length }));
  const pipelineTotal = leads.length || 1;
  const recentActive = [...active].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Sales CRM Dashboard</h1>
        <p className="text-on-surface-variant text-sm">Your pipeline for today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(m => (
          <div key={m.label} className="metric-card">
            <div className="flex items-start justify-between mb-3">
              <span className={`material-icons-outlined text-2xl ${m.color}`}>{m.icon}</span>
            </div>
            <p className="font-montserrat font-bold text-2xl text-on-surface">{loading ? '—' : m.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="card p-5">
        <h2 className="font-montserrat font-semibold text-on-surface mb-4">My Deal Pipeline</h2>
        {loading ? (
          <p className="text-sm text-on-surface-variant">Loading…</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No leads assigned to you yet.</p>
        ) : (
          <>
            <div className="flex gap-2 items-end h-24 mb-2">
              {pipeline.map(p => (
                <div key={p.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-on-surface">{p.count}</span>
                  <div className={`w-full rounded-t-lg ${p.color}`} style={{ height: `${(p.count / pipelineTotal) * 80 + 4}px` }} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {pipeline.map(p => (
                <div key={p.key} className="flex-1 text-center">
                  <p className="text-xs text-on-surface-variant">{p.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* My Leads */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat font-semibold text-on-surface">My Active Leads</h2>
          <button onClick={() => navigate('/team/leads')} className="text-xs text-primary-container font-semibold hover:underline">View All</button>
        </div>
        {loading ? (
          <p className="text-sm text-on-surface-variant">Loading…</p>
        ) : recentActive.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No active leads right now.</p>
        ) : (
          <div className="space-y-3">
            {recentActive.map(l => (
              <div key={l._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low cursor-pointer"
                onClick={() => navigate('/team/leads')}>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {l.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm">{l.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {l.propertyTitle || 'Unknown property'}{fmtBudget(l.budget) ? ` · ${fmtBudget(l.budget)}` : ''}
                  </p>
                </div>
                <p className="text-xs text-on-surface-variant flex-shrink-0">{STATUS_LABEL[l.status] || l.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
