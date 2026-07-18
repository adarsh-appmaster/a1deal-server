import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';

const BADGE = {
  pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', cls: 'bg-rose-100 text-rose-600' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminBrokerPincodeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [sel, setSel]           = useState(null);

  // Modal state
  const [modalAreas, setModalAreas] = useState([]);
  const [addPin, setAddPin]         = useState('');
  const [addCity, setAddCity]       = useState('');
  const [note, setNote]             = useState('');
  const [working, setWorking]       = useState(false);
  const [msg, setMsg]               = useState({ text: '', ok: true });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/master-broker/pincode-requests', { params });
      setRequests(data.requests || []);
    } catch { /* empty */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function open(r) {
    setSel(r);
    setModalAreas((r.requestedAreas || []).map(a => ({ city: a.city || '', area: a.area || '', pincode: a.pincode || '' })));
    setAddPin(''); setAddCity(''); setNote('');
    setMsg({ text: '', ok: true });
  }

  function addPincode() {
    const p = addPin.trim();
    if (!/^\d{6}$/.test(p)) return;
    setModalAreas(prev => [...prev, { city: addCity.trim(), area: '', pincode: p }]);
    setAddPin('');
  }

  async function decide(decision) {
    setWorking(true); setMsg({ text: '', ok: true });
    try {
      const body = { decision, adminNote: note };
      if (decision === 'approved' && modalAreas.length) body.areas = modalAreas;
      const { data } = await api.patch(`/master-broker/pincode-requests/${sel._id}/decide`, body);
      setMsg({ text: `Request ${decision}.`, ok: true });
      setRequests(prev => prev.map(r => r._id === data.request._id ? data.request : r));
      setSel(data.request);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed.', ok: false });
    }
    setWorking(false);
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const INP = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="flex items-center gap-3">
        <span className="material-icons-outlined text-3xl text-primary">pin_drop</span>
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Broker Pincode Requests</h1>
          <p className="text-on-surface-variant text-sm">Review, approve with area override, or reject pincode requests from standard brokers</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: requests.length, icon: 'list', color: 'text-slate-600' },
          { label: 'Pending', value: pendingCount, icon: 'hourglass_top', color: 'text-amber-600' },
          { label: 'Approved', value: approvedCount, icon: 'check_circle', color: 'text-emerald-600' },
          { label: 'Rejected', value: rejectedCount, icon: 'cancel', color: 'text-rose-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
            <span className={`material-icons-outlined ${c.color}`}>{c.icon}</span>
            <div>
              <p className="font-bold text-lg text-on-surface">{c.value}</p>
              <p className="text-xs text-on-surface-variant">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition capitalize ${
              filter === f ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Request list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="material-icons-outlined text-3xl animate-spin text-primary">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">pin_drop</span>
          <p className="text-slate-400 mt-3 text-sm">No {filter !== 'all' ? filter : ''} pincode requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const badge = BADGE[r.status] || BADGE.pending;
            return (
              <div key={r._id} className={`bg-white rounded-2xl border p-5 space-y-3 transition hover:shadow-sm ${
                r.status === 'pending' ? 'border-amber-200' : 'border-slate-100'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                      <span className="text-xs text-slate-400">{fmtDate(r.createdAt)}</span>
                      {r.requestedByMaster && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">MASTER DISTRIBUTED</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-800">{r.broker?.name}</p>
                    <p className="text-xs text-slate-400">{r.broker?.email} · {r.broker?.city} {r.broker?.pincode}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400 flex-shrink-0">
                    <p>Extra areas: <span className="font-semibold text-slate-700">{r.broker?.additionalAreas?.length || 0}</span></p>
                    <p>Requesting: <span className="font-semibold text-primary">+{r.requestedAreas?.length || 0}</span></p>
                  </div>
                </div>

                {/* Requested areas */}
                <div className="flex flex-wrap gap-1.5">
                  {(r.requestedAreas || []).map((a, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                    </span>
                  ))}
                </div>

                {r.reason && (
                  <p className="text-sm text-slate-600 italic bg-slate-50 rounded-xl px-3 py-2">"{r.reason}"</p>
                )}

                {r.adminNote && (
                  <p className={`text-xs rounded-xl px-3 py-2 ${
                    r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>Admin: {r.adminNote}</p>
                )}

                {r.status === 'pending' ? (
                  <button onClick={() => open(r)}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">
                    Review & Decide
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">Decided {fmtDate(r.decidedAt)} by {r.decidedBy?.name || 'Admin'}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Review Modal ──────────────────────────────────────────────────── */}
      {sel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSel(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-montserrat font-bold text-lg text-slate-800">Review Pincode Request</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[sel.status]?.cls || ''}`}>
                    {sel.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSel(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {/* Broker info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">{sel.broker?.name}</p>
                  {sel.requestedByMaster && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 whitespace-nowrap">
                      MASTER DISTRIBUTION
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{sel.broker?.email} · {sel.broker?.city} {sel.broker?.pincode}</p>
                <div className="flex gap-4 pt-1 text-xs">
                  <div><span className="text-slate-400">Current extra areas:</span> <span className="font-bold text-slate-700">{sel.broker?.additionalAreas?.length || 0}</span></div>
                </div>
              </div>

              {sel.reason && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Reason from Broker</p>
                  <p className="text-sm text-slate-600 italic bg-slate-50 rounded-xl px-3 py-2">"{sel.reason}"</p>
                </div>
              )}

              {/* Editable areas (pending) / read-only (decided) */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  {sel.status === 'pending'
                    ? `Areas to grant (${modalAreas.length}) — click × to remove, or add below`
                    : `Requested Areas (+${sel.requestedAreas?.length})`}
                </p>
                {sel.status === 'pending' ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {modalAreas.map((a, i) => (
                        <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                          <button onClick={() => setModalAreas(prev => prev.filter((_, x) => x !== i))}>
                            <span className="material-icons-outlined text-sm">close</span>
                          </button>
                        </span>
                      ))}
                      {modalAreas.length === 0 && <span className="text-xs text-slate-400">No areas — add at least one to approve, or reject.</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input value={addCity} onChange={e => setAddCity(e.target.value)} placeholder="City" className={`${INP} flex-1 min-w-0`} />
                      <input value={addPin} onChange={e => setAddPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Pincode" maxLength={6} className={`${INP} w-24`} />
                      <button onClick={addPincode}
                        className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition">
                        Add
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(sel.requestedAreas || []).map((a, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin note */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Admin Note (optional)</label>
                <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Reason for approval or rejection…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>

              {msg.text && (
                <div className={`p-2 rounded-xl text-xs font-semibold text-center ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {msg.text}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 space-y-2">
              {sel.status === 'pending' ? (
                <div className="flex gap-3">
                  <button onClick={() => decide('approved')} disabled={working || modalAreas.length === 0}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-1">
                    <span className="material-icons-outlined text-base">verified</span> Approve
                  </button>
                  <button onClick={() => decide('rejected')} disabled={working}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition disabled:opacity-60">
                    Reject
                  </button>
                </div>
              ) : (
                <div className={`p-3 rounded-xl text-sm font-semibold text-center ${sel.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {sel.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  {sel.adminNote && ` — ${sel.adminNote}`}
                </div>
              )}
              <button onClick={() => setSel(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
