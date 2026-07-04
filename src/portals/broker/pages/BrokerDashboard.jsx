import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../../../components/common/ChangePasswordModal';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';

function StatCard({ label, value, icon, color, loading }) {
  return (
    <div className="metric-card">
      <span className={`material-icons-outlined text-2xl ${color} mb-2 block`}>{icon}</span>
      {loading
        ? <div className="h-7 w-12 bg-slate-100 rounded animate-pulse mb-1" />
        : <p className="font-montserrat font-bold text-2xl text-on-surface">{value}</p>}
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
    </div>
  );
}

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showChangePw, setShowChangePw] = useState(false);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/broker/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: 'Active Leads',  value: stats?.activeLeads  ?? '—', icon: 'people',      color: 'text-primary-container' },
    { label: 'Deals Closed',  value: stats?.dealsClosed  ?? '—', icon: 'handshake',   color: 'text-emerald-600' },
    { label: 'Revenue (₹L)',  value: stats?.revenueLakh  ?? '—', icon: 'payments',    color: 'text-amber-600' },
    { label: 'Conversion %',  value: stats?.conversionPct?? '—', icon: 'trending_up', color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">
            Welcome, {user?.name?.split(' ')[0] || 'Broker'}
          </h1>
          <p className="text-on-surface-variant text-sm">Your deals & lead pipeline</p>
        </div>
        <button onClick={() => setShowChangePw(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex-shrink-0">
          <span className="material-icons-outlined text-base">lock_reset</span>
          Change Password
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <StatCard key={m.label} {...m} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Leads */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-montserrat font-semibold text-on-surface">Recent Leads</h2>
            <button onClick={() => navigate('/broker/leads')} className="text-xs text-primary-container font-semibold hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : !stats?.recentLeads?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="material-icons-outlined text-4xl text-slate-200 mb-2">people_outline</span>
              <p className="text-sm text-slate-400">No leads yet</p>
              <p className="text-xs text-slate-300 mt-1">Leads assigned to you will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentLeads.map((l, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                    {l.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface text-sm">{l.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{l.requirement}</p>
                  </div>
                  <span className="text-xs text-on-surface-variant">{l.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Deals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-montserrat font-semibold text-on-surface">Active Deals</h2>
            <button onClick={() => navigate('/broker/pipeline')} className="text-xs text-primary-container font-semibold hover:underline">View Pipeline</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : !stats?.activeDeals?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="material-icons-outlined text-4xl text-slate-200 mb-2">handshake</span>
              <p className="text-sm text-slate-400">No active deals</p>
              <p className="text-xs text-slate-300 mt-1">Your deal pipeline will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.activeDeals.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant">
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface text-sm">{d.property}</p>
                    <p className="text-xs text-on-surface-variant">{d.buyer} · {d.stage}</p>
                  </div>
                  <p className="font-bold text-on-surface text-sm">{d.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}
