import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const PROJECT = {
  id: 1,
  name: 'Skyline Phase 3',
  city: 'Mumbai',
  type: 'Residential',
  rera: 'P51900027780',
  status: 'On Track',
  progress: 75,
  launch: 'Jan 2024',
  completion: 'Dec 2025',
  totalUnits: 240,
  sold: 180,
  available: 42,
  blocked: 18,
  revenue: '₹432 Cr',
  collected: '₹312 Cr',
  pending: '₹120 Cr',
  manager: 'Vikram Nair',
  managerPhone: '+91 98200 12345',
};

const UNITS = [
  { id: 'A-101', type: '2BHK', floor: 1, area: '1050 sqft', price: '₹1.8 Cr', status: 'Sold', buyer: 'Anita Rao' },
  { id: 'A-201', type: '3BHK', floor: 2, area: '1450 sqft', price: '₹2.4 Cr', status: 'Available', buyer: null },
  { id: 'A-301', type: '3BHK', floor: 3, area: '1450 sqft', price: '₹2.5 Cr', status: 'Blocked', buyer: 'Pending KYC' },
  { id: 'A-401', type: '2BHK', floor: 4, area: '1050 sqft', price: '₹1.9 Cr', status: 'Sold', buyer: 'Raj Kumar' },
  { id: 'B-101', type: '4BHK', floor: 1, area: '2200 sqft', price: '₹3.8 Cr', status: 'Available', buyer: null },
  { id: 'B-201', type: '4BHK', floor: 2, area: '2200 sqft', price: '₹3.9 Cr', status: 'Sold', buyer: 'Meera Singh' },
];

const STATUS_COLOR = {
  Sold: 'bg-emerald-100 text-emerald-800',
  Available: 'bg-blue-100 text-blue-800',
  Blocked: 'bg-amber-100 text-amber-800',
};

