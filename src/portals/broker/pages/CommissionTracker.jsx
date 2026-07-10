import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const STATUS_META = {
  paid:       { label: 'Paid',        color: 'bg-emerald-100 text-emerald-700', icon: 'check_circle'   },
  processing: { label: 'Processing',  color: 'bg-blue-100 text-blue-700',       icon: 'sync'           },
  pending:    { label: 'Pending',     color: 'bg-amber-100 text-amber-700',     icon: 'schedule'       },
};

const ROLE_META = {
  'Broker':        { color: 'bg-blue-100 text-blue-700'     },
  'Master Broker': { color: 'bg-violet-100 text-violet-700' },
};

function fmt(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function StatCard({ label, value, icon, color, bg, loading }) {
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        <span className={`material-icons-outlined text-lg ${color}`}>{icon}</span>
      </div>
      {loading
        ? <div className="h-6 w-20 bg-slate-100 rounded animate-pulse mb-1" />
        : <p className={`font-montserrat font-bold text-xl ${color}`}>{value}</p>}
      <p className="text-xs text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );
}

export default function CommissionTracker() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all'); // 'all' | 'paid' | 'processing' | 'pending'

  useEffect(() => {
    api.get('/enquiry/commissions')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const allDeals = data?.deals   || [];
  const monthly  = data?.monthly || [];
  const totals   = data?.totals  || {};

  const deals = filter === 'all' ? allDeals : allDeals.filter(d => d.status === filter);
  const maxM  = monthly.length ? Math.max(...monthly.map(m => m.amount), 1) : 1;

  const stats = [
    { label: 'YTD Earned',  value: totals.ytd        || '₹0',  color: 'text-tertiary',    bg: 'bg-tertiary/10', icon: 'trending_up'  },
    { label: 'Total Paid',  value: totals.paid        || '₹0',  color: 'text-emerald-600',  bg: 'bg-emerald-50',   icon: 'check_circle' },
    { label: 'Processing',  value: totals.processing  || '₹0',  color: 'text-blue-600',     bg: 'bg-blue-50',      icon: 'sync'         },
    { label: 'Open Leads',  value: totals.pending     || '0',   color: 'text-amber-600',    bg: 'bg-amber-50',     icon: 'schedule'     },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Commission Tracker</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Your earned commissions across all auto-routed and assigned leads
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="card p-5">
        <h2 className="font-montserrat font-semibold text-on-surface mb-5">Monthly Commission (₹ Lakhs)</h2>
        {loading ? (
          <div className="h-32 bg-slate-50 rounded-xl animate-pulse" />
        ) : monthly.every(m => m.amount === 0) ? (
          <div className="h-32 flex flex-col items-center justify-center text-center">
            <span className="material-icons-outlined text-3xl text-slate-200 mb-2">bar_chart</span>
            <p className="text-sm text-slate-400">No paid commissions yet</p>
          </div>
        ) : (
          <div className="flex items-end gap-3 h-32">
            {monthly.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                {m.amount > 0 && (
                  <span className="text-[10px] font-bold text-tertiary">{m.amount}L</span>
                )}
                <div
                  className={`w-full rounded-t-lg transition-all ${m.amount > 0 ? 'bg-tertiary' : 'bg-slate-100'}`}
                  style={{ height: `${m.amount > 0 ? Math.max(8, (m.amount / maxM) * 108) : 4}px` }}
                />
                <span className="text-xs text-on-surface-variant">{m.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deals table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-montserrat font-semibold text-on-surface">Commission Breakdown</h2>
          <div className="flex items-center gap-1.5">
            {['all', 'paid', 'processing', 'pending'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition
                  ${filter === f ? 'bg-tertiary text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {f === 'all' ? `All (${allDeals.length})` : f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : deals.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <span className="material-icons-outlined text-5xl text-slate-200 mb-3">payments</span>
            <p className="font-semibold text-on-surface mb-1">
              {filter === 'all' ? 'No commission records yet' : `No ${filter} commissions`}
            </p>
            <p className="text-sm text-on-surface-variant">
              {filter === 'all'
                ? 'Commission from auto-routed or assigned leads will appear here'
                : `Switch to "All" to see every record`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Property</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Lead</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">My Role</th>
                  <th className="text-right px-5 py-3 hidden md:table-cell">Rate</th>
                  <th className="text-right px-5 py-3">Commission</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {deals.map(d => {
                  const st   = STATUS_META[d.status] || STATUS_META.pending;
                  const role = ROLE_META[d.myRole]   || ROLE_META['Broker'];
                  const dateStr = d.date
                    ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';
                  return (
                    <tr key={d._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-5 py-4 font-semibold text-on-surface max-w-[180px] truncate">
                        {d.property}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant hidden sm:table-cell">{d.buyer}</td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${role.color}`}>
                          {d.myRole}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden md:table-cell text-slate-500 font-mono text-xs">
                        {d.percent}%
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-tertiary">{d.commission}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${st.color}`}>
                          <span className="material-icons-outlined text-xs">{st.icon}</span>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-on-surface-variant hidden lg:table-cell text-xs">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {deals.length > 0 && (
          <div className="px-5 py-3 border-t border-outline-variant bg-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
            <span>{deals.length} record{deals.length !== 1 ? 's' : ''}</span>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-tertiary font-semibold hover:underline">
                Show all
              </button>
            )}
          </div>
        )}
      </div>

      {/* How commission works info box */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <span className="material-icons-outlined text-amber-500 text-base mt-0.5">schedule</span>
            <span><strong className="text-slate-700">Pending</strong> — Lead assigned, deal not yet closed. Commission % is locked but ₹ amount isn't calculated yet.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-icons-outlined text-blue-500 text-base mt-0.5">sync</span>
            <span><strong className="text-slate-700">Processing</strong> — Deal closed and ₹ amount locked. Awaiting payout from admin.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-icons-outlined text-emerald-500 text-base mt-0.5">check_circle</span>
            <span><strong className="text-slate-700">Paid</strong> — Commission disbursed. Shows in your YTD and monthly totals.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
