import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';

const STATUS_COLORS = {
  new:         'bg-blue-100 text-blue-700',
  assigned:    'bg-amber-100 text-amber-700',
  in_progress: 'bg-purple-100 text-purple-700',
  closed:      'bg-emerald-100 text-emerald-700',
  rejected:    'bg-rose-100 text-rose-700',
};
const STATUS_LABELS = {
  new: 'New', assigned: 'Assigned', in_progress: 'In Progress', closed: 'Closed', rejected: 'Rejected',
};
const PURPOSE_LABELS = { buy: 'Buy', invest: 'Invest', general: 'General' };

function fmtBudget(b) {
  if (!b || (!b.min && !b.max)) return '—';
  const fmt = v => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : `₹${(v/100000).toFixed(0)}L`;
  if (b.min && b.max) return `${fmt(b.min)} – ${fmt(b.max)}`;
  if (b.min) return `From ${fmt(b.min)}`;
  return `Up to ${fmt(b.max)}`;
}

const INP = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a5f]/30 focus:border-[#ff5a5f] bg-white';

// Modal to raise a new enquiry on behalf of a client (within broker's zone)
function RaiseEnquiryModal({ brokerZone, onClose, onCreated }) {
  const [form, setForm] = useState({
    name:     '',
    phone:    '',
    email:    '',
    city:     brokerZone?.city    || '',
    area:     brokerZone?.area    || '',
    pincode:  brokerZone?.pincode || '',
    purpose:  'buy',
    bedrooms: '',
    budgetMin: '',
    budgetMax: '',
    message:  '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Client name and phone are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        name:    form.name,
        phone:   form.phone,
        email:   form.email || undefined,
        city:    form.city,
        area:    form.area  || undefined,
        pincode: form.pincode || undefined,
        purpose: form.purpose,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        budget: (form.budgetMin || form.budgetMax) ? {
          min: form.budgetMin ? Number(form.budgetMin) * 100000 : undefined,
          max: form.budgetMax ? Number(form.budgetMax) * 100000 : undefined,
        } : undefined,
        message: form.message || undefined,
      };
      const { data } = await api.post('/enquiry', payload);
      onCreated?.(data.enquiry);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise enquiry.');
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-6 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-montserrat font-bold text-lg text-slate-800">Raise Client Enquiry</h2>
            <p className="text-xs text-slate-400 mt-0.5">Log an enquiry on behalf of a client in your zone</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[78vh]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>
          )}

          {/* Client details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Client Name *</label>
              <input className={INP} placeholder="Full name" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Phone *</label>
              <input className={INP} placeholder="+91 98765 43210" value={form.phone}
                onChange={e => set('phone', e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
              <input className={INP} type="email" placeholder="client@email.com" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          {/* Zone — pre-filled from broker's zone */}
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-icons-outlined text-amber-500 text-base">location_on</span>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Client's Location (your zone)</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">City</label>
                <input className={INP} placeholder="City" value={form.city}
                  onChange={e => set('city', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Area</label>
                <input className={INP} placeholder="Area" value={form.area}
                  onChange={e => set('area', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Pincode</label>
                <input className={INP} placeholder="Pincode" value={form.pincode}
                  onChange={e => set('pincode', e.target.value)} />
              </div>
            </div>
            {brokerZone?.city && (
              <p className="text-xs text-amber-600">Pre-filled from your registered zone.</p>
            )}
          </div>

          {/* Requirement */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Purpose</label>
              <select className={INP} value={form.purpose} onChange={e => set('purpose', e.target.value)}>
                <option value="buy">Buy</option>
                <option value="invest">Invest</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bedrooms</label>
              <input className={INP} type="number" min="0" placeholder="e.g. 3" value={form.bedrooms}
                onChange={e => set('bedrooms', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Budget Min (₹L)</label>
              <input className={INP} type="number" placeholder="e.g. 50" value={form.budgetMin}
                onChange={e => set('budgetMin', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Budget Max (₹L)</label>
              <input className={INP} type="number" placeholder="e.g. 150" value={form.budgetMax}
                onChange={e => set('budgetMax', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Client's Requirement</label>
            <textarea className={INP + ' resize-none'} rows={3}
              placeholder="Location preferences, specific requirements…"
              value={form.message} onChange={e => set('message', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#ff5a5f] text-white text-sm font-semibold hover:bg-[#e04e53] transition disabled:opacity-50">
              {saving ? 'Raising…' : 'Raise Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BrokerEnquiries() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [selected, setSelected] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');

  const [showRaise, setShowRaise]   = useState(false);
  const [brokerZone, setBrokerZone] = useState(null);

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filterStatus !== 'all') params.status = filterStatus;
      const { data } = await api.get('/enquiry/mine', { params });
      setEnquiries(data.enquiries || []);
      setTotal(data.total || 0);
    } catch { /* silently */ }
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // Load broker's zone for pre-filling the Raise Enquiry form
    api.get('/mortgage-properties/my-areas')
      .then(r => setBrokerZone(r.data?.homeArea || null))
      .catch(() => {
        if (user?.city) setBrokerZone({ city: user.city, area: user.area || '', pincode: user.pincode || '' });
      });
  }, [user]);

  function openEnquiry(enq) {
    setSelected(enq);
    setNoteText(enq.adminNote || '');
    setNewStatus(enq.status);
    setSaveMsg('');
  }

  async function handleUpdate() {
    setSaving(true);
    try {
      const { data } = await api.patch(`/enquiry/${selected._id}/progress`, {
        status: newStatus, adminNote: noteText,
      });
      setSaveMsg('Saved!');
      setSelected(data.enquiry);
      setEnquiries(prev => prev.map(e => e._id === data.enquiry._id ? data.enquiry : e));
    } catch (ex) {
      setSaveMsg(ex.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  }

  function handleCreated(enq) {
    if (enq) { setEnquiries(prev => [enq, ...prev]); setTotal(t => t + 1); }
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-slate-800">Property Enquiries</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} enquir{total !== 1 ? 'ies' : 'y'} in your zone</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a5f]/30 focus:border-[#ff5a5f] bg-white">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={() => setShowRaise(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff5a5f] text-white text-sm font-semibold hover:bg-[#e04e53] transition whitespace-nowrap">
            <span className="material-icons-outlined text-base">add</span>
            Raise Enquiry
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <span className="material-icons-outlined animate-spin mr-2">refresh</span> Loading…
        </div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-16 text-slate-400">
          <span className="material-icons-outlined text-4xl mb-2 block">contact_support</span>
          No enquiries yet.
          <p className="text-sm mt-2">
            <button onClick={() => setShowRaise(true)} className="text-[#ff5a5f] font-semibold hover:underline">
              Raise your first enquiry →
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map(e => (
            <div key={e._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-200 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-slate-800">{e.name}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[e.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABELS[e.status] || e.status}
                  </span>
                  {e.myRole === 'broker' && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      Auto-routed: Broker
                    </span>
                  )}
                  {e.myRole === 'master_broker' && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                      Auto-routed: Master
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-icons-outlined text-sm">call</span>{e.phone}
                  </span>
                  {(e.city || e.pincode) && (
                    <span className="flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">location_on</span>
                      {[e.area, e.city, e.pincode].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="material-icons-outlined text-sm">home</span>
                    {PURPOSE_LABELS[e.purpose]}{e.bedrooms ? ` · ${e.bedrooms} BHK` : ''}
                  </span>
                  <span>{fmtBudget(e.budget)}</span>
                </div>
                {e.propertyTitle && <p className="text-xs text-[#4900e5] mt-1 truncate">{e.propertyTitle}</p>}
                {e.message && <p className="text-xs text-slate-400 mt-1 truncate">{e.message}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(e.assignedAt || e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <button onClick={() => openEnquiry(e)}
                  className="px-4 py-2 rounded-xl bg-[#ff5a5f] text-white text-xs font-bold hover:bg-[#e04e53] transition whitespace-nowrap">
                  Update →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50">
            ← Prev
          </button>
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 disabled:opacity-40 hover:bg-slate-50">
            Next →
          </button>
        </div>
      )}

      {/* Detail / update modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-montserrat font-bold text-base text-slate-800">{selected.name}</h2>
                <p className="text-xs text-slate-400">{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {selected.propertyTitle && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-700">
                  {selected.propertyTitle}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Location</p>
                  <p className="text-slate-700">{[selected.area, selected.city, selected.pincode].filter(Boolean).join(', ') || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Purpose</p>
                  <p className="text-slate-700">{PURPOSE_LABELS[selected.purpose]}{selected.bedrooms ? ` · ${selected.bedrooms} BHK` : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Budget</p>
                  <p className="text-slate-700">{fmtBudget(selected.budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Received</p>
                  <p className="text-slate-700">{new Date(selected.assignedAt || selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {selected.message && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Customer Message</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{selected.message}</p>
                </div>
              )}

              {selected.assignmentNote && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Admin Note</p>
                  <p className="text-sm text-slate-600 bg-amber-50 rounded-xl p-3 border border-amber-100">{selected.assignmentNote}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Update Progress</p>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a5f]/30 focus:border-[#ff5a5f] bg-white">
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed (Deal Done)</option>
                </select>
                <textarea rows={2} value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a progress note…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a5f]/30 focus:border-[#ff5a5f] resize-none"
                />
                <button onClick={handleUpdate} disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-[#ff5a5f] text-white font-bold text-sm hover:bg-[#e04e53] transition disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Update'}
                </button>
                {saveMsg && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs">
                    <span className="material-icons-outlined text-sm">check_circle</span>{saveMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raise Enquiry modal */}
      {showRaise && (
        <RaiseEnquiryModal
          brokerZone={brokerZone}
          onClose={() => setShowRaise(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
