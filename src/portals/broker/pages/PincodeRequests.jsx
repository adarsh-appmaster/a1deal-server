import { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import { INDIA_STATES } from '../../../data/indiaLocations';
import { expandPincodesForCity } from '../../../data/rajasthanPincodes';

const RAJASTHAN_CITIES = INDIA_STATES['Rajasthan'] || [];

const STATUS = {
  pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700',     icon: 'hourglass_top' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
  rejected: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700',       icon: 'cancel' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PincodeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [coveragePincodes, setCoveragePincodes] = useState([]);

  const [city, setCity]                     = useState('');
  const [cityOpen, setCityOpen]              = useState(false);
  const [citySearch, setCitySearch]          = useState('');
  const cityRef                              = useRef(null);

  const [selectedPincodes, setSelectedPincodes] = useState([]);
  const [manualPincode, setManualPincode]       = useState('');
  const [reason, setReason]                     = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [msg, setMsg]                           = useState({ text: '', ok: true });
  const [takenMap, setTakenMap]                 = useState({});

  // Edit state
  const [editingId, setEditingId]               = useState(null);
  const [editCity, setEditCity]                 = useState('');
  const [editSelectedPincodes, setEditSelectedPincodes] = useState([]);
  const [editManualPincode, setEditManualPincode]       = useState('');
  const [editReason, setEditReason]             = useState('');
  const [editSubmitting, setEditSubmitting]     = useState(false);
  const [editMsg, setEditMsg]                   = useState({ text: '', ok: true });
  const [editTakenMap, setEditTakenMap]         = useState({});

  const [cancellingId, setCancellingId]         = useState(null);

  const filteredCities = RAJASTHAN_CITIES.filter(c =>
    c.toLowerCase().includes(citySearch.trim().toLowerCase())
  );
  const cityPincodes = expandPincodesForCity(city);
  const editCityPincodes = expandPincodesForCity(editCity);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  useEffect(() => { fetchRequests(); fetchCoverage(); }, []);

  useEffect(() => {
    if (!city || !cityPincodes.length) { setTakenMap({}); return; }
    api.get(`/master-broker/taken-pincodes?pincodes=${cityPincodes.join(',')}`)
      .then(({ data }) => setTakenMap(data.taken || {}))
      .catch(() => setTakenMap({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  useEffect(() => {
    if (!editCity || !editCityPincodes.length) { setEditTakenMap({}); return; }
    api.get(`/master-broker/taken-pincodes?pincodes=${editCityPincodes.join(',')}`)
      .then(({ data }) => setEditTakenMap(data.taken || {}))
      .catch(() => setEditTakenMap({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCity]);

  useEffect(() => {
    if (!cityOpen) return;
    function handleOutside(e) {
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [cityOpen]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const { data } = await api.get('/master-broker/pincode-requests/mine');
      setRequests(data.requests || []);
    } catch { /* empty */ }
    setLoading(false);
  }

  async function fetchCoverage() {
    try {
      const { data } = await api.get('/broker/stats');
      setCoveragePincodes(data.coverage?.approvedPincodes || []);
    } catch { /* empty */ }
  }

  function togglePincode(p) {
    if (takenMap[p]) return;
    setSelectedPincodes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function addManualPincode() {
    const p = manualPincode.trim();
    if (!/^\d{6}$/.test(p)) return;
    if (takenMap[p]) { setMsg({ text: `Pincode ${p} is already assigned to ${takenMap[p]}.`, ok: false }); return; }
    if (!selectedPincodes.includes(p)) setSelectedPincodes(prev => [...prev, p]);
    setManualPincode('');
  }

  function removePincode(p) {
    setSelectedPincodes(prev => prev.filter(x => x !== p));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!city.trim()) { setMsg({ text: 'Select a city first.', ok: false }); return; }
    if (!selectedPincodes.length) { setMsg({ text: 'Add at least one pincode.', ok: false }); return; }

    setSubmitting(true); setMsg({ text: '', ok: true });
    try {
      const requestedAreas = selectedPincodes.map(p => ({ city, area: '', pincode: p }));
      await api.post('/master-broker/pincode-requests', { requestedAreas, reason });
      setMsg({ text: 'Pincode request submitted!', ok: true });
      setCity(''); setSelectedPincodes([]); setReason('');
      fetchRequests();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to submit request.', ok: false });
    }
    setSubmitting(false);
  }

  // ── Edit helpers ───────────────────────────────────────────────────────────
  function startEdit(r) {
    setEditingId(r._id);
    const areas = r.requestedAreas || [];
    const editCityVal = areas[0]?.city || '';
    setEditCity(editCityVal);
    setEditSelectedPincodes(areas.map(a => a.pincode).filter(Boolean));
    setEditManualPincode('');
    setEditReason(r.reason || '');
    setEditMsg({ text: '', ok: true });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditCity(''); setEditSelectedPincodes([]); setEditReason(''); setEditManualPincode('');
  }

  function toggleEditPincode(p) {
    if (editTakenMap[p] && !editSelectedPincodes.includes(p)) return;
    setEditSelectedPincodes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function addEditManualPincode() {
    const p = editManualPincode.trim();
    if (!/^\d{6}$/.test(p)) return;
    if (editTakenMap[p] && !editSelectedPincodes.includes(p)) {
      setEditMsg({ text: `Pincode ${p} is already assigned to ${editTakenMap[p]}.`, ok: false });
      return;
    }
    if (!editSelectedPincodes.includes(p)) setEditSelectedPincodes(prev => [...prev, p]);
    setEditManualPincode('');
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!editCity.trim()) { setEditMsg({ text: 'Select a city first.', ok: false }); return; }
    if (!editSelectedPincodes.length) { setEditMsg({ text: 'Add at least one pincode.', ok: false }); return; }

    setEditSubmitting(true); setEditMsg({ text: '', ok: true });
    try {
      const requestedAreas = editSelectedPincodes.map(p => ({ city: editCity, area: '', pincode: p }));
      await api.patch(`/master-broker/pincode-requests/${editingId}/edit`, { requestedAreas, reason: editReason });
      setEditMsg({ text: 'Request updated!', ok: true });
      setTimeout(() => { cancelEdit(); fetchRequests(); }, 800);
    } catch (err) {
      setEditMsg({ text: err.response?.data?.message || 'Failed to update request.', ok: false });
    }
    setEditSubmitting(false);
  }

  // ── Cancel helpers ─────────────────────────────────────────────────────────
  async function handleCancel(id) {
    if (!window.confirm('Cancel this pending request?')) return;
    setCancellingId(id);
    try {
      await api.delete(`/master-broker/pincode-requests/${id}/cancel`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request.');
    }
    setCancellingId(null);
  }

  const INP = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <span className="material-icons-outlined text-3xl text-primary">add_location_alt</span>
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Pincode Requests</h1>
          <p className="text-on-surface-variant text-sm">Ask admin to approve extra pincodes you'd like to operate in</p>
        </div>
      </div>

      {/* Coverage summary */}
      {coveragePincodes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">
            <span className="material-icons-outlined text-sm align-middle mr-1">verified</span>
            Your Approved Coverage ({coveragePincodes.length} pincodes)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {coveragePincodes.map(p => (
              <span key={p} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Request form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <span className="material-icons-outlined text-sm">info</span>
            You have a pending pincode request. Wait for admin decision before submitting another.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative" ref={cityRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
            <button type="button" disabled={pendingCount > 0}
              onClick={() => { setCityOpen(v => !v); setCitySearch(''); }}
              className={`${INP} flex items-center justify-between text-left ${!city ? 'text-slate-400' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}>
              {city || 'Select city'}
              <span className="material-icons-outlined text-base text-slate-400">
                {cityOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {cityOpen && (
              <div className="absolute z-20 top-full mt-1.5 left-1/2 -translate-x-1/2 w-64 max-w-[80vw] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="p-2 border-b border-slate-100">
                  <input type="text" autoFocus value={citySearch}
                    onChange={e => setCitySearch(e.target.value)}
                    placeholder="Search city…"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {filteredCities.length === 0 && (
                    <p className="px-4 py-2 text-sm text-slate-400 italic">No cities found</p>
                  )}
                  {filteredCities.map(c => (
                    <button key={c} type="button"
                      onClick={() => {
                        setCity(c);
                        setSelectedPincodes([]);
                        setCityOpen(false);
                        setCitySearch('');
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition ${
                        city === c ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Add pincode manually <span className="normal-case font-normal text-slate-300">(if not listed below)</span>
            </label>
            <div className="flex gap-2">
              <input type="text" value={manualPincode} disabled={!city || pendingCount > 0}
                onChange={e => setManualPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManualPincode(); } }}
                placeholder="302001" maxLength={6}
                className={`${INP} disabled:opacity-60 disabled:cursor-not-allowed`} />
              <button type="button" onClick={addManualPincode} disabled={!city || pendingCount > 0}
                className="px-4 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:border-primary hover:text-primary transition disabled:opacity-60 disabled:cursor-not-allowed">
                Add
              </button>
            </div>
          </div>
        </div>

        {city && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Pincodes in {city}
            </label>
            {cityPincodes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No pincodes found for {city} — add one manually above.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {cityPincodes.map(p => {
                  const taken = takenMap[p];
                  return (
                    <button key={p} type="button" disabled={pendingCount > 0 || !!taken}
                      title={taken ? `Already assigned to ${taken}` : undefined}
                      onClick={() => togglePincode(p)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all disabled:cursor-not-allowed
                        ${taken
                          ? 'bg-slate-100 text-slate-300 border-slate-100 line-through'
                          : selectedPincodes.includes(p)
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary disabled:opacity-60'}`}>
                      {selectedPincodes.includes(p) ? '✓ ' : ''}{p}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedPincodes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Selected ({selectedPincodes.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedPincodes.map(p => (
                <span key={p} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {p}
                  <button type="button" onClick={() => removePincode(p)} className="hover:text-rose-500">
                    <span className="material-icons-outlined text-xs">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            Reason <span className="normal-case font-normal text-slate-300">(optional)</span>
          </label>
          <textarea rows={3} value={reason} disabled={pendingCount > 0}
            onChange={e => setReason(e.target.value)}
            placeholder="Why do you need these pincodes? e.g. I get client enquiries from this area..."
            className={`${INP} resize-none disabled:opacity-60 disabled:cursor-not-allowed`} />
        </div>

        {msg.text && (
          <p className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.text}</p>
        )}

        <button type="submit" disabled={submitting || pendingCount > 0}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60">
          {submitting ? 'Submitting…' : 'Submit Pincode Request'}
        </button>
      </form>

      {/* My requests */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-800">My Requests</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-icons-outlined text-3xl animate-spin text-primary">progress_activity</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <span className="material-icons-outlined text-5xl text-slate-200">add_location_alt</span>
            <p className="text-slate-400 mt-3 text-sm">No pincode requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => {
              const s = STATUS[r.status] || STATUS.pending;
              const isEditing = editingId === r._id;
              return (
                <div key={r._id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`material-icons-outlined text-lg ${s.cls.includes('amber') ? 'text-amber-600' : s.cls.includes('emerald') ? 'text-emerald-600' : 'text-rose-500'}`}>{s.icon}</span>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
                        <p className="text-xs text-slate-400 mt-0.5">Requested {fmtDate(r.createdAt)}</p>
                        {r.decidedAt && (
                          <p className="text-xs text-slate-400">Decided {fmtDate(r.decidedAt)} by {r.decidedBy?.name || 'Admin'}</p>
                        )}
                        {r.requestedByMaster && (
                          <p className="text-xs text-slate-400">Distributed by {r.requestedByMaster.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      {r.requestedAreas?.length} pincode{r.requestedAreas?.length !== 1 ? 's' : ''} requested
                      {/* Edit/Cancel buttons for pending */}
                      {r.status === 'pending' && !isEditing && (
                        <div className="flex gap-1 mt-1 justify-end">
                          <button onClick={() => startEdit(r)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition">
                            <span className="material-icons-outlined text-xs align-middle">edit</span> Edit
                          </button>
                          <button onClick={() => handleCancel(r._id)} disabled={cancellingId === r._id}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition disabled:opacity-60">
                            <span className="material-icons-outlined text-xs align-middle">close</span> {cancellingId === r._id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="space-y-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">City</label>
                          <select value={editCity} onChange={e => { setEditCity(e.target.value); setEditSelectedPincodes([]); }}
                            className={`${INP} text-sm`}>
                            <option value="">Select city</option>
                            {RAJASTHAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Add pincode</label>
                          <div className="flex gap-2">
                            <input type="text" value={editManualPincode}
                              onChange={e => setEditManualPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEditManualPincode(); } }}
                              placeholder="302001" maxLength={6}
                              className={`${INP} text-sm`} />
                            <button type="button" onClick={addEditManualPincode}
                              className="px-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:border-primary hover:text-primary transition">
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                      {editCity && editCityPincodes.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Pincodes in {editCity}</label>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                            {editCityPincodes.map(p => {
                              const taken = editTakenMap[p] && !editSelectedPincodes.includes(p);
                              return (
                                <button key={p} type="button" disabled={taken}
                                  title={taken ? `Already assigned to ${editTakenMap[p]}` : undefined}
                                  onClick={() => toggleEditPincode(p)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-all disabled:cursor-not-allowed
                                    ${taken
                                      ? 'bg-slate-100 text-slate-300 border-slate-100 line-through'
                                      : editSelectedPincodes.includes(p) ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                                  {editSelectedPincodes.includes(p) ? '✓ ' : ''}{p}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {editSelectedPincodes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {editSelectedPincodes.map(p => (
                            <span key={p} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {p}
                              <button type="button" onClick={() => setEditSelectedPincodes(prev => prev.filter(x => x !== p))} className="hover:text-rose-500">
                                <span className="material-icons-outlined text-xs">close</span>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Reason</label>
                        <textarea rows={2} value={editReason} onChange={e => setEditReason(e.target.value)}
                          placeholder="Why do you need these pincodes?"
                          className={`${INP} text-sm resize-none`} />
                      </div>
                      {editMsg.text && (
                        <p className={`text-xs ${editMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{editMsg.text}</p>
                      )}
                      <div className="flex gap-2">
                        <button type="submit" disabled={editSubmitting}
                          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container transition disabled:opacity-60">
                          {editSubmitting ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={cancelEdit}
                          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {r.requestedAreas?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {r.requestedAreas.map((a, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                              {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                            </span>
                          ))}
                        </div>
                      )}

                      {r.reason && (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
                          <span className="text-xs font-semibold text-slate-400 block mb-0.5">Reason</span>
                          {r.reason}
                        </p>
                      )}

                      {r.adminNote && (
                        <p className={`text-sm rounded-xl px-3 py-2 ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          <span className="text-xs font-semibold block mb-0.5">Admin Note</span>
                          {r.adminNote}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
