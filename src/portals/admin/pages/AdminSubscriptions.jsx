import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { Pagination } from '../../../components/common/Pagination';

const LIMIT = 15;

const STATUS_META = {
  active:  { label: 'Active',  cls: 'bg-emerald-100 text-emerald-700' },
  created: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  failed:  { label: 'Failed',  cls: 'bg-rose-100 text-rose-700' },
};
const STATUSES = ['all', 'active', 'created', 'failed'];
const PLANS = ['all', 'essential', 'premium'];
const PLAN_LABEL = { essential: 'Essential', premium: 'Premium' };

function fmtAmt(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminSubscriptions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ activeCount: 0, activeRevenue: 0 });

  const [inputVal, setInputVal] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const fetchRows = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (planFilter !== 'all') params.set('plan', planFilter);
      const { data } = await api.get(`/subscriptions?${params}`);
      setRows(data.subscriptions || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setSummary(data.summary || { activeCount: 0, activeRevenue: 0 });
      setPage(data.page || p);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, [search, statusFilter, planFilter]);

  useEffect(() => { fetchRows(1); }, [fetchRows]);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(inputVal.trim());
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-slate-800">Transactions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Broker marketing-plan subscriptions & payments.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-2xl font-montserrat font-bold text-emerald-600">{fmtAmt(summary.activeRevenue)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active revenue (MRR)</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-2xl font-montserrat font-bold text-slate-800">{summary.activeCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active subscriptions</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-2xl font-montserrat font-bold text-slate-800">{total}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-0">
          <input value={inputVal} onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search by name, email, phone, order/payment ID…"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">Search</button>
        </form>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none capitalize">
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : STATUS_META[s]?.label || s}</option>)}
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none capitalize">
          {PLANS.map((p) => <option key={p} value={p}>{p === 'all' ? 'All plans' : PLAN_LABEL[p]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Subscriber</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment / Order ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No transactions found.</td></tr>
              ) : rows.map((r) => {
                const st = STATUS_META[r.status] || { label: r.status, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <tr key={r._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.user?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{r.user?.email || ''}{r.user?.role ? ` · ${r.user.role}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{PLAN_LABEL[r.plan] || r.plan}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{fmtAmt(r.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-slate-700">{r.razorpayPaymentId || '—'}</p>
                      <p className="text-[10px] font-mono text-slate-400">{r.razorpayOrderId || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pages}
          totalItems={total}
          itemsPerPage={LIMIT}
          onPageChange={(p) => fetchRows(p)}
        />
      )}
    </div>
  );
}
