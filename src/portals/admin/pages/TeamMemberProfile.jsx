import { useNavigate, useParams } from 'react-router-dom';

const MEMBERS = {
  1: {
    name: 'Vikram Nair', role: 'Senior Sales Executive', dept: 'Residential Sales',
    email: 'vikram.nair@a1deal.com', phone: '+91 98200 12345', location: 'Mumbai',
    joined: 'March 2022', reportingTo: 'Anita Rao', avatar: 'V',
    status: 'Active',
    metrics: { leadsAssigned: 87, dealsClosedMo: 12, conversionRate: '27.6%', revenue: '₹28.4 L', calls: 143, siteVisits: 34 },
    pipeline: [
      { stage: 'New', count: 18 },
      { stage: 'Contacted', count: 24 },
      { stage: 'Site Visit', count: 14 },
      { stage: 'Negotiation', count: 8 },
      { stage: 'Closed', count: 12 },
    ],
    recentDeals: [
      { property: 'Skyline Residences 3BHK', client: 'Rajesh Gupta', value: '₹2.4 Cr', date: '15 Jun 2026', status: 'Closed' },
      { property: 'Green Valley Villa', client: 'Sunita Rao', value: '₹3.8 Cr', date: '08 Jun 2026', status: 'Closed' },
      { property: 'Horizon Towers 2BHK', client: 'Mohan Das', value: '₹1.8 Cr', date: '25 Jun 2026', status: 'Negotiation' },
    ],
  },
};

const DEFAULT = MEMBERS[1];

export default function TeamMemberProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const m = MEMBERS[id] || DEFAULT;
  const maxPipeline = Math.max(...m.pipeline.map(p => p.count));

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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6236ff] to-[#4900e5] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
              {m.avatar}
            </div>
            <h2 className="font-montserrat font-bold text-xl text-on-surface">{m.name}</h2>
            <p className="text-sm text-on-surface-variant">{m.role}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{m.dept}</p>
            <span className="portal-badge bg-emerald-100 text-emerald-800 text-xs mt-2 inline-block">{m.status}</span>
          </div>

          <div className="space-y-3 border-t border-outline-variant pt-4">
            {[
              { icon: 'email', value: m.email },
              { icon: 'phone', value: m.phone },
              { icon: 'location_on', value: m.location },
              { icon: 'calendar_today', value: `Joined ${m.joined}` },
              { icon: 'manage_accounts', value: `Reports to ${m.reportingTo}` },
            ].map(r => (
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
            {[
              { label: 'Leads Assigned', value: m.metrics.leadsAssigned, icon: 'people', color: 'text-primary-container' },
              { label: 'Deals Closed (Mo)', value: m.metrics.dealsClosedMo, icon: 'handshake', color: 'text-emerald-600' },
              { label: 'Conversion Rate', value: m.metrics.conversionRate, icon: 'trending_up', color: 'text-amber-600' },
              { label: 'Revenue (Mo)', value: m.metrics.revenue, icon: 'payments', color: 'text-purple-600' },
              { label: 'Calls Made', value: m.metrics.calls, icon: 'call', color: 'text-blue-600' },
              { label: 'Site Visits', value: m.metrics.siteVisits, icon: 'directions_walk', color: 'text-teal-600' },
            ].map(k => (
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
            <div className="flex gap-3 items-end h-28">
              {m.pipeline.map(p => (
                <div key={p.stage} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-on-surface">{p.count}</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#4900e5] to-[#6236ff]"
                    style={{ height: `${(p.count / maxPipeline) * 80}px` }} />
                  <span className="text-xs text-on-surface-variant">{p.stage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Deals */}
          <div className="card p-5">
            <h2 className="font-montserrat font-semibold text-on-surface mb-4">Recent Deals</h2>
            <div className="space-y-3">
              {m.recentDeals.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-outlined text-primary text-base">apartment</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{d.property}</p>
                    <p className="text-xs text-on-surface-variant">{d.client} · {d.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-primary-container">{d.value}</p>
                    <span className={`portal-badge text-xs ${d.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
