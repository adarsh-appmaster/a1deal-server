import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';

const CLOSED = ['closed_won', 'closed_lost'];

const STAGE_META = [
  { key: 'new',         label: 'New' },
  { key: 'contacted',   label: 'Contacted' },
  { key: 'site_visit',  label: 'Site Visit' },
  { key: 'negotiating', label: 'Negotiation' },
  { key: 'closed_won',  label: 'Closed Won' },
  { key: 'closed_lost', label: 'Closed Lost' },
];

const STATUS_LABEL = {
  new: 'New', contacted: 'Contacted', site_visit: 'Site Visit',
  negotiating: 'Negotiation', closed_won: 'Closed', closed_lost: 'Lost',
};

function fmtBudget(n) {
  if (!n) return null;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function TeamMemberProfile() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [member, setMember]   = useState(null);
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [userRes, leadsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/leads?assignedTo=${id}&limit=100`),
      ]);
      setMember(userRes.data);
      setLeads(leadsRes.data.leads || []);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      setMember(null);
      setLeads([]);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="material-icons-outlined text-3xl animate-spin text-primary">progress_activity</span>
      </div>
    );
  }

  if (notFound || !member) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/team')} className="w-9 h-9 rounded-xl border border-outline-variant flex items-center justify-center hover:bg-surface-container">
            <span className="material-icons-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Team Member Profile</h1>
        </div>
        <div className="card p-16 text-center">
          <span className="material-icons-outlined text-5xl text-slate-200 mb-3">person_off</span>
          <p className="font-semibold text-on-surface">Team member not found</p>
          <p className="text-sm text-on-surface-variant mt-1">This member may have been removed.</p>
        </div>
      </div>
    );
  }

  // Derive KPIs from the real leads assigned to this member (same logic as TeamDashboard.jsx)
  const active = leads.filter(l => !CLOSED.includes(l.status));
  const now = new Date();
  const closedWonThisMonth = leads.filter(l => {
    if (l.status !== 'closed_won') return false;
    const d = new Date(l.updatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const closedWonAll = leads.filter(l => l.status === 'closed_won');
  const conversionRate = leads.length ? `${((closedWonAll.length / leads.length) * 100).toFixed(1)}%` : '0.0%';
  const revenueThisMonth = closedWonThisMonth.reduce((sum, l) => sum + (l.budget || 0), 0);
  const siteVisits = leads.filter(l => l.status === 'site_visit' || l.siteVisitId).length;
  const followUpsDue = leads.filter(l =>
    l.followUpDate && new Date(l.followUpDate) <= now && !CLOSED.includes(l.status)
  ).length;

  const pipeline = STAGE_META.map(s => ({ stage: s.label, count: leads.filter(l => l.status === s.key).length }));
  const maxPipeline = Math.max(1, ...pipeline.map(p => p.count));

  const recentDeals = [...leads]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  const metrics = [
    { label: 'Leads Assigned',    value: leads.length,             icon: 'people',          color: 'text-primary-container' },
    { label: 'Deals Closed (Mo)', value: closedWonThisMonth.length, icon: 'handshake',       color: 'text-emerald-600' },
    { label: 'Conversion Rate',   value: conversionRate,           icon: 'trending_up',     color: 'text-amber-600' },
    { label: 'Revenue (Mo)',      value: fmtBudget(revenueThisMonth) || '₹0',  icon: 'payments', color: 'text-purple-600' },
    { label: 'Site Visits',       value: siteVisits,               icon: 'directions_walk', color: 'text-teal-600' },
    { label: 'Follow-ups Due',    value: followUpsDue,             icon: 'event_available', color: 'text-blue-600' },
  ];

  const avatarLetter = member.name?.[0]?.toUpperCase() || '?';
  const statusLabel = member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : 'Active';
  const statusColor = member.status === 'suspended'
    ? 'bg-rose-100 text-rose-800'
    : member.status === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-emerald-100 text-emerald-800';

  const contactRows = [
    { icon: 'email', value: member.email },
    { icon: 'phone', value: member.phone || '—' },
    { icon: 'location_on', value: [member.area, member.city].filter(Boolean).join(', ') || '—' },
    { icon: 'calendar_today', value: member.createdAt ? `Joined ${new Date(member.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/team')} className="w-9 h-9 rounded-xl border border-outline-variant flex items-center justify-center hover:bg-surface-container">
          <span className="material-icons-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Team Member Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="card p-6">
          <div className="text-center mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
              {avatarLetter}
            </div>
            <h2 className="font-montserrat font-bold text-xl text-on-surface">{member.name}</h2>
            <p className="text-sm text-on-surface-variant capitalize">{member.role}</p>
            {member.company && <p className="text-xs text-on-surface-variant mt-0.5">{member.company}</p>}
            <span className={`portal-badge text-xs mt-2 inline-block ${statusColor}`}>{statusLabel}</span>
          </div>

          <div className="space-y-3 border-t border-outline-variant pt-4">
            {contactRows.map(r => (
              <div key={r.icon} className="flex items-center gap-2">
                <span className="material-icons-outlined text-on-surface-variant text-base">{r.icon}</span>
                <span className="text-sm text-on-surface">{r.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-5">
            <button className="btn-primary flex-1 text-xs py-2">Message</button>
            <button className="btn-ghost flex-1 text-xs py-2">Edit</button>
          </div>
        </div>

        {/* Right side */}
        <div className="lg:col-span-2 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {metrics.map(k => (
              <div key={k.label} className="metric-card">
                <span className={`material-icons-outlined text-xl ${k.color} mb-1 block`}>{k.icon}</span>
                <p className="font-montserrat font-bold text-lg text-on-surface">{k.value}</p>
                <p className="text-xs text-on-surface-variant">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div className="card p-5">
            <h2 className="font-montserrat font-semibold text-on-surface mb-4">Deal Pipeline</h2>
            {leads.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No leads assigned to this member yet.</p>
            ) : (
              <div className="flex gap-3 items-end h-28">
                {pipeline.map(p => (
                  <div key={p.stage} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-on-surface">{p.count}</span>
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary-container"
                      style={{ height: `${(p.count / maxPipeline) * 80}px` }} />
                    <span className="text-xs text-on-surface-variant">{p.stage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Deals */}
          <div className="card p-5">
            <h2 className="font-montserrat font-semibold text-on-surface mb-4">Recent Deals</h2>
            {recentDeals.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentDeals.map(d => (
                  <div key={d._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons-outlined text-primary text-base">apartment</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{d.propertyTitle || 'Unknown property'}</p>
                      <p className="text-xs text-on-surface-variant truncate">{d.name} · {new Date(d.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {d.budget != null && <p className="font-semibold text-sm text-primary-container">{fmtBudget(d.budget)}</p>}
                      <span className={`portal-badge text-xs ${d.status === 'closed_won' ? 'bg-emerald-100 text-emerald-800' : d.status === 'closed_lost' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>
                        {STATUS_LABEL[d.status] || d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
