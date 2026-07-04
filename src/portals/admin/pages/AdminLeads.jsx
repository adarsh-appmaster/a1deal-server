import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { Pagination } from '../../../components/common/Pagination';

const STATUS_META = {
  new:         { label: 'New',          color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  contacted:   { label: 'Contacted',    color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  site_visit:  { label: 'Site Visit',   color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  negotiating: { label: 'Negotiating',  color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
  closed_won:  { label: 'Closed Won',   color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  closed_lost: { label: 'Closed Lost',  color: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
};
const STATUSES = ['all', 'new', 'contacted', 'site_visit', 'negotiating', 'closed_won', 'closed_lost'];
const PROP_TYPES = ['all', 'unit', 'mortgage'];
const SOURCES = ['manual', 'whatsapp', 'email', 'website', 'referral', 'walk_in'];
const LIMIT = 15;

function fmt(n) {
  if (!n) return null;
  const l = Number(n);
  return l >= 10000000 ? `₹${(l / 10000000).toFixed(2)} Cr` : `₹${(l / 100000).toFixed(1)} L`;
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminLeads() {
  const [leads, setLeads]         = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [total, setTotal]         = useState(0);

  const [search, setSearch]             = useState('');
  const [inputVal, setInputVal]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');

  const [selected, setSelected]   = useState(null); // lead for detail panel
  const [noteText, setNoteText]   = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Assignable people (team + brokers) for assignment
  const [teamMembers, setTeamMembers]   = useState([]);
  const [masterBrokers, setMasterBrokers] = useState([]);
  const [brokers, setBrokers]           = useState([]);
  const [teamError, setTeamError]       = useState('');

  const fetchLeads = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search)                  params.set('search', search);
      if (statusFilter !== 'all')  params.set('status', statusFilter);
      if (typeFilter !== 'all')    params.set('propertyType', typeFilter);
      const { data } = await api.get(`/leads?${params}`);
      setLeads(data.leads || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  }, [search, statusFilter, typeFilter]);

  const fetchStats = useCallback(async () => {
    try { const { data } = await api.get('/leads/stats'); setStats(data); } catch { /* empty */ }
  }, []);

  const fetchTeam = useCallback(async () => {
    setTeamError('');
    try {
      const [teamRes, brokerRes] = await Promise.all([
        api.get('/users?role=team'),
        api.get('/users?role=broker'),
      ]);
      setTeamMembers(Array.isArray(teamRes.data) ? teamRes.data : []);
      const allBrokers = Array.isArray(brokerRes.data) ? brokerRes.data : [];
      setMasterBrokers(allBrokers.filter(b => b.brokerTier === 'master'));
      setBrokers(allBrokers.filter(b => b.brokerTier !== 'master'));
    } catch (err) {
      setTeamError(err.response?.data?.message || 'Could not load team/broker list.');
    }
  }, []);

  useEffect(() => { fetchLeads(1); fetchStats(); fetchTeam(); }, [fetchLeads, fetchStats, fetchTeam]);

  function handleSearch(e) { e.preventDefault(); setSearch(inputVal.trim()); }

  async function openLead(lead) {
    try {
      const { data } = await api.get(`/leads/${lead._id}`);
      setSelected(data.lead);
      setNoteText('');
    } catch {
      setSelected(lead);
    }
  }

  async function updateStatus(id, status) {
    setSavingStatus(true);
    try {
      const { data } = await api.patch(`/leads/${id}`, { status });
      setSelected(data.lead);
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status: data.lead.status } : l));
      fetchStats();
    } catch { /* empty */ }
    setSavingStatus(false);
  }

  async function assignLead(id, assignedTo) {
    try {
      const { data } = await api.patch(`/leads/${id}`, { assignedTo: assignedTo || null });
      setSelected(data.lead);
      setLeads(prev => prev.map(l => l._id === id ? { ...l, assignedTo: data.lead.assignedTo } : l));
    } catch { /* empty */ }
  }

  async function addNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const { data } = await api.patch(`/leads/${selected._id}`, { note: noteText });
      setSelected(data.lead);
      setNoteText('');
    } catch { /* empty */ }
    setSavingNote(false);
  }

  async function deleteLead(id) {
    if (!window.confirm('Remove this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      setLeads(prev => prev.filter(l => l._id !== id));
      if (selected?._id === id) setSelected(null);
      fetchStats();
    } catch { /* empty */ }
  }

  const statsRow = [
    { key: 'total',       label: 'Total',       color: 'text-slate-700' },
    { key: 'new',         label: 'New',          color: 'text-blue-600' },
    { key: 'contacted',   label: 'Contacted',    color: 'text-indigo-600' },
    { key: 'site_visit',  label: 'Site Visit',   color: 'text-violet-600' },
    { key: 'negotiating', label: 'Negotiating',  color: 'text-amber-600' },
    { key: 'closed_won',  label: 'Won',          color: 'text-emerald-600' },
    { key: 'closed_lost', label: 'Lost',         color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Lead Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track all enquiries from unit and mortgage property listings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {statsRow.map(s => (
          <div key={s.key} className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
            <p className={`font-montserrat font-bold text-xl ${s.color}`}>{stats[s.key] ?? 0}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
            <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder="Search by name, phone, email, property…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30 bg-white" />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#484a5a] text-white text-sm font-semibold hover:bg-[#2e3044] transition">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setInputVal(''); }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
              <span className="material-icons-outlined text-sm">close</span>
            </button>
          )}
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold">Status:</span>
          {STATUSES.map(s => {
            const m = STATUS_META[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                  ${statusFilter === s ? 'bg-[#484a5a] text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                {m && statusFilter !== s && <span className={`w-2 h-2 rounded-full ${m.dot}`} />}
                {s === 'all' ? 'All Status' : m?.label}
              </button>
            );
          })}
          <span className="text-xs text-slate-400 font-semibold ml-2">Type:</span>
          {PROP_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize
                ${typeFilter === t ? 'bg-[#484a5a] text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {t === 'all' ? 'All Types' : `${t.charAt(0).toUpperCase() + t.slice(1)} Properties`}
            </button>
          ))}
        </div>
      </div>

      {/* Split layout: list + detail panel */}
      <div className={`gap-5 ${selected ? 'grid grid-cols-1 lg:grid-cols-5' : 'block'}`}>
        {/* Lead list */}
        <div className={selected ? 'lg:col-span-3' : ''}>
          <p className="text-xs text-slate-400 mb-3">{total} lead{total !== 1 ? 's' : ''}{search ? ` for "${search}"` : ''}</p>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-icons-outlined text-3xl animate-spin text-[#484a5a]">progress_activity</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <span className="material-icons-outlined text-5xl text-slate-200">person_search</span>
              <p className="text-slate-400 mt-3">No leads found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map(lead => {
                const m = STATUS_META[lead.status];
                const isOpen = selected?._id === lead._id;
                return (
                  <div key={lead._id}
                    onClick={() => openLead(lead)}
                    className={`bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition
                      ${isOpen ? 'border-[#484a5a] ring-2 ring-[#484a5a]/15' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-slate-800 text-sm truncate">{lead.name}</p>
                          {m && (
                            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${m.color}`}>
                              {m.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="material-icons-outlined text-xs">call</span>
                          {lead.phone}
                          {lead.email && <span className="text-slate-300 mx-1">·</span>}
                          {lead.email && <span className="truncate">{lead.email}</span>}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                          <span className="material-icons-outlined text-xs">apartment</span>
                          {lead.propertyTitle || 'Unknown property'}
                          <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full text-[10px] capitalize">{lead.propertyType}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className="text-xs text-slate-400">{timeAgo(lead.createdAt)}</p>
                        {lead.assignedTo && (
                          <p className="text-xs text-[#484a5a] font-semibold">{lead.assignedTo.name}</p>
                        )}
                        {lead.budget && (
                          <p className="text-xs font-semibold text-slate-600">{fmt(lead.budget)}</p>
                        )}
                        {lead.notes?.length > 0 && (
                          <p className="text-xs text-slate-400">
                            <span className="material-icons-outlined text-xs align-middle">notes</span>
                            {lead.notes.length}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            <Pagination currentPage={page} totalPages={pages} totalItems={total} itemsPerPage={LIMIT} onPageChange={p => fetchLeads(p)} />
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 sticky top-4">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <p className="font-montserrat font-bold text-slate-800">{selected.name}</p>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                  <span className="material-icons-outlined text-lg">close</span>
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Contact */}
                <div className="space-y-1.5">
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#484a5a]">
                    <span className="material-icons-outlined text-base text-slate-400">call</span>
                    {selected.phone}
                  </a>
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-[#484a5a]">
                      <span className="material-icons-outlined text-base text-slate-400">mail</span>
                      {selected.email}
                    </a>
                  )}
                  {selected.budget && (
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="material-icons-outlined text-base text-slate-400">currency_rupee</span>
                      Budget: <span className="font-semibold">{fmt(selected.budget)}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="material-icons-outlined text-base">source</span>
                    Source: <span className="capitalize">{(selected.source || '').replace('_', ' ')}</span>
                  </p>
                </div>

                {/* Property */}
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Property</p>
                  <p className="text-sm font-semibold text-slate-700">{selected.propertyTitle}</p>
                  <span className="text-xs text-slate-500 capitalize bg-slate-200 px-1.5 py-0.5 rounded-full">{selected.propertyType}</span>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Update Status</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(STATUS_META).map(([key, m]) => (
                      <button key={key} disabled={savingStatus || selected.status === key}
                        onClick={() => updateStatus(selected._id, key)}
                        className={`text-xs font-semibold px-3 py-2 rounded-xl border transition text-left
                          ${selected.status === key ? `${m.color} border-transparent` : 'border-slate-200 text-slate-600 hover:border-[#484a5a]'}`}>
                        <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${m.dot}`} />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assign */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Assigned To</p>
                  {teamError && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs">
                      <span className="flex-1">{teamError}</span>
                      <button type="button" onClick={fetchTeam} className="font-semibold underline flex-shrink-0">Retry</button>
                    </div>
                  )}
                  {!teamError && teamMembers.length === 0 && masterBrokers.length === 0 && brokers.length === 0 && (
                    <p className="text-xs text-slate-400 mb-2">No team members or brokers found.</p>
                  )}
                  <select
                    value={selected.assignedTo?._id || ''}
                    onChange={e => assignLead(selected._id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30">
                    <option value="">Unassigned</option>
                    {teamMembers.length > 0 && (
                      <optgroup label="Team">
                        {teamMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </optgroup>
                    )}
                    {masterBrokers.length > 0 && (
                      <optgroup label="Master Brokers">
                        {masterBrokers.map(m => <option key={m._id} value={m._id}>{m.name}{m.city ? ` · ${m.city}` : ''}</option>)}
                      </optgroup>
                    )}
                    {brokers.length > 0 && (
                      <optgroup label="Brokers">
                        {brokers.map(m => <option key={m._id} value={m._id}>{m.name}{m.city ? ` · ${m.city}` : ''}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Follow-up date */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Follow-up Date</p>
                  <input type="date"
                    value={selected.followUpDate ? new Date(selected.followUpDate).toISOString().split('T')[0] : ''}
                    onChange={async e => {
                      try {
                        const { data } = await api.patch(`/leads/${selected._id}`, { followUpDate: e.target.value || null });
                        setSelected(data.lead);
                      } catch { /* empty */ }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30" />
                </div>

                {/* Notes timeline */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                    Notes ({selected.notes?.length || 0})
                  </p>
                  {selected.notes?.length > 0 && (
                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                      {[...selected.notes].reverse().map(n => (
                        <div key={n._id} className="bg-slate-50 rounded-xl p-3">
                          <p className="text-sm text-slate-700">{n.text}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {n.addedBy?.name || 'Admin'} · {timeAgo(n.addedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <form onSubmit={addNote} className="flex gap-2">
                    <input
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Add a note…"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30" />
                    <button type="submit" disabled={savingNote || !noteText.trim()}
                      className="px-3 py-2 rounded-xl bg-[#484a5a] text-white text-xs font-semibold hover:bg-[#2e3044] transition disabled:opacity-50">
                      {savingNote ? '…' : 'Add'}
                    </button>
                  </form>
                </div>

                {/* Delete */}
                <div className="pt-2 border-t border-slate-100">
                  <button onClick={() => deleteLead(selected._id)}
                    className="w-full py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition">
                    Remove Lead
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