const TABS = ['Overview', 'Units', 'Timeline', 'Team'];

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tab, setTab] = useState('Overview');
  const [unitFilter, setUnitFilter] = useState('all');

  const filtered = unitFilter === 'all' ? UNITS : UNITS.filter(u => u.status.toLowerCase() === unitFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/developer/projects')} className="w-9 h-9 rounded-xl border border-outline-variant flex items-center justify-center hover:bg-surface-container">
          <span className="material-icons-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">{PROJECT.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-on-surface-variant">{PROJECT.city} · {PROJECT.type}</span>
            <span className="text-xs text-on-surface-variant">RERA: {PROJECT.rera}</span>
            <span className={`portal-badge text-xs ${PROJECT.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{PROJECT.status}</span>
          </div>
        </div>
        <button onClick={() => navigate('/developer/projects/new')} className="btn-primary text-sm">+ Add Units</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === t ? 'text-primary-container border-primary-container' : 'text-on-surface-variant border-transparent hover:text-on-surface'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'Overview' && (
        <div className="space-y-5">
          {/* Progress */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-montserrat font-semibold text-on-surface">Construction Progress</h2>
              <span className="text-2xl font-bold text-primary-container">{PROJECT.progress}%</span>
            </div>
            <div className="h-3 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full" style={{ width: `${PROJECT.progress}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-on-surface-variant">
              <span>Launch: {PROJECT.launch}</span>
              <span>Expected: {PROJECT.completion}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Units', value: PROJECT.totalUnits, icon: 'home', color: 'text-primary-container' },
              { label: 'Units Sold', value: PROJECT.sold, icon: 'sell', color: 'text-emerald-600' },
              { label: 'Available', value: PROJECT.available, icon: 'door_open', color: 'text-blue-600' },
              { label: 'Blocked', value: PROJECT.blocked, icon: 'pending', color: 'text-amber-600' },
            ].map(m => (
              <div key={m.label} className="metric-card">
                <span className={`material-icons-outlined text-2xl ${m.color} mb-2 block`}>{m.icon}</span>
                <p className="font-montserrat font-bold text-2xl text-on-surface">{m.value}</p>
                <p className="text-xs text-on-surface-variant mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Revenue', value: PROJECT.revenue, icon: 'payments', color: 'text-purple-600' },
              { label: 'Amount Collected', value: PROJECT.collected, icon: 'account_balance_wallet', color: 'text-emerald-600' },
              { label: 'Pending Collection', value: PROJECT.pending, icon: 'schedule', color: 'text-amber-600' },
            ].map(m => (
              <div key={m.label} className="metric-card">
                <span className={`material-icons-outlined text-xl ${m.color} mb-1 block`}>{m.icon}</span>
                <p className="font-montserrat font-bold text-xl text-on-surface">{m.value}</p>
                <p className="text-xs text-on-surface-variant">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Units tab */}
      {tab === 'Units' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'available', 'sold', 'blocked'].map(f => (
              <button key={f} onClick={() => setUnitFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors ${unitFilter === f ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Unit', 'Type', 'Floor', 'Area', 'Price', 'Status', 'Buyer'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-on-surface">{u.id}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.type}</td>
                    <td className="px-4 py-3 text-on-surface-variant">Floor {u.floor}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.area}</td>
                    <td className="px-4 py-3 font-semibold text-primary-container">{u.price}</td>
                    <td className="px-4 py-3"><span className={`portal-badge text-xs ${STATUS_COLOR[u.status]}`}>{u.status}</span></td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.buyer || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline tab */}
      {tab === 'Timeline' && (
        <div className="card p-6">
          <div className="space-y-6">
            {[
              { phase: 'Project Launch & Booking', date: 'Jan 2024', done: true, note: 'RERA registration completed, bookings opened' },
              { phase: 'Foundation & Podium', date: 'Apr 2024', done: true, note: 'RCC work completed up to 3rd floor' },
              { phase: 'Structure (Floors 4–15)', date: 'Oct 2024', done: true, note: 'On schedule, 75% complete' },
              { phase: 'Structure (Floors 16–25)', date: 'Mar 2025', done: false, note: 'In progress' },
              { phase: 'Fit-out & Finishing', date: 'Aug 2025', done: false, note: 'Pending' },
              { phase: 'Handover & Possession', date: 'Dec 2025', done: false, note: 'Target date' },
            ].map((p, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${p.done ? 'bg-emerald-500' : 'bg-surface-container border-2 border-outline-variant'}`}>
                    {p.done ? <span className="material-icons-outlined text-white text-base">check</span> : <span className="text-xs font-bold text-on-surface-variant">{i + 1}</span>}
                  </div>
                  {i < 5 && <div className={`w-0.5 h-8 mt-1 ${p.done ? 'bg-emerald-500' : 'bg-outline-variant'}`} />}
                </div>
                <div className="pb-2">
                  <p className={`font-semibold text-sm ${p.done ? 'text-on-surface' : 'text-on-surface-variant'}`}>{p.phase}</p>
                  <p className="text-xs text-on-surface-variant">{p.date} · {p.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team tab */}
      {tab === 'Team' && (
        <div className="card p-5">
          <h2 className="font-montserrat font-semibold text-on-surface mb-4">Project Team</h2>
          <div className="space-y-3">
            {[
              { name: PROJECT.manager, role: 'Project Manager', phone: PROJECT.managerPhone, avatar: 'V' },
              { name: 'Anand Joshi', role: 'Site Engineer', phone: '+91 98200 54321', avatar: 'A' },
              { name: 'Priya Mehta', role: 'Sales Head', phone: '+91 98200 67890', avatar: 'P' },
              { name: 'Suresh Pillai', role: 'Architect', phone: '+91 98200 11122', avatar: 'S' },
            ].map(m => (
              <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">{m.avatar}</div>
                <div className="flex-1">
                  <p className="font-semibold text-on-surface text-sm">{m.name}</p>
                  <p className="text-xs text-on-surface-variant">{m.role}</p>
                </div>
                <span className="text-xs text-on-surface-variant">{m.phone}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
