import { useNavigate } from 'react-router-dom';

const METRICS = [
  { label: 'My Leads', value: '34', change: '+8', icon: 'people', color: 'text-primary-container' },
  { label: 'Meetings Today', value: '6', change: '', icon: 'event', color: 'text-amber-600' },
  { label: 'Deals Closed (Mo)', value: '12', change: '+3', icon: 'handshake', color: 'text-emerald-600' },
  { label: 'Revenue (L)', value: '₹28.4', change: '+18%', icon: 'payments', color: 'text-purple-600' },
];

const PIPELINE = [
  { stage: 'New', count: 12, color: 'bg-blue-400' },
  { stage: 'Contacted', count: 18, color: 'bg-indigo-400' },
  { stage: 'Site Visit', count: 8, color: 'bg-amber-400' },
  { stage: 'Negotiation', count: 5, color: 'bg-orange-400' },
  { stage: 'Closed', count: 3, color: 'bg-emerald-500' },
];
const total = PIPELINE.reduce((s, p) => s + p.count, 0);

const MY_LEADS = [
  { name: 'Rajesh Gupta', requirement: '3BHK, Bandra', budget: '₹2.5 Cr', stage: 'Site Visit', priority: 'High' },
  { name: 'Sunita Rao', requirement: 'Villa, Whitefield', budget: '₹4 Cr', stage: 'Negotiation', priority: 'High' },
  { name: 'Mohan Das', requirement: '2BHK, Koramangala', budget: '₹1.2 Cr', stage: 'Contacted', priority: 'Medium' },
  { name: 'Poonam Singh', requirement: 'Plot, Lonavala', budget: '₹60 L', stage: 'New', priority: 'Low' },
];

const PRIORITY_COLOR = { High: 'bg-red-100 text-red-800', Medium: 'bg-amber-100 text-amber-800', Low: 'bg-gray-100 text-gray-600' };

export default function TeamDashboard() {
  const navigate = useNavigate();
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
              {m.change && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.change.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>{m.change}</span>}
            </div>
            <p className="font-montserrat font-bold text-2xl text-on-surface">{m.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="card p-5">
        <h2 className="font-montserrat font-semibold text-on-surface mb-4">Deal Pipeline</h2>
        <div className="flex gap-2 items-end h-24 mb-2">
          {PIPELINE.map(p => (
            <div key={p.stage} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-on-surface">{p.count}</span>
              <div className={`w-full rounded-t-lg ${p.color}`} style={{ height: `${(p.count / total) * 80 + 20}px` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {PIPELINE.map(p => (
            <div key={p.stage} className="flex-1 text-center">
              <p className="text-xs text-on-surface-variant">{p.stage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Leads */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat font-semibold text-on-surface">My Active Leads</h2>
          <button onClick={() => navigate('/team/leads')} className="text-xs text-primary-container font-semibold hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          {MY_LEADS.map(l => (
            <div key={l.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">{l.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface text-sm">{l.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{l.requirement} · {l.budget}</p>
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <p className="text-xs text-on-surface-variant">{l.stage}</p>
                <span className={`portal-badge text-xs ${PRIORITY_COLOR[l.priority]}`}>{l.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
