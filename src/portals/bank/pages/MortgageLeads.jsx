import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const COMMISSION_COLORS = {
  paid:       'bg-emerald-100 text-emerald-700',
  processing: 'bg-amber-100 text-amber-700',
  pending:    'bg-slate-100 text-slate-600',
};

const ENQUIRY_STATUS_COLORS = {
  open:       'bg-blue-100 text-blue-700',
  closed:     'bg-slate-100 text-slate-600',
  scheduled:  'bg-violet-100 text-violet-700',
};

function fmt(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function MortgageLeads() {
  const [enquiries, setEnquiries] = useState([]);
  const [summary, setSummary]     = useState({ totalEnquiries: 0, paid: 0, processing: 0, pending: 0 });
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [total, setTotal]         = useState(0);
  const [expanded, setExpanded]   = useState(null);

  async function fetchData(p = 1) {
    setLoading(true);
    try {
      const { data } = await api.get(`/enquiry/banker-enquiries?page=${p}&limit=10`);
      setEnquiries(data.enquiries || []);
      setSummary(data.summary || { totalEnquiries: 0, paid: 0, processing: 0, pending: 0 });
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { fetchData(1); }, []);

  const kpis = [
    { label: 'Total Enquiries', value: summary.totalEnquiries, icon: 'people',       color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Bank Commission', value: summary.bankCommission || '—', icon: 'account_balance', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Commission Paid', value: summary.paid,           icon: 'check_circle',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Processing',      value: summary.processing,     icon: 'pending',       color: 'text-amber-600',   bg: 'bg-amber-50' },
    { label: 'Pending',         value: summary.pending,        icon: 'hourglass_top', color: 'text-slate-500',   bg: 'bg-slate-50' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Enquiries</h1>
        <p className="text-on-surface-variant text-sm mt-1">Buyer enquiries for your mortgage properties</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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

      {/* List */}
      {loading ? (
        <div className="card py-16 text-center text-on-surface-variant">Loading enquiries…</div>
      ) : enquiries.length === 0 ? (
        <div className="card py-20 text-center">
          <span className="material-icons-outlined text-5xl text-slate-200">inbox</span>
          <p className="text-on-surface-variant mt-3">No enquiries yet for your mortgage properties</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Buyer</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Property</th>
                  <th className="text-right px-5 py-3 hidden sm:table-cell">Booked Price</th>
                  <th className="text-center px-5 py-3">Status</th>
                  <th className="text-center px-5 py-3">Commission</th>
                  <th className="text-center px-5 py-3">Bank Comm.</th>
                  <th className="text-right px-5 py-3">Date</th>
                  <th className="text-center px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {enquiries.map(e => (
                  <>
                    <tr key={e._id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-on-surface">{e.name || e.buyerName || '—'}</p>
                        <p className="text-xs text-on-surface-variant">{e.phone || e.buyerPhone || '—'}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-on-surface-variant text-xs line-clamp-2">{e.propertyTitle || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-right hidden sm:table-cell">
                        <p className="font-bold text-on-surface">{e.bookedPrice ? fmt(e.bookedPrice) : '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ENQUIRY_STATUS_COLORS[e.status] || 'bg-slate-100 text-slate-600'}`}>
                          {e.status || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${COMMISSION_COLORS[e.commissionStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {e.commissionStatus || 'pending'}
                        </span>
                        {e.commissionDisplay && (
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{e.commissionDisplay}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <p className="font-semibold text-indigo-600 text-xs">{e.bankCommissionDisplay || '—'}</p>
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-on-surface-variant">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setExpanded(expanded === e._id ? null : e._id)}
                          className="text-xs text-primary font-semibold hover:underline">
                          {expanded === e._id ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    {expanded === e._id && (
                      <tr key={`${e._id}-detail`} className="bg-surface-container-low">
                        <td colSpan={8} className="px-5 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-on-surface-variant mb-1">Buyer Email</p>
                              <p className="font-medium text-on-surface">{e.email || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-on-surface-variant mb-1">Enquiry Date</p>
                              <p className="font-medium text-on-surface">{e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN') : '—'}</p>
                            </div>
                            {e.closedAt && (
                              <div>
                                <p className="text-xs text-on-surface-variant mb-1">Closed At</p>
                                <p className="font-medium text-on-surface">{new Date(e.closedAt).toLocaleDateString('en-IN')}</p>
                              </div>
                            )}
                            {e.bookedPrice != null && (
                              <div>
                                <p className="text-xs text-on-surface-variant mb-1">Booked At Price</p>
                                <p className="font-semibold text-emerald-700">{fmt(e.bookedPrice)}</p>
                              </div>
                            )}
                            {e.commission?.mode && (
                              <div>
                                <p className="text-xs text-on-surface-variant mb-1">Commission Mode</p>
                                <p className="font-medium text-on-surface capitalize">{e.commission.mode.replace('_', ' ')}</p>
                              </div>
                            )}
                            {e.commission?.brokerAmount != null && (
                              <div>
                                <p className="text-xs text-on-surface-variant mb-1">Broker Commission</p>
                                <p className="font-semibold text-emerald-700">{fmt(e.commission.brokerAmount)}</p>
                              </div>
                            )}
                            {e.commission?.masterBrokerAmount != null && (
                              <div>
                                <p className="text-xs text-on-surface-variant mb-1">Master Broker Commission</p>
                                <p className="font-semibold text-emerald-700">{fmt(e.commission.masterBrokerAmount)}</p>
                              </div>
                            )}
                            {e.message && (
                              <div className="col-span-2 sm:col-span-4">
                                <p className="text-xs text-on-surface-variant mb-1">Message</p>
                                <p className="text-on-surface">{e.message}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
