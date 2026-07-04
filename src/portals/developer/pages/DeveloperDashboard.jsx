import { useNavigate } from 'react-router-dom';

const METRICS = [
  { label: 'Active Projects', value: '12', change: '+2', icon: 'apartment', color: 'text-primary-container' },
  { label: 'Total Units', value: '2,847', change: '+124', icon: 'home', color: 'text-emerald-600' },
  { label: 'Units Sold', value: '1,623', change: '+87', icon: 'sell', color: 'text-amber-600' },
  { label: 'Revenue (Cr)', value: '₹284', change: '+12%', icon: 'payments', color: 'text-purple-600' },
];

const PROJECTS = [
  { name: 'Skyline Phase 3', city: 'Mumbai', units: 240, sold: 180, progress: 75, status: 'On Track' },
  { name: 'Green Valley Ext.', city: 'Bangalore', units: 120, sold: 45, progress: 38, status: 'Delayed' },
  { name: 'Horizon Towers B', city: 'Pune', units: 300, sold: 220, progress: 90, status: 'On Track' },
  { name: 'Marina Residences', city: 'Chennai', units: 180, sold: 30, progress: 22, status: 'New' },
];

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Developer Dashboard</h1>
          <p className="text-on-surface-variant text-sm">Project & inventory overview</p>
        </div>
        <button onClick={() => navigate('/developer/projects')} className="btn-primary text-sm">
          + New Project
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map(m => (
          <div key={m.label} className="metric-card">
            <div className="flex items-start justify-between mb-3">
              <span className={`material-icons-outlined text-2xl ${m.color}`}>{m.icon}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{m.change}</span>
            </div>
            <p className="font-montserrat font-bold text-2xl text-on-surface">{m.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat font-semibold text-on-surface">Active Projects</h2>
          <button onClick={() => navigate('/developer/projects')} className="text-sm text-primary-container font-semibold hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {PROJECTS.map(p => (
            <div key={p.name} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-outlined text-primary text-xl">apartment</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-on-surface text-sm truncate">{p.name}</p>
                  <span className={`portal-badge text-xs ml-2 flex-shrink-0 ${p.status === 'On Track' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Delayed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{p.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant mb-2">
                  <span>{p.city}</span><span>·</span>
                  <span>{p.sold}/{p.units} sold</span>
                </div>
                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
              <span className="text-sm font-semibold text-on-surface-variant flex-shrink-0">{p.progress}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'View Inventory', icon: 'inventory_2', path: '/developer/inventory' },
          { label: 'Manage Projects', icon: 'apartment', path: '/developer/projects' },
          { label: 'Partnership', icon: 'handshake', path: '/developer/packages' },
          { label: 'Analytics', icon: 'analytics', path: '/developer' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} className="card p-4 text-center hover:shadow-level-2 transition-shadow">
            <span className="material-icons-outlined text-primary-container text-3xl mb-2 block">{a.icon}</span>
            <p className="text-xs font-semibold text-on-surface">{a.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
