import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-600',
  no_show:   'bg-slate-100 text-slate-600',
};

export default function BankSiteVisits() {
  const [visits, setVisits]   = useState([]);
  const [summary, setSummary] = useState({ total: 0, scheduled: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loadError, setLoadError] = useState('');

  async function fetchData(p = 1) {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get(`/site-visits/banker-visits?page=${p}&limit=10`);
      setVisits(data.visits || []);
      setSummary(data.summary || { total: 0, scheduled: 0, completed: 0 });
      setPages(data.pages || 1);
      setPage(p);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Failed to load site visits.');
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(1); }, []);

  const kpis = [
    { label: 'Total Visits',   value: summary.total,     icon: 'event',         color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Scheduled',      value: summary.scheduled, icon: 'schedule',      color: 'text-violet-600',  bg: 'bg-violet-50' },
    { label: 'Completed',      value: summary.completed, icon: 'check_circle',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Site Visits</h1>
        <p className="text-on-surface-variant text-sm mt-1">Buyer visit schedules for your mortgage properties</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center mb-2`}>
              <span className={`material-icons-outlined text-lg ${k.color}`}>{k.icon}</span>
            </div>
            <p className="font-montserrat font-bold text-xl text-on-surface">{k.value}</p>
            <p className="text-xs text-on-surface-variant">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <span className="material-icons-outlined text-base flex-shrink-0">error_outline</span>
          <span className="flex-1">{loadError}</span>
          <button onClick={() => fetchData(page)} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="card py-16 text-center text-on-surface-variant">Loading site visits…</div>
      ) : visits.length === 0 ? (
        <div className="card py-20 text-center">
          <span className="material-icons-outlined text-5xl text-slate-200">event</span>
          <p className="text-on-surface-variant mt-3">No site visits scheduled yet for your properties</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Buyer</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Property</th>
                  <th className="text-center px-5 py-3">Date / Slot</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-center px-5 py-3 hidden sm:table-cell">OTP Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {visits.map(v => (
                  <tr key={v._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-on-surface">{v.name}</p>
                      <p className="text-xs text-on-surface-variant">{v.phone}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-on-surface-variant text-xs line-clamp-2">{v.propertyTitle || '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-on-surface-variant">
                      {v.date} · {v.slot}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[v.status] || 'bg-slate-100 text-slate-600'}`}>
                        {v.status?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center hidden sm:table-cell">
                      {v.otpVerified
                        ? <span className="material-icons-outlined text-emerald-600 text-lg">check_circle</span>
                        : <span className="material-icons-outlined text-slate-300 text-lg">radio_button_unchecked</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => fetchData(page - 1)} disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant disabled:opacity-40 hover:bg-surface-container-high transition">
            ← Prev
          </button>
          <span className="text-xs text-on-surface-variant">{page} / {pages}</span>
          <button onClick={() => fetchData(page + 1)} disabled={page >= pages}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant disabled:opacity-40 hover:bg-surface-container-high transition">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
