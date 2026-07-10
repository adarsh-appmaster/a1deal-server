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
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PincodeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [city, setCity]                     = useState('');
  const [cityOpen, setCityOpen]              = useState(false);
  const [citySearch, setCitySearch]          = useState('');
  const cityRef                              = useRef(null);

  const [selectedPincodes, setSelectedPincodes] = useState([]);
  const [manualPincode, setManualPincode]       = useState('');
  const [reason, setReason]                     = useState('');
  const [submitting, setSubmitting]             = useState(false);
  const [msg, setMsg]                           = useState({ text: '', ok: true });

  const filteredCities = RAJASTHAN_CITIES.filter(c =>
    c.toLowerCase().includes(citySearch.trim().toLowerCase())
  );
  const cityPincodes = expandPincodesForCity(city);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  useEffect(() => { fetchRequests(); }, []);

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

  function togglePincode(p) {
    setSelectedPincodes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function addManualPincode() {
    const p = manualPincode.trim();
    if (!/^\d{6}$/.test(p)) return;
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
                {cityPincodes.map(p => (
                  <button key={p} type="button" disabled={pendingCount > 0}
                    onClick={() => togglePincode(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed
                      ${selectedPincodes.includes(p)
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                    {selectedPincodes.includes(p) ? '✓ ' : ''}{p}
                  </button>
                ))}
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
              return (
                <div key={r._id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`material-icons-outlined text-lg ${s.cls.includes('amber') ? 'text-amber-600' : s.cls.includes('emerald') ? 'text-emerald-600' : 'text-rose-500'}`}>{s.icon}</span>
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      {r.requestedAreas?.length} pincode{r.requestedAreas?.length !== 1 ? 's' : ''} requested
                    </div>
                  </div>

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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
