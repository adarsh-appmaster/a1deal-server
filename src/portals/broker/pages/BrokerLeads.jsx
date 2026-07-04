import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';

const STATUS_META = {
  new:          { label: 'New',         color: 'bg-blue-100 text-blue-700' },
  contacted:    { label: 'Contacted',   color: 'bg-sky-100 text-sky-700' },
  site_visit:   { label: 'Site Visit',  color: 'bg-violet-100 text-violet-700' },
  negotiating:  { label: 'Negotiating', color: 'bg-amber-100 text-amber-700' },
  closed_won:   { label: 'Won',         color: 'bg-emerald-100 text-emerald-700' },
  closed_lost:  { label: 'Lost',        color: 'bg-rose-100 text-rose-700' },
};

const SOURCE_ICON = {
  site_visit: 'home_work',
  website:    'language',
  whatsapp:   'whatsapp',
  referral:   'people',
  walk_in:    'directions_walk',
  manual:     'edit_note',
  email:      'email',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function fmtBudget(n) {
  if (!n) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const STATUSES = ['all', 'new', 'contacted', 'site_visit', 'negotiating', 'closed_won', 'closed_lost'];

export default function BrokerLeads() {
  const [leads, setLeads]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);

  const [selected, setSelected] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = { page, limit: LIMIT };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/broker/leads', { params });
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (err) {
      setLoadError(err.response?.data?.message || err.message || 'Failed to load leads.');
      setLeads([]);
    }
    setLoading(false);
  }, [page, filter, search]);

  useEffect(() => { load(); }, [load]);

  function openLead(l) {
    setSelected(l);
    setNewStatus(l.status);
    setNoteText('');
    setSaveMsg('');
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      const { data } = await api.patch(`/leads/${selected._id}`, {
        status: newStatus,
        ...(noteText.trim() ? { note: noteText.trim() } : {}),
      });
      setSaveMsg('Saved.');
      setSelected(data.lead);
      setLeads(prev => prev.map(l => l._id === data.lead._id ? data.lead : l));
      setNoteText('');
    } catch (ex) {
      setSaveMsg(ex.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Lead Management</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">{total} lead{total !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, phone, property…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === s ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
              {s === 'all' ? 'All' : STATUS_META[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <span className="material-icons-outlined text-base">error_outline</span>
          {loadError}
          <button onClick={load} className="ml-auto text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="card p-5 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="card p-14 flex flex-col items-center text-center">
          <span className="material-icons-outlined text-5xl text-slate-200 mb-3">people_outline</span>
          <p className="font-semibold text-on-surface mb-1">No leads yet</p>
          <p className="text-sm text-on-surface-variant">Leads assigned to you (including from site visits) will appear here</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Buyer', 'Property', 'Source', 'Status', 'Budget', 'Date', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {leads.map(l => {
                  const sm = STATUS_META[l.status] || { label: l.status, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={l._id} className="hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => openLead(l)}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-on-surface">{l.name}</p>
                        <p className="text-xs text-on-surface-variant">{l.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs max-w-[160px]">
                        <p className="truncate font-medium text-on-surface">{l.propertyTitle || '—'}</p>
                        {l.siteVisitId && (
                          <p className="text-violet-600 flex items-center gap-0.5 mt-0.5">
                            <span className="material-icons-outlined text-xs">home_work</span>
                            Visit {l.siteVisitId.date} · {l.siteVisitId.slot}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <span className="material-icons-outlined text-sm">{SOURCE_ICON[l.source] || 'help_outline'}</span>
                          {l.source?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 text-on-surface font-semibold text-xs">{fmtBudget(l.budget)}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{fmtDate(l.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <a href={`tel:${l.phone}`} onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-primary/10 text-on-surface-variant hover:text-primary transition">
                            <span className="material-icons-outlined text-base">call</span>
                          </a>
                          <a href={`https://wa.me/${l.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${l.name}, this is A1 Deal regarding your enquiry for ${l.propertyTitle || 'a property'}.`)}`}
                            target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-emerald-50 text-on-surface-variant hover:text-emerald-600 transition">
                            <span className="material-icons-outlined text-base">whatsapp</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm text-on-surface-variant disabled:opacity-40 hover:bg-surface-container">
            ← Prev
          </button>
          <span className="text-sm text-on-surface-variant">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-sm text-on-surface-variant disabled:opacity-40 hover:bg-surface-container">
            Next →
          </button>
        </div>
      )}

      {/* Lead detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-montserrat font-bold text-base text-slate-800">{selected.name}</h2>
                <p className="text-xs text-slate-400">{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* Property */}
              {selected.propertyTitle && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                  <p className="font-semibold text-slate-700">{selected.propertyTitle}</p>
                  <p className="text-xs text-slate-400 capitalize">{selected.propertyType} property</p>
                </div>
              )}

              {/* Site visit info */}
              {selected.siteVisitId && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 text-sm">
                  <span className="material-icons-outlined text-base">home_work</span>
                  <div>
                    <p className="font-semibold">From site visit</p>
                    <p className="text-xs">{selected.siteVisitId.date} · {selected.siteVisitId.slot} · Pass: {selected.siteVisitId.passCode}</p>
                  </div>
                </div>
              )}

              {/* Update form */}
              <form onSubmit={handleUpdate} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                    {Object.entries(STATUS_META).map(([v, m]) => (
                      <option key={v} value={v}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Add Follow-up Note</label>
                  <textarea rows={2} value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Note or follow-up action…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                {saveMsg && (
                  <p className={`text-xs px-3 py-2 rounded-lg ${saveMsg.includes('Saved') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {saveMsg}
                  </p>
                )}
                <button type="submit" disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </form>

              {/* Notes timeline */}
              {selected.notes?.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</p>
                  {[...selected.notes].reverse().map(n => (
                    <div key={n._id} className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
                      <p>{n.text}</p>
                      <p className="text-slate-400 mt-1">{fmtDate(n.addedAt)} · {n.addedBy?.name || 'You'}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick WhatsApp */}
              <div className="border-t border-slate-100 pt-4">
                <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hi ${selected.name}, this is A1 Deal team following up on your site visit for ${selected.propertyTitle || 'a property'}. Are you still interested?`)}`}
                  target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition">
                  <span className="material-icons-outlined text-base">whatsapp</span>
                  Send WhatsApp Follow-up
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
