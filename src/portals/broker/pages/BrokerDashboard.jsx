import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import ChangePasswordModal from '../../../components/common/ChangePasswordModal';
import EmptyState from '../../../components/common/EmptyState';
import { useAuth } from '../../../context/AuthContext';
import { timeAgo } from '../../../utils/timeAgo';
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

const STATUS_LABEL = {
  new: 'New', contacted: 'Contacted', site_visit: 'Site Visit',
  negotiating: 'Negotiating', closed_won: 'Won', closed_lost: 'Lost',
};
const STATUS_ORDER = ['new', 'contacted', 'site_visit', 'negotiating', 'closed_won', 'closed_lost'];
const STATUS_COLOR = {
  new: '#6366f1', contacted: '#0ea5e9', site_visit: '#8b5cf6',
  negotiating: '#f59e0b', closed_won: '#10b981', closed_lost: '#94a3b8',
};

function formatPrice(n) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function OnboardingCard({ hasSubscription, needsPartnership, pincodeApproved, navigate }) {
  const steps = [
    { done: hasSubscription, label: 'Subscribe to a plan', hint: 'Choose Essential or Premium to unlock broker tools', icon: 'workspace_premium', action: () => navigate('/plans') },
    { done: pincodeApproved > 0, label: 'Request pincodes', hint: 'Choose the areas you want to operate in', icon: 'add_location_alt', action: () => navigate('/broker/pincode-requests') },
    { done: needsPartnership === false, label: 'Get partnership approved', hint: 'Your master broker or admin will review', icon: 'verified', action: null },
    { done: false, label: 'Create your first listing', hint: 'List a property to start receiving leads', icon: 'home', action: () => navigate('/broker/listings') },
  ];
  return (
    <div className="card p-5">
      <h2 className="font-montserrat font-semibold text-on-surface mb-4">Get started</h2>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <button key={s.label} onClick={s.action || undefined} disabled={!s.action}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
              s.done ? 'bg-emerald-50 border border-emerald-100' : 'bg-surface-container-low hover:bg-surface-container border border-outline-variant'
            } ${s.action && !s.done ? 'cursor-pointer' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              s.done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'
            }`}>
              {s.done
                ? <span className="material-icons-outlined text-lg">check</span>
                : <span className="material-icons-outlined text-lg">{s.icon}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${s.done ? 'text-emerald-700 line-through opacity-70' : 'text-on-surface'}`}>{s.label}</p>
              <p className="text-xs text-on-surface-variant">{s.hint}</p>
            </div>
            {s.action && !s.done && <span className="material-icons-outlined text-slate-400 text-lg">chevron_right</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showChangePw, setShowChangePw] = useState(false);
  const [stats, setStats]           = useState(null);
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/broker/stats').catch(() => null),
      api.get('/broker/leads?limit=100').catch(() => null),
    ]).then(([statsRes, leadsRes]) => {
      if (statsRes) setStats(statsRes.data);
      if (leadsRes) setLeads(leadsRes.data.leads || []);
    }).finally(() => setLoading(false));
  }, []);

  const listings     = stats?.listings || {};
  const pincodeReqs  = stats?.pincodeRequests || {};
  const leadsSummary = stats?.leads || {};
  const recentListings = stats?.recent || [];
  const coverage     = stats?.coverage || {};

  const dealsClosed  = leads.filter(l => l.status === 'closed_won').length;
  const conversionPct = leads.length > 0 ? Math.round((dealsClosed / leads.length) * 100) : 0;

  const metrics = [
    { label: 'Active Listings', value: listings.active ?? '—',          icon: 'home',       color: 'text-primary-container' },
    { label: 'My Leads',        value: loading ? '—' : leadsSummary.total ?? leads.length, icon: 'people',      color: 'text-blue-600' },
    { label: 'Deals Closed',    value: loading ? '—' : dealsClosed,     icon: 'handshake',   color: 'text-emerald-600' },
    { label: 'Conversion %',    value: loading ? '—' : `${conversionPct}%`, icon: 'trending_up', color: 'text-purple-600' },
    { label: 'Pincode Requests', value: loading ? '—' : (pincodeReqs.pending || 0) + (pincodeReqs.approved || 0) + (pincodeReqs.rejected || 0), icon: 'add_location_alt', color: 'text-amber-600' },
    { label: 'New Leads',       value: loading ? '—' : (leadsSummary.new ?? 0), icon: 'fiber_new',    color: 'text-indigo-600' },
  ];

  const statusChartData = STATUS_ORDER
    .map(status => ({ status, label: STATUS_LABEL[status], count: leads.filter(l => l.status === status).length }))
    .filter(d => d.count > 0);

  const showOnboarding = !loading && (listings.active === 0) && leads.length === 0;

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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map(m => (
          <StatCard key={m.label} {...m} loading={loading} />
        ))}
      </div>

      {/* Pincode request quick status */}
      {!loading && (pincodeReqs.pending > 0 || pincodeReqs.approved > 0 || pincodeReqs.rejected > 0) && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
          <span className="material-icons-outlined text-amber-600">add_location_alt</span>
          <span className="text-sm text-amber-800 flex-1">
            {pincodeReqs.pending > 0 && <span className="font-semibold">{pincodeReqs.pending} pending</span>}
            {pincodeReqs.pending > 0 && pincodeReqs.approved > 0 && ' · '}
            {pincodeReqs.approved > 0 && <span className="text-emerald-700 font-semibold">{pincodeReqs.approved} approved</span>}
            {pincodeReqs.rejected > 0 && <span className="text-red-600 font-semibold ml-1"> · {pincodeReqs.rejected} rejected</span>}
            {' '}pincode request{pincodeReqs.pending + pincodeReqs.approved + pincodeReqs.rejected !== 1 ? 's' : ''}
          </span>
          <button onClick={() => navigate('/broker/pincode-requests')}
            className="text-xs font-semibold text-amber-700 hover:underline flex-shrink-0">
            View details
          </button>
        </div>
      )}

      {/* Coverage summary */}
      {!loading && coverage.approvedPincodes?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">
              <span className="material-icons-outlined text-sm align-middle mr-1">verified</span>
              Your Approved Coverage ({coverage.count} pincodes)
            </h3>
            <button onClick={() => navigate('/broker/pincode-requests')}
              className="text-xs font-semibold text-primary-container hover:underline">Manage</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {coverage.approvedPincodes.map(p => (
              <span key={p} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">{p}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Onboarding (shown when empty) */}
        {showOnboarding && (
          <OnboardingCard
            hasSubscription={!!stats}
            needsPartnership={user?.partnershipStatus === 'approved'}
            pincodeApproved={pincodeReqs.approved || 0}
            navigate={navigate}
          />
        )}

        {/* Lead Status Breakdown */}
        <div className="card p-5">
          <h2 className="font-montserrat font-semibold text-on-surface mb-4">Lead Pipeline</h2>
          {loading ? (
            <div className="h-52 bg-slate-50 rounded-xl animate-pulse" />
          ) : statusChartData.length === 0 ? (
            <EmptyState icon="bar_chart" label="No leads yet" className="py-8" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusChartData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map(d => <Cell key={d.status} fill={STATUS_COLOR[d.status]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Leads */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-montserrat font-semibold text-on-surface">Recent Leads</h2>
            <button onClick={() => navigate('/broker/leads')} className="text-xs text-primary-container font-semibold hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : leads.length === 0 ? (
            <EmptyState icon="people_outline" label="No leads yet" hint="Leads assigned to you will appear here" className="py-8" />
          ) : (
            <div className="space-y-3">
              {leads.slice(0, 5).map(l => (
                <div key={l._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                    {l.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface text-sm truncate">{l.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{l.propertyTitle || STATUS_LABEL[l.status]}</p>
                  </div>
                  <span className="text-xs text-on-surface-variant flex-shrink-0">{timeAgo(l.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Listings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-montserrat font-semibold text-on-surface">My Listings</h2>
            <button onClick={() => navigate('/broker/listings')} className="text-xs text-primary-container font-semibold hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : recentListings.length === 0 ? (
            <EmptyState icon="home_work" label="No listings yet" hint="Properties you list will appear here" className="py-8" />
          ) : (
            <div className="space-y-3">
              {recentListings.map(l => (
                <div key={l._id} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface text-sm truncate">{l.title}</p>
                    <p className="text-xs text-on-surface-variant">{l.city} · {l.status.replace('_', ' ')}</p>
                  </div>
                  <p className="font-bold text-on-surface text-sm flex-shrink-0">{formatPrice(l.price)}</p>
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
