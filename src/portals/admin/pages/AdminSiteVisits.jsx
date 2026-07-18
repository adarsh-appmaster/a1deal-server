import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import AssignPanel from '../../../components/common/AssignPanel';
import { resolveOwner } from '../../../utils/owner';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  no_show:   'bg-slate-200 text-slate-600',
};
const STATUS_LABELS = {
  scheduled: 'Scheduled', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No Show',
};


export default function AdminSiteVisits() {
  const { user: me } = useAuth();
  const [visits, setVisits]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [loadError, setLoadError] = useState('');

  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch]     = useState('');

  const [selected, setSelected]           = useState(null);
  const [teamMembers, setTeamMembers]     = useState([]);
  const [pincodeMatches, setPincodeMatches] = useState(null);
  const [assignTo, setAssignTo]         = useState('');
  const [selectedTeam, setSelectedTeam] = useState([]);
  const [adminNote, setAdminNote]       = useState('');
  const [newStatus, setNewStatus]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');

  // WhatsApp schedule
  const [waMsg, setWaMsg]         = useState('');
  const [waTime, setWaTime]       = useState('');
  const [waSchedules, setWaSchedules] = useState([]);
  const [waSaving, setWaSaving]   = useState(false);
  const [waMsg2, setWaMsg2]       = useState('');

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = { page, limit: LIMIT };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/site-visits', { params });
      setVisits(data.visits || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('[SiteVisits] load:', err?.response?.status, err?.response?.data || err.message);
      setLoadError(err.response?.data?.message || `Failed to load visits (${err.response?.status || 'network error'}).`);
    }
    setLoading(false);
  }, [page, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/enquiry/brokers')
      .then(r => setTeamMembers(r.data.teamMembers || []))
      .catch(() => {});
  }, []);

  function buildWaTemplate(v) {
    return `Hi ${v.name}, your site visit for *${v.propertyTitle || 'the property'}* in ${v.city || ''} is confirmed for *${v.date}* at *${v.slot}*. Your pass code is *${v.passCode}*. Our team member will be there to assist you. – A1 Deal`;
  }

  function openVisit(v) {
    setSelected(v);
    setAssignTo(v.assignedTo?._id || '');
    setSelectedTeam((v.assignedTeam || []).map(t => t._id));
    setAdminNote(v.adminNote || '');
    setNewStatus(v.status);
    setSaveMsg('');
    setPincodeMatches(null);
    setWaMsg(buildWaTemplate(v));
    setWaTime('');
    setWaMsg2('');
    api.get('/whatsapp-schedule', { params: { visitId: v._id } })
      .then(r => setWaSchedules(r.data.schedules || []))
      .catch(() => setWaSchedules([]));
    // Load pincode-matched broker/master so admin can re-own the lead (all models).
    if (v.city || v.buyerPincode) {
      api.get('/enquiry/brokers', { params: { city: v.city, pincode: v.buyerPincode || '' } })
        .then(r => setPincodeMatches(r.data.pincodeMatches || null))
        .catch(() => {});
    }
  }

  function toggleTeamMate(id) {
    setSelectedTeam(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleAssign() {
    if (!assignTo) return;
    setSaving(true);
    try {
      const isAuctionUnit = selected?.propertyModel === 'AuctionUnitProperty';
      const { data } = await api.patch(`/site-visits/${selected._id}/assign`, {
        assignedTo: assignTo,
        ...(isAuctionUnit && { assignedTeam: selectedTeam }),
      });
      setSaveMsg(data.message || 'Assigned.');
      setSelected(data.visit);
      setVisits(prev => prev.map(v => v._id === data.visit._id ? data.visit : v));
    } catch (ex) {
      setSaveMsg(ex.response?.data?.message || 'Assignment failed.');
    }
    setSaving(false);
  }

  async function handleScheduleWa(e) {
    e.preventDefault();
    if (!waMsg.trim() || !waTime) return;
    setWaSaving(true); setWaMsg2('');
    try {
      const phone = selected.phone.replace(/\D/g, '');
      const { data } = await api.post('/whatsapp-schedule', {
        phone: phone.startsWith('91') ? phone : `91${phone}`,
        message: waMsg.trim(),
        scheduledAt: waTime,
        visitId: selected._id,
      });
      setWaSchedules(prev => [...prev, data.schedule]);
      setWaMsg2('WhatsApp follow-up scheduled.');
      setWaTime('');
    } catch (ex) {
      setWaMsg2(ex.response?.data?.message || 'Failed to schedule.');
    }
    setWaSaving(false);
  }

  async function cancelWaSchedule(id) {
    try {
      await api.delete(`/whatsapp-schedule/${id}`);
      setWaSchedules(prev => prev.map(s => s._id === id ? { ...s, status: 'cancelled' } : s));
    } catch (ex) {
      setWaMsg2(ex.response?.data?.message || 'Failed to cancel schedule.');
    }
  }

  async function handleStatusUpdate() {
    setSaving(true);
    try {
      const { data } = await api.patch(`/site-visits/${selected._id}`, { status: newStatus, adminNote });
      setSaveMsg('Saved.');
      setSelected(data.visit);
      setVisits(prev => prev.map(v => v._id === data.visit._id ? data.visit : v));
    } catch (ex) {
      setSaveMsg(ex.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-slate-800">Site Visits</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total scheduled visits</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, phone, property, pass code…"
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary"
        />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary bg-white">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <span className="material-icons-outlined text-base">error_outline</span>
          {loadError}
          <button onClick={load} className="ml-auto text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <span className="material-icons-outlined animate-spin mr-2">refresh</span> Loading…
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="material-icons-outlined text-4xl mb-2 block">event_busy</span>
            No site visits found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Buyer', 'Property', 'Date / Slot', 'Status', 'Owner', 'Site Rep', 'Lead', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visits.map(v => (
                  <tr key={v._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{v.name}</p>
                      <p className="text-slate-400 text-xs">{v.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 truncate max-w-[180px]" title={v.propertyTitle}>{v.propertyTitle || '—'}</p>
                      <p className="text-xs text-slate-400">{[v.area, v.city].filter(Boolean).join(', ')}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {v.date} <br /> {v.slot}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[v.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[v.status] || v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => { const o = resolveOwner(v); return (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${o.cls}`} title={o.name || ''}>
                          {o.label}{o.name ? ` · ${o.name.split(' ')[0]}` : ''}
                        </span>
                      ); })()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {v.assignedTo ? v.assignedTo.name : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {v.leadGenerated ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          v.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-violet-100 text-violet-700'
                        }`}>
                          <span className="material-icons-outlined text-[10px]">
                            {v.status === 'completed' ? 'verified_user' : 'pending_actions'}
                          </span>
                          {v.status === 'completed' ? 'Sent to broker' : 'Lead active'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openVisit(v)}
                        className="text-tertiary hover:text-[#2e3044] text-xs font-semibold flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">open_in_new</span>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
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

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {selected.propertyTitle && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                  <p className="font-semibold text-slate-700">{selected.propertyTitle}</p>
                  <p className="text-xs text-slate-400">{[selected.area, selected.city].filter(Boolean).join(', ')}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Date</p>
                  <p className="text-slate-700">{selected.date}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Slot</p>
                  <p className="text-slate-700">{selected.slot}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Pass Code</p>
                  <p className="font-mono text-slate-700">{selected.passCode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">OTP Verified</p>
                  <p className="text-slate-700">{selected.otpVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <AssignPanel
                  me={me}
                  assignTo={assignTo}
                  onAssignTo={setAssignTo}
                  pincodeMatches={pincodeMatches}
                  teamMembers={teamMembers}
                  onAssign={handleAssign}
                  saving={saving}
                  label="Assign Visit To"
                  showTeamMates={selected?.propertyModel === 'AuctionUnitProperty'}
                  selectedTeam={selectedTeam}
                  onToggleTeam={toggleTeamMate}
                />
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status & Notes</p>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary bg-white">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <textarea rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="Admin note…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30 focus:border-tertiary resize-none"
                />
                <button onClick={handleStatusUpdate} disabled={saving}
                  className="w-full py-2.5 rounded-xl border-2 border-tertiary text-tertiary font-bold text-sm hover:bg-tertiary/5 transition disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>

              {saveMsg && (
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs border ${saveMsg.includes('lead') ? 'bg-violet-50 border-violet-100 text-violet-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                  <span className="material-icons-outlined text-sm">{saveMsg.includes('lead') ? 'person_add' : 'check_circle'}</span>
                  {saveMsg}
                </div>
              )}

              {/* Lead status badge */}
              {selected.leadGenerated && (
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs border ${
                  selected.status === 'completed'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-violet-50 border-violet-100 text-violet-700'
                }`}>
                  <span className="material-icons-outlined text-sm">
                    {selected.status === 'completed' ? 'verified_user' : 'pending_actions'}
                  </span>
                  {selected.status === 'completed'
                    ? 'OTP verified — lead sent to master broker.'
                    : 'Lead created at booking. Will go to master broker after OTP verification.'}
                </div>
              )}

              {/* WhatsApp Follow-up Scheduler */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-icons-outlined text-emerald-600 text-base">whatsapp</span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Schedule WhatsApp Follow-up</p>
                </div>

                <form onSubmit={handleScheduleWa} className="space-y-2">
                  <textarea
                    rows={3}
                    value={waMsg}
                    onChange={e => setWaMsg(e.target.value)}
                    placeholder="Message to send…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
                  />
                  <input
                    type="datetime-local"
                    value={waTime}
                    onChange={e => setWaTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={waSaving || !waMsg.trim() || !waTime}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                      <span className="material-icons-outlined text-sm">schedule_send</span>
                      {waSaving ? 'Scheduling…' : 'Schedule Send'}
                    </button>
                    <a
                      href={`https://wa.me/${selected.phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`}
                      target="_blank" rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">open_in_new</span>
                      Send Now
                    </a>
                  </div>
                </form>

                {waMsg2 && (
                  <p className={`text-xs px-3 py-2 rounded-lg ${waMsg2.includes('scheduled') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {waMsg2}
                  </p>
                )}

                {/* Existing schedules */}
                {waSchedules.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Scheduled</p>
                    {waSchedules.map(s => (
                      <div key={s._id} className="flex items-start justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-600 truncate">{s.message.slice(0, 60)}…</p>
                          <p className="text-slate-400 mt-0.5">
                            {new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full font-semibold ${
                          s.status === 'sent'      ? 'bg-emerald-100 text-emerald-700' :
                          s.status === 'pending'   ? 'bg-amber-100 text-amber-700' :
                          s.status === 'failed'    ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{s.status}</span>
                        {s.status === 'pending' && (
                          <button onClick={() => cancelWaSchedule(s._id)}
                            className="flex-shrink-0 text-rose-400 hover:text-rose-600">
                            <span className="material-icons-outlined text-base">cancel</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
