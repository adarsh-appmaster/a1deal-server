import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../../api/axios';
import { Pagination } from '../../../components/common/Pagination';
import { STATE_LIST, getCities } from '../../../data/indiaLocations';
import { useAuth } from '../../../context/AuthContext';

const STATUS_BADGE = {
  pending:      { label: 'Pending',       cls: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'Under Review',  cls: 'bg-blue-100 text-blue-700' },
  approved:     { label: 'Approved',      cls: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',      cls: 'bg-rose-100 text-rose-700' },
};
const INQ_BADGE = {
  new:       { label: 'New',       cls: 'bg-violet-100 text-violet-700' },
  assigned:  { label: 'Assigned',  cls: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Contacted', cls: 'bg-sky-100 text-sky-700' },
  converted: { label: 'Accepted',  cls: 'bg-emerald-100 text-emerald-700' },
  rejected:  { label: 'Rejected',  cls: 'bg-rose-100 text-rose-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' },
};
const INP = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 bg-white';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Coverage map hook ─────────────────────────────────────────────────────── */
function useCoverageMap(city, area) {
  const [coverage, setCoverage] = useState([]);
  const [loading, setLoading]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!city?.trim()) { setCoverage([]); return; }
    clearTimeout(ref.current);
    ref.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ city });
        if (area?.trim()) params.set('area', area);
        const { data } = await api.get(`/master-broker/coverage-map?${params}`);
        setCoverage(data.coverage || []);
      } catch { setCoverage([]); }
      setLoading(false);
    }, 400);
  }, [city, area]);

  return { coverage, loading };
}

/* ─── Areas editor used in both modals ──────────────────────────────────────── */
function AreasEditor({ areas, onChange }) {
  const [tempState, setTempState] = useState(STATE_LIST[0] || '');
  const [tempCity, setTempCity]   = useState('');
  const [tempArea, setTempArea]   = useState('');
  const { coverage, loading }     = useCoverageMap(tempCity, tempArea);
  const manualRef                 = useRef(null);
  const editorCities              = getCities(tempState);

  const available = coverage.filter(c => c.available);
  const reserved  = coverage.filter(c => !c.available && c.takenBy?.pending);
  const taken     = coverage.filter(c => !c.available && !c.takenBy?.pending);

  function addArea(pincode) {
    if (!tempCity.trim()) return;
    const existing = areas.find(a => a.city === tempCity && a.area === tempArea && a.pincode === pincode);
    if (!existing) onChange([...areas, { city: tempCity.trim(), area: tempArea.trim(), pincode }]);
  }
  function removeArea(i) { onChange(areas.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <select className={INP} value={tempState}
          onChange={e => { setTempState(e.target.value); setTempCity(''); }}>
          <option value="">Select state…</option>
          {STATE_LIST.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div>
          <input className={INP} placeholder="City" value={tempCity}
            list="areas-editor-cities"
            onChange={e => setTempCity(e.target.value)} />
          <datalist id="areas-editor-cities">
            {editorCities.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>
      <input className={INP} placeholder="Area (optional)" value={tempArea}
        onChange={e => setTempArea(e.target.value)} />

      {/* Coverage map */}
      {tempCity.trim() && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3">
          {loading && <p className="text-xs text-slate-400 animate-pulse">Loading pincodes…</p>}

          {!loading && coverage.length === 0 && (
            <p className="text-xs text-slate-400 italic">No pincodes found — add manually below.</p>
          )}

          {!loading && available.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Available ({available.length})</p>
                <button type="button" onClick={() => available.forEach(c => addArea(c.pincode))}
                  className="ml-auto text-[10px] text-[#4900e5] font-semibold hover:underline">
                  Add all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {available.map(c => {
                  const alreadyAdded = areas.some(a => a.pincode === c.pincode && a.city === tempCity);
                  return (
                    <button type="button" key={c.pincode}
                      onClick={() => !alreadyAdded && addArea(c.pincode)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-2 transition
                        ${alreadyAdded
                          ? 'bg-[#4900e5] text-white border-[#4900e5] cursor-default'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-[#4900e5] hover:bg-[#4900e5]/5'}`}>
                      {alreadyAdded ? '✓ ' : '+ '}{c.pincode}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && reserved.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Reserved — Pending Application ({reserved.length})</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reserved.map(c => (
                  <div key={c.pincode}
                    title={`Reserved for ${c.takenBy?.name || 'a pending applicant'}`}
                    className="px-3 py-1 rounded-full text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-600 cursor-not-allowed flex items-center gap-1">
                    <span className="material-icons-outlined text-[10px]">schedule</span>
                    {c.pincode}
                    {c.takenBy?.name && <span className="text-[9px] text-amber-400">· {c.takenBy.name}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && taken.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Already Taken ({taken.length})</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {taken.map(c => (
                  <div key={c.pincode}
                    title={`Taken by ${c.takenBy?.name || 'a master broker'}`}
                    className="px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed flex items-center gap-1">
                    <span className="material-icons-outlined text-[10px]">lock</span>
                    {c.pincode}
                    {c.takenBy?.name && <span className="text-[9px] text-slate-300">· {c.takenBy.name}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual entry */}
          <div className="flex gap-2 pt-1 border-t border-slate-200">
            <input ref={manualRef} className={INP} placeholder="Add pincode manually" maxLength={10}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addArea(manualRef.current.value.trim());
                  manualRef.current.value = '';
                }
              }} />
            <button type="button"
              onClick={() => { addArea(manualRef.current.value.trim()); manualRef.current.value = ''; }}
              className="px-3 py-2 rounded-xl bg-[#4900e5] text-white text-xs font-semibold whitespace-nowrap hover:bg-[#6236ff] transition">
              Add
            </button>
          </div>
        </div>
      )}

      {/* Added areas tags */}
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.map((a, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
              {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
              <button type="button" onClick={() => removeArea(i)} className="hover:text-rose-500 ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
export default function MasterBrokerRequests() {
  const { user: me }          = useAuth();
  const [mainTab, setMainTab] = useState('signups');

  // Signups state
  const [signups, setSignups]               = useState([]);
  const [signupsLoading, setSignupsLoading] = useState(false);
  const [signupSearch, setSignupSearch]     = useState('');
  const [signupPage, setSignupPage]         = useState(1);
  const [selSignup, setSelSignup]           = useState(null);
  const [signupAssignId, setSignupAssignId] = useState('');
  const [signupNote, setSignupNote]         = useState('');
  const [signupWorking, setSignupWorking]   = useState(false);
  const [signupMsg, setSignupMsg]           = useState({ text: '', ok: true });

  // Applications state
  const [requests, setRequests]   = useState([]);
  const [visitors, setVisitors]   = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqTab, setReqTab]       = useState('all');
  const [reqSearch, setReqSearch] = useState('');
  const [reqPage, setReqPage]     = useState(1);
  const [selected, setSelected]   = useState(null);

  // Manage modal state
  const [assignVisitorId, setAssignVisitorId] = useState('');
  const [decisionNote, setDecisionNote]       = useState('');
  const [decidePincodeLimit, setDecidePincodeLimit] = useState('');
  const [editAreas, setEditAreas]             = useState([]);
  const [editingAreas, setEditingAreas]       = useState(false);
  const [working, setWorking]                 = useState(false);
  const [appMsg, setAppMsg]                   = useState('');

  // Expansion requests state
  const [expansions, setExpansions]         = useState([]);
  const [expLoading, setExpLoading]         = useState(false);
  const [selExp, setSelExp]                 = useState(null);
  const [expNote, setExpNote]               = useState('');
  const [expNewLimit, setExpNewLimit]       = useState('');
  const [expWorking, setExpWorking]         = useState(false);
  const [expMsg, setExpMsg]                 = useState({ text: '', ok: true });

  // Inquiries state
  const [inquiries, setInquiries]     = useState([]);
  const [inqLoading, setInqLoading]   = useState(true);
  const [inqTab, setInqTab]           = useState('all');
  const [inqSearch, setInqSearch]     = useState('');
  const [inqPage, setInqPage]         = useState(1);
  const [selInq, setSelInq]           = useState(null);
  const [inqAssignId, setInqAssignId] = useState('');
  const [inqNote, setInqNote]         = useState('');
  const [inqWorking, setInqWorking]   = useState(false);
  const [inqMsg, setInqMsg]           = useState({ text: '', ok: true });
  const [reactivateNewPassword, setReactivateNewPassword] = useState(true);

  const PER_PAGE = 10;
  const [loadError, setLoadError] = useState('');

  useEffect(() => { fetchRequests(); fetchVisitors(); }, []);
  useEffect(() => { if (mainTab === 'inquiries') fetchInquiries(); }, [mainTab]);
  useEffect(() => { if (mainTab === 'signups') fetchSignups(); }, [mainTab]);
  useEffect(() => { if (mainTab === 'expansions') fetchExpansions(); }, [mainTab]);

  async function fetchSignups() {
    setSignupsLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/master-broker/inquiries');
      setSignups(data.inquiries || []);
    } catch (err) {
      console.error('[MasterBroker] fetchSignups:', err?.response?.status, err?.response?.data || err.message);
      setLoadError(err.response?.data?.message || `Failed to load data (${err.response?.status || 'network error'}).`);
    }
    setSignupsLoading(false);
  }

  function openSignupReview(inq) {
    setSelSignup(inq);
    setSignupAssignId(inq.assignedTo?._id || '');
    setSignupNote(inq.adminNote || '');
    setSignupMsg({ text: '', ok: true });
  }

  function patchSignupLocal(updated) {
    setSelSignup(updated);
    setSignups(prev => prev.map(i => i._id === updated._id ? updated : i));
  }

  async function doSignupAssign() {
    if (!signupAssignId) return;
    setSignupWorking(true);
    try {
      const { data } = await api.patch(`/master-broker/inquiries/${selSignup._id}/assign`, { assignedTo: signupAssignId });
      setSignupMsg({ text: 'Assigned successfully.', ok: true });
      patchSignupLocal(data.inquiry);
    } catch (err) {
      setSignupMsg({ text: err.response?.data?.message || 'Assignment failed.', ok: false });
    }
    setSignupWorking(false);
  }

  async function doSignupDecide(status) {
    setSignupWorking(true);
    try {
      const { data } = await api.patch(`/master-broker/inquiries/${selSignup._id}`, {
        status,
        adminNote: signupNote,
      });
      setSignupMsg({ text: status === 'converted' ? 'Approved — user will be notified.' : 'Rejected.', ok: true });
      patchSignupLocal(data.inquiry);
    } catch (err) {
      setSignupMsg({ text: err.response?.data?.message || 'Action failed.', ok: false });
    }
    setSignupWorking(false);
  }

  async function fetchRequests() {
    setReqLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/master-broker/requests');
      setRequests(data.requests || []);
    } catch (err) {
      console.error('[MasterBroker] fetchRequests:', err?.response?.status, err?.response?.data || err.message);
      setLoadError(err.response?.data?.message || `Failed to load data (${err.response?.status || 'network error'}).`);
    }
    setReqLoading(false);
  }

  async function fetchVisitors() {
    try {
      const { data } = await api.get('/users?role=team');
      setVisitors(Array.isArray(data) ? data : (data.users || []));
    } catch { /* empty */ }
  }

  async function fetchInquiries() {
    setInqLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/master-broker/inquiries');
      setInquiries(data.inquiries || []);
    } catch (err) {
      console.error('[MasterBroker] fetchInquiries:', err?.response?.status, err?.response?.data || err.message);
      setLoadError(err.response?.data?.message || `Failed to load data (${err.response?.status || 'network error'}).`);
    }
    setInqLoading(false);
  }

  async function fetchExpansions() {
    setExpLoading(true);
    try {
      const { data } = await api.get('/master-broker/expansions');
      setExpansions(data.requests || []);
    } catch { /* empty */ }
    setExpLoading(false);
  }

  function openExpansion(req) {
    setSelExp(req);
    setExpNote('');
    setExpNewLimit(req.broker?.approvedPincodeLimit ?? '');
    setExpMsg({ text: '', ok: true });
  }

  async function doDecideExpansion(decision) {
    setExpWorking(true);
    try {
      const { data } = await api.patch(`/master-broker/expansions/${selExp._id}/decide`, {
        decision,
        adminNote: expNote,
        newLimit: expNewLimit !== '' ? Number(expNewLimit) : undefined,
      });
      setExpMsg({ text: `Request ${decision}.`, ok: true });
      setExpansions(prev => prev.map(r => r._id === data.request._id ? data.request : r));
      setSelExp(data.request);
    } catch (err) {
      setExpMsg({ text: err.response?.data?.message || 'Failed.', ok: false });
    }
    setExpWorking(false);
  }

  // ── Application actions ───────────────────────────────────────────────────
  function openManage(r) {
    setSelected(r);
    setAssignVisitorId(r.assignedVisitor?._id || '');
    setDecisionNote(r.adminNote || '');
    setEditAreas(r.requestedAreas || []);
    setEditingAreas(false);
    setAppMsg('');
  }

  async function doAssign() {
    if (!assignVisitorId) return;
    setWorking(true);
    try {
      await api.patch(`/master-broker/${selected._id}/assign`, { visitorId: assignVisitorId });
      setAppMsg('Team member assigned.');
      fetchRequests(); setSelected(null);
    } catch (err) { setAppMsg(err.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  async function doSaveAreas() {
    setWorking(true);
    try {
      const { data } = await api.patch(`/master-broker/${selected._id}/edit-areas`, { requestedAreas: editAreas });
      setAppMsg('Areas updated.');
      setRequests(prev => prev.map(r => r._id === selected._id ? { ...r, requestedAreas: data.request.requestedAreas } : r));
      setSelected(prev => ({ ...prev, requestedAreas: data.request.requestedAreas }));
      setEditingAreas(false);
    } catch (err) { setAppMsg(err.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  async function doDecide(decision) {
    setWorking(true);
    try {
      await api.patch(`/master-broker/${selected._id}/decide`, {
        decision,
        adminNote: decisionNote,
        pincodeLimit: decidePincodeLimit !== '' ? Number(decidePincodeLimit) : undefined,
      });
      setAppMsg(`Request ${decision}.`);
      fetchRequests(); setSelected(null);
    } catch (err) { setAppMsg(err.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  async function doMarkPaid() {
    setWorking(true);
    try {
      await api.patch(`/master-broker/${selected._id}/mark-paid`);
      setAppMsg('₹50,000 subscription marked as paid.');
      fetchRequests(); setSelected(null);
    } catch (err) { setAppMsg(err.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  async function doSyncUser() {
    setWorking(true);
    try {
      const { data } = await api.patch(`/master-broker/${selected._id}/sync-user`);
      setAppMsg(data.message || 'Broker account synced to master tier.');
    } catch (err) { setAppMsg(err.response?.data?.message || 'Sync failed.'); }
    setWorking(false);
  }

  // ── Inquiry actions ───────────────────────────────────────────────────────
  function openInquiry(inq) {
    setSelInq(inq);
    setInqAssignId(inq.assignedTo?._id || '');
    setInqNote(inq.adminNote || '');
    setInqMsg({ text: '', ok: true });
    setReactivateNewPassword(true);
  }

  function patchInqLocal(updated) {
    setSelInq(updated);
    setInquiries(prev => prev.map(i => i._id === updated._id ? updated : i));
  }

  async function doAssignInquiry() {
    if (!inqAssignId) return;
    setInqWorking(true);
    try {
      const { data } = await api.patch(`/master-broker/inquiries/${selInq._id}/assign`, { assignedTo: inqAssignId });
      setInqMsg({ text: data.message, ok: true });
      patchInqLocal(data.inquiry);
    } catch (err) { setInqMsg({ text: err.response?.data?.message || 'Failed.', ok: false }); }
    setInqWorking(false);
  }

  async function doInquiryAction(status) {
    setInqWorking(true);
    try {
      const payload = { status, adminNote: inqNote };
      const { data } = await api.patch(`/master-broker/inquiries/${selInq._id}`, payload);
      setInqMsg({ text: data.message, ok: true });
      patchInqLocal(data.inquiry);
    } catch (err) { setInqMsg({ text: err.response?.data?.message || 'Failed.', ok: false }); }
    setInqWorking(false);
  }

  async function doReactivateInquiry() {
    setInqWorking(true);
    try {
      const { data } = await api.patch(`/master-broker/inquiries/${selInq._id}/reactivate`, {
        generateNewPassword: reactivateNewPassword,
        adminNote: inqNote,
      });
      setInqMsg({ text: data.message, ok: true });
      patchInqLocal(data.inquiry);
    } catch (err) { setInqMsg({ text: err.response?.data?.message || 'Failed.', ok: false }); }
    setInqWorking(false);
  }

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredReqs = useMemo(() => {
    let r = requests;
    if (reqTab !== 'all') r = r.filter(x => x.status === reqTab);
    if (reqSearch.trim()) {
      const t = reqSearch.toLowerCase();
      r = r.filter(x => x.broker?.name?.toLowerCase().includes(t) || x.broker?.email?.toLowerCase().includes(t) || x.broker?.phone?.includes(t));
    }
    return r;
  }, [requests, reqTab, reqSearch]);

  const filteredInqs = useMemo(() => {
    let r = inquiries;
    if (inqTab !== 'all') r = r.filter(x => x.status === inqTab);
    if (inqSearch.trim()) {
      const t = inqSearch.toLowerCase();
      r = r.filter(x => x.name?.toLowerCase().includes(t) || x.email?.toLowerCase().includes(t) || x.phone?.includes(t));
    }
    return r;
  }, [inquiries, inqTab, inqSearch]);

  const reqPageData  = filteredReqs.slice((reqPage - 1) * PER_PAGE, reqPage * PER_PAGE);
  const reqPages     = Math.ceil(filteredReqs.length / PER_PAGE);
  const inqPageData  = filteredInqs.slice((inqPage - 1) * PER_PAGE, inqPage * PER_PAGE);
  const inqPages     = Math.ceil(filteredInqs.length / PER_PAGE);

  const filteredSignups = useMemo(() => {
    if (!signupSearch.trim()) return signups;
    const t = signupSearch.toLowerCase();
    return signups.filter(u =>
      u.name?.toLowerCase().includes(t) ||
      u.email?.toLowerCase().includes(t) ||
      u.phone?.includes(t) ||
      u.requestedAreas?.some(a => a.city?.toLowerCase().includes(t) || a.pincode?.includes(t))
    );
  }, [signups, signupSearch]);
  const signupPageData = filteredSignups.slice((signupPage - 1) * PER_PAGE, signupPage * PER_PAGE);
  const signupPages    = Math.ceil(filteredSignups.length / PER_PAGE);

  // Criteria checklist for approval
  const criteria = selected ? [
    { ok: !!selected.requestedAreas?.length,   label: 'Coverage areas defined' },
    { ok: !!selected.assignedVisitor,          label: 'Field visit assigned' },
    { ok: !!selected.visitorReport,            label: 'Field report submitted' },
    { ok: !!selected.subscriptionPaid,         label: '₹50,000 payment received' },
  ] : [];
  const criteriaAllMet = criteria.every(c => c.ok);

  // ── Steps for approval workflow ────────────────────────────────────────────
  function getStep(r) {
    if (!r) return 0;
    if (r.status === 'approved') return 4;
    if (r.status === 'rejected') return 4;
    if (r.subscriptionPaid)      return 3; // payment done, ready to approve
    if (r.assignedVisitor)       return 2; // visit assigned
    return 1; // new / just applied
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Master Broker</h1>
          <p className="text-on-surface-variant text-sm">{signups.length} signups · {requests.length} applications · {inquiries.length} inquiries</p>
        </div>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <span className="material-icons-outlined text-base flex-shrink-0">error_outline</span>
          <span className="flex-1">{loadError}</span>
          <button onClick={() => { fetchRequests(); if (mainTab === 'inquiries') fetchInquiries(); if (mainTab === 'signups') fetchSignups(); }}
            className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Main tabs */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {[
          { key: 'signups',      label: 'Signups',           icon: 'person_add',       count: signups.length },
          { key: 'applications', label: 'Applications',      icon: 'assignment',       count: requests.length },
          { key: 'inquiries',    label: 'Public Inquiries',  icon: 'contact_mail',     count: inquiries.length },
          { key: 'expansions',   label: 'Pincode Expansions', icon: 'add_location_alt', count: expansions.filter(r => r.status === 'pending').length },
        ].map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap
              ${mainTab === t.key ? 'border-[#4900e5] text-[#4900e5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <span className="material-icons-outlined text-base">{t.icon}</span>
            {t.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${mainTab === t.key ? 'bg-[#4900e5] text-white' : 'bg-slate-100 text-slate-500'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ══ SIGNUPS TAB ═══════════════════════════════════════════════════════ */}
      {mainTab === 'signups' && (
        <>
          <input value={signupSearch} onChange={e => { setSignupSearch(e.target.value); setSignupPage(1); }}
            placeholder="Search by name, email or phone…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 bg-white" />

          {signupsLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-icons-outlined text-3xl animate-spin text-[#4900e5]">progress_activity</span>
            </div>
          ) : filteredSignups.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <span className="material-icons-outlined text-4xl text-slate-200">person_add</span>
              <p className="text-slate-400 mt-2 text-sm">No master broker signups yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signupPageData.map(inq => {
                const badge = INQ_BADGE[inq.status] || INQ_BADGE['new'];
                return (
                  <div key={inq._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800">{inq.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                        {inq.assignedTo && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            <span className="material-icons-outlined text-xs">person_check</span>
                            {inq.assignedTo.name || 'Assigned'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{inq.email}{inq.phone ? ` · ${inq.phone}` : ''}</p>
                      {inq.requestedAreas?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {inq.requestedAreas.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              {[a.city, a.area, a.pincode].filter(Boolean).join(' / ') || 'Zone TBD'}
                            </span>
                          ))}
                        </div>
                      )}
                      {inq.motivation && <p className="text-xs text-slate-400 italic">{inq.motivation}</p>}
                      <p className="text-xs text-slate-400">Signed up: {fmtDate(inq.createdAt)}</p>
                    </div>
                    <button onClick={() => openSignupReview(inq)}
                      className="px-4 py-2 rounded-xl bg-[#4900e5] text-white text-xs font-semibold hover:bg-[#6236ff] transition flex-shrink-0">
                      Review
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <Pagination currentPage={signupPage} totalPages={signupPages} totalItems={filteredSignups.length} itemsPerPage={PER_PAGE} onPageChange={setSignupPage} />
        </>
      )}

      {/* ══ SIGNUP REVIEW MODAL ═══════════════════════════════════════════════ */}
      {selSignup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelSignup(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-montserrat font-bold text-lg text-slate-800">Master Broker Signup</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {(() => { const b = INQ_BADGE[selSignup.status]; return b ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.cls}`}>{b.label}</span>
                  ) : null; })()}
                </div>
              </div>
              <button onClick={() => setSelSignup(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Name</p>
                  <p className="font-semibold text-slate-800">{selSignup.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Phone</p>
                  <a href={`tel:${selSignup.phone}`} className="text-slate-700 hover:text-[#4900e5]">{selSignup.phone || '—'}</a>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Email</p>
                  <a href={`mailto:${selSignup.email}`} className="text-slate-700 hover:text-[#4900e5] text-sm">{selSignup.email}</a>
                </div>
              </div>

              {/* Requested zone */}
              {selSignup.requestedAreas?.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <span className="material-icons-outlined text-sm">location_on</span>Requested Zone
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selSignup.requestedAreas.map((a, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
                        {[a.city, a.area, a.pincode].filter(Boolean).join(' / ') || 'Zone TBD'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selSignup.motivation && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-slate-600">{selSignup.motivation}</p>
                </div>
              )}

              {/* ── Step 1: Assign team member ── */}
              <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${selSignup.assignedTo ? 'bg-[#4900e5] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {selSignup.assignedTo ? '✓' : '1'}
                  </div>
                  <p className="font-semibold text-slate-700 text-sm">Assign for Verification</p>
                  {selSignup.assignedTo && (
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {selSignup.assignedTo.role === 'admin' ? 'Admin (self)' : selSignup.assignedTo.name}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <select value={signupAssignId} onChange={e => setSignupAssignId(e.target.value)} className={INP}>
                    <option value="">— Who will verify this person? —</option>
                    <optgroup label="Self">
                      <option value="self">Myself — {me?.name || 'Admin'} (I will verify)</option>
                    </optgroup>
                    {visitors.length > 0 && (
                      <optgroup label="Team Members">
                        {visitors.map(v => (
                          <option key={v._id} value={v._id}>{v.name} · {v.email}</option>
                        ))}
                      </optgroup>
                    )}
                    {visitors.length === 0 && <option disabled>No team members found</option>}
                  </select>
                  <button onClick={doSignupAssign} disabled={signupWorking || !signupAssignId}
                    className="px-4 py-2 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-60 whitespace-nowrap">
                    Assign
                  </button>
                </div>
              </div>

              {/* ── Step 2: Approve / Reject ── */}
              {!['converted', 'rejected', 'cancelled'].includes(selSignup.status) && (
                <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">2</div>
                    <p className="font-semibold text-slate-700 text-sm">Decision</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Admin Note (optional, sent in email)</label>
                    <textarea rows={2} value={signupNote} onChange={e => setSignupNote(e.target.value)}
                      placeholder="Reason or next steps for the applicant…"
                      className={`${INP} resize-none`} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => doSignupDecide('rejected')} disabled={signupWorking}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition disabled:opacity-60 flex items-center justify-center gap-1">
                      <span className="material-icons-outlined text-base">cancel</span> Reject
                    </button>
                    <button onClick={() => doSignupDecide('converted')} disabled={signupWorking}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-1">
                      <span className="material-icons-outlined text-base">verified</span> Approve
                    </button>
                  </div>
                </div>
              )}

              {/* Final state */}
              {selSignup.status === 'converted' && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-semibold text-sm">
                  <span className="material-icons-outlined">verified</span> Approved — user notified.
                </div>
              )}
              {selSignup.status === 'rejected' && (
                <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 font-semibold text-sm">
                  <span className="material-icons-outlined">cancel</span> Rejected.
                </div>
              )}

              {signupMsg.text && (
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold
                  ${signupMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-600'}`}>
                  <span className="material-icons-outlined text-sm">{signupMsg.ok ? 'check_circle' : 'error_outline'}</span>
                  {signupMsg.text}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <button onClick={() => setSelSignup(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ APPLICATIONS TAB ═══════════════════════════════════════════════════ */}
      {mainTab === 'applications' && (
        <>
          {/* Status filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all','pending','under_review','approved','rejected'].map(s => (
              <button key={s} onClick={() => { setReqTab(s); setReqPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition capitalize
                  ${reqTab === s ? 'bg-[#4900e5] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {s === 'under_review' ? 'Under Review' : s === 'all' ? `All (${requests.length})` : s}
              </button>
            ))}
          </div>

          <input value={reqSearch} onChange={e => { setReqSearch(e.target.value); setReqPage(1); }}
            placeholder="Search by name, email or phone…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 bg-white" />

          {reqLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-icons-outlined text-3xl animate-spin text-[#4900e5]">progress_activity</span>
            </div>
          ) : filteredReqs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <span className="material-icons-outlined text-4xl text-slate-200">assignment</span>
              <p className="text-slate-400 mt-2 text-sm">No applications in this category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reqPageData.map(r => {
                const badge = STATUS_BADGE[r.status] || {};
                const step  = getStep(r);
                return (
                  <div key={r._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800">{r.broker?.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                        {r.subscriptionPaid && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">₹50k Paid</span>}
                      </div>
                      <p className="text-sm text-slate-500">{r.broker?.email} · {r.broker?.phone}</p>
                      {r.requestedAreas?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {r.requestedAreas.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#4900e5]/10 text-[#4900e5] rounded-full text-xs">
                              {[a.city, a.area, a.pincode].filter(Boolean).join('/')}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Step indicator */}
                      <div className="flex items-center gap-1 mt-1">
                        {['Applied','Visit','Payment','Decision'].map((s, i) => (
                          <div key={s} className="flex items-center gap-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                              ${step > i ? 'bg-[#4900e5] text-white' : step === i ? 'bg-[#4900e5]/20 text-[#4900e5] border border-[#4900e5]/40' : 'bg-slate-100 text-slate-400'}`}>
                              {step > i ? '✓' : i + 1}
                            </div>
                            {i < 3 && <div className={`w-6 h-0.5 ${step > i ? 'bg-[#4900e5]' : 'bg-slate-200'}`} />}
                            <span className={`text-[10px] ${step >= i ? 'text-[#4900e5]' : 'text-slate-300'}`}>{s}</span>
                            {i < 3 && <div className="w-2" />}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => openManage(r)} className="px-4 py-2 rounded-xl bg-[#4900e5] text-white text-xs font-semibold hover:bg-[#6236ff] transition flex-shrink-0">
                      Manage
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <Pagination currentPage={reqPage} totalPages={reqPages} totalItems={filteredReqs.length} itemsPerPage={PER_PAGE} onPageChange={setReqPage} />
        </>
      )}

      {/* ══ INQUIRIES TAB ═════════════════════════════════════════════════════ */}
      {mainTab === 'inquiries' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',       label: `All (${inquiries.length})` },
              { key: 'new',       label: 'New' },
              { key: 'assigned',  label: 'Assigned' },
              { key: 'contacted', label: 'Contacted' },
              { key: 'converted', label: 'Accepted' },
              { key: 'rejected',  label: 'Rejected' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map(s => (
              <button key={s.key} onClick={() => { setInqTab(s.key); setInqPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition
                  ${inqTab === s.key ? 'bg-[#4900e5] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {s.label}
              </button>
            ))}
          </div>

          <input value={inqSearch} onChange={e => { setInqSearch(e.target.value); setInqPage(1); }}
            placeholder="Search by name, email or phone…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 bg-white" />

          {inqLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-icons-outlined text-3xl animate-spin text-[#4900e5]">progress_activity</span>
            </div>
          ) : filteredInqs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <span className="material-icons-outlined text-4xl text-slate-200">contact_mail</span>
              <p className="text-slate-400 mt-2 text-sm">No inquiries yet.</p>
              <p className="text-slate-300 text-xs mt-1">Public interest forms from the homepage will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inqPageData.map(inq => {
                const badge = INQ_BADGE[inq.status] || {};
                return (
                  <div key={inq._id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800">{inq.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="text-sm text-slate-500">{inq.email} · {inq.phone}</p>
                      {inq.requestedAreas?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {inq.requestedAreas.map((a, i) => (
                            <span key={i} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">
                              {[a.city, a.area, a.pincode].filter(Boolean).join('/')}
                            </span>
                          ))}
                        </div>
                      )}
                      {inq.assignedTo && (
                        <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <span className="material-icons-outlined text-sm">person_check</span>
                          {inq.assignedTo.role === 'admin' ? 'Admin (self)' : inq.assignedTo.name}
                        </span>
                      )}
                      <p className="text-xs text-slate-400">Received: {fmtDate(inq.createdAt)}</p>
                    </div>
                    <button onClick={() => openInquiry(inq)} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition flex-shrink-0">
                      Handle
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <Pagination currentPage={inqPage} totalPages={inqPages} totalItems={filteredInqs.length} itemsPerPage={PER_PAGE} onPageChange={setInqPage} />
        </>
      )}

      {/* ══ APPLICATION MANAGE MODAL ══════════════════════════════════════════ */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="font-montserrat font-bold text-lg text-slate-800">Manage Application</h2>
                <p className="text-sm text-slate-400">{selected.broker?.name} · {selected.broker?.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {appMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{appMsg}</div>
              )}

              {/* Criteria checklist */}
              <div className="grid grid-cols-2 gap-2">
                {criteria.map(c => (
                  <div key={c.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
                    ${c.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-slate-50 border border-slate-200 text-slate-400'}`}>
                    <span className={`material-icons-outlined text-sm ${c.ok ? 'text-emerald-500' : 'text-slate-300'}`}>
                      {c.ok ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    {c.label}
                  </div>
                ))}
              </div>

              {/* Motivation */}
              {selected.motivation && (
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Motivation</p>
                  <p className="text-sm text-slate-700">{selected.motivation}</p>
                </div>
              )}

              {/* Coverage areas — editable */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Coverage Areas</p>
                  {!editingAreas ? (
                    <button onClick={() => setEditingAreas(true)}
                      className="flex items-center gap-1 text-xs text-[#4900e5] font-semibold hover:underline">
                      <span className="material-icons-outlined text-sm">edit</span> Edit Areas
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingAreas(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                      <button onClick={doSaveAreas} disabled={working}
                        className="text-xs font-semibold text-white bg-[#4900e5] px-3 py-1 rounded-lg hover:bg-[#6236ff] transition disabled:opacity-60">
                        Save Areas
                      </button>
                    </div>
                  )}
                </div>
                {editingAreas ? (
                  <AreasEditor areas={editAreas} onChange={setEditAreas} />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selected.requestedAreas?.length ? selected.requestedAreas.map((a, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
                        {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                      </span>
                    )) : <span className="text-slate-400 text-sm">No areas defined</span>}
                  </div>
                )}
              </div>

              {/* ── STEP 1: Assign field visitor ── */}
              {['pending', 'under_review'].includes(selected.status) && (
                <div className="border border-slate-100 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${selected.assignedVisitor ? 'bg-[#4900e5] text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {selected.assignedVisitor ? '✓' : '1'}
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">Field Visit</p>
                    {selected.assignedVisitor ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="material-icons-outlined text-sm">person_check</span>
                        {selected.assignedVisitor.role === 'admin' ? 'Admin (Self)' : selected.assignedVisitor.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Not yet assigned</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <select value={assignVisitorId} onChange={e => setAssignVisitorId(e.target.value)} className={INP}>
                      <option value="">— Select who will visit —</option>
                      <optgroup label="Self">
                        <option value="self">Myself — {me?.name || 'Admin'} (I will visit)</option>
                      </optgroup>
                      {visitors.length > 0 && (
                        <optgroup label="Team Members">
                          {visitors.map(v => (
                            <option key={v._id} value={v._id}>{v.name} · {v.email}</option>
                          ))}
                        </optgroup>
                      )}
                      {visitors.length === 0 && (
                        <option disabled>No team members found</option>
                      )}
                    </select>
                    <button onClick={doAssign} disabled={working || !assignVisitorId}
                      className="px-4 py-2 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-60 whitespace-nowrap">
                      Assign
                    </button>
                  </div>

                  {selected.assignedVisitor && !selected.visitorReport && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
                      <span className="material-icons-outlined text-sm text-amber-400">schedule</span>
                      Waiting for the visitor to submit their field report.
                    </div>
                  )}

                  {selected.visitorReport && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Field Report</p>
                      <p className="text-sm text-blue-800">{selected.visitorReport}</p>
                      <p className="text-xs text-blue-400 mt-1">Submitted: {fmtDate(selected.visitorReviewedAt)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: Payment ── */}
              {selected.status !== 'rejected' && (
                <div className={`border rounded-2xl p-5 space-y-3 ${selected.subscriptionPaid ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${selected.subscriptionPaid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {selected.subscriptionPaid ? '✓' : '2'}
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">₹50,000 Programme Fee</p>
                  </div>
                  {selected.subscriptionPaid ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                      <span className="material-icons-outlined text-emerald-500">check_circle</span>
                      Payment received on {fmtDate(selected.subscriptionPaidAt)}
                    </div>
                  ) : (
                    <button onClick={doMarkPaid} disabled={working}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
                      <span className="material-icons-outlined text-base">payments</span>
                      Mark ₹50,000 as Collected
                    </button>
                  )}
                </div>
              )}

              {/* ── STEP 3: Approve / Reject ── */}
              {['pending', 'under_review'].includes(selected.status) && (
                <div className="border border-slate-100 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">3</div>
                    <p className="font-semibold text-slate-700 text-sm">Final Decision</p>
                    {!criteriaAllMet && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {criteria.filter(c => !c.ok).length} criteria pending
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Approved Pincode Limit (optional)</label>
                    <input type="number" min="1" value={decidePincodeLimit}
                      onChange={e => setDecidePincodeLimit(e.target.value)}
                      placeholder="e.g. 5 (leave blank = unlimited)"
                      className={INP} />
                    <p className="text-xs text-slate-400 mt-1">Sets the max pincodes this master broker can hold. They can request more later.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Admin Note (shown to broker)</label>
                    <textarea rows={2} value={decisionNote} onChange={e => setDecisionNote(e.target.value)}
                      placeholder="Reason for approval or rejection…"
                      className={`${INP} resize-none`} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => doDecide('approved')} disabled={working || !criteriaAllMet}
                      title={criteriaAllMet ? '' : 'Complete all criteria before approving'}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
                      <span className="material-icons-outlined text-base">verified</span> Approve
                    </button>
                    <button onClick={() => doDecide('rejected')} disabled={working}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition disabled:opacity-60">
                      Reject
                    </button>
                  </div>
                  {!criteriaAllMet && (
                    <p className="text-xs text-amber-600 text-center">
                      Complete: {criteria.filter(c => !c.ok).map(c => c.label).join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Approved / Rejected — Change Decision */}
              {(selected.status === 'approved' || selected.status === 'rejected') && (
                <div className={`border rounded-2xl p-5 space-y-3 ${
                  selected.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`material-icons-outlined text-2xl ${
                      selected.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {selected.status === 'approved' ? 'verified' : 'cancel'}
                    </span>
                    <div>
                      <p className={`font-semibold text-sm ${
                        selected.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {selected.status === 'approved' ? 'Approved' : 'Rejected'} on {fmtDate(selected.decidedAt)}
                      </p>
                      {selected.adminNote && (
                        <p className={`text-xs mt-0.5 ${
                          selected.status === 'approved' ? 'text-emerald-600' : 'text-rose-500'
                        }`}>{selected.adminNote}</p>
                      )}
                    </div>
                  </div>

                  {/* Sync button — fixes accounts approved before the automatic brokerTier upgrade was in place */}
                  {selected.status === 'approved' && (
                    <button onClick={doSyncUser} disabled={working}
                      className="w-full py-2 rounded-xl border-2 border-emerald-400 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition disabled:opacity-60 flex items-center justify-center gap-2">
                      <span className="material-icons-outlined text-base">sync</span>
                      Sync Master Broker Status to Account
                    </button>
                  )}

                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Change Decision</p>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Admin Note</label>
                      <textarea rows={2} value={decisionNote} onChange={e => setDecisionNote(e.target.value)}
                        placeholder="Reason for changing decision…" className={`${INP} resize-none`} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => doDecide('approved')} disabled={working}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-1">
                        <span className="material-icons-outlined text-base">verified</span> Approve
                      </button>
                      <button onClick={() => doDecide('rejected')} disabled={working}
                        className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition disabled:opacity-60 flex items-center justify-center gap-1">
                        <span className="material-icons-outlined text-base">cancel</span> Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ INQUIRY HANDLE MODAL ══════════════════════════════════════════════ */}
      {selInq && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelInq(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="font-montserrat font-bold text-lg text-slate-800">Public Inquiry</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {(() => { const b = INQ_BADGE[selInq.status]; return b ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.cls}`}>{b.label}</span>
                  ) : null; })()}
                  {selInq.assignedTo && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <span className="material-icons-outlined text-sm">person_check</span>
                      {selInq.assignedTo.role === 'admin' ? 'Admin (self)' : selInq.assignedTo.name}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelInq(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Name</p>
                  <p className="font-semibold text-slate-800">{selInq.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Phone</p>
                  <a href={`tel:${selInq.phone}`} className="text-slate-700 hover:text-[#4900e5]">{selInq.phone}</a>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Email</p>
                  <a href={`mailto:${selInq.email}`} className="text-slate-700 hover:text-[#4900e5] text-xs truncate block">{selInq.email}</a>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Received</p>
                  <p className="text-slate-600 text-sm">{fmtDate(selInq.createdAt)}</p>
                </div>
              </div>

              {/* Motivation */}
              {selInq.motivation && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Their Message</p>
                  <p className="text-sm text-slate-700">{selInq.motivation}</p>
                </div>
              )}

              {/* Requested areas */}
              {selInq.requestedAreas?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Requested Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {selInq.requestedAreas.map((a, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                        {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Section 1: Assign for follow-up ── */}
              {!['converted','rejected','cancelled'].includes(selInq.status) && (
                <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${selInq.assignedTo ? 'bg-[#4900e5] text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {selInq.assignedTo ? '✓' : '1'}
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">Assign for Follow-up</p>
                    {selInq.assignedTo && (
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {selInq.assignedTo.role === 'admin' ? 'Admin (self)' : selInq.assignedTo.name}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select value={inqAssignId} onChange={e => setInqAssignId(e.target.value)} className={INP}>
                      <option value="">— Who will follow up? —</option>
                      <optgroup label="Self">
                        <option value="self">Myself — {me?.name || 'Admin'} (I will contact)</option>
                      </optgroup>
                      {visitors.length > 0 && (
                        <optgroup label="Team Members">
                          {visitors.map(v => (
                            <option key={v._id} value={v._id}>{v.name} · {v.email}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <button onClick={doAssignInquiry} disabled={inqWorking || !inqAssignId}
                      className="px-4 py-2 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-60 whitespace-nowrap">
                      Assign
                    </button>
                  </div>
                </div>
              )}

              {/* ── Section 2: Mark as Contacted ── */}
              {['assigned'].includes(selInq.status) && (
                <div className="border border-slate-100 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">2</div>
                    <p className="font-semibold text-slate-700 text-sm">Mark Contacted</p>
                  </div>
                  <button onClick={() => doInquiryAction('contacted')} disabled={inqWorking}
                    className="w-full py-2.5 rounded-xl border-2 border-sky-500 text-sky-600 font-bold text-sm hover:bg-sky-50 transition disabled:opacity-60 flex items-center justify-center gap-2">
                    <span className="material-icons-outlined text-base">phone_in_talk</span>
                    Mark as Contacted
                  </button>
                </div>
              )}

              {/* ── Section 3a: Reactivate Rejected Inquiry ── */}
              {selInq.status === 'rejected' && (
                <div className="border border-rose-200 rounded-2xl p-4 space-y-3 bg-rose-50/30">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-600 flex-shrink-0">
                      <span className="material-icons-outlined text-sm">replay</span>
                    </div>
                    <p className="font-semibold text-rose-700 text-sm">Re-Approve Rejected Inquiry</p>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                    <span className="material-icons-outlined text-sm text-blue-400 flex-shrink-0">mail</span>
                    <span>A reactivation email will be sent to <strong>{selInq.email}</strong>.</span>
                  </div>

                  {/* Password toggle for reactivation */}
                  <label className="flex items-center gap-3 cursor-pointer select-none px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={reactivateNewPassword}
                        onChange={e => setReactivateNewPassword(e.target.checked)}
                      />
                      <div className={`w-9 h-5 rounded-full transition-colors ${reactivateNewPassword ? 'bg-[#4900e5]' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${reactivateNewPassword ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Generate new password</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {reactivateNewPassword
                          ? 'A new password will be generated and emailed to the inquirer.'
                          : 'Account restored with existing password — no new credentials sent.'}
                      </p>
                    </div>
                  </label>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Internal Note (included in email)</label>
                    <textarea rows={2} value={inqNote} onChange={e => setInqNote(e.target.value)}
                      placeholder="Reason for re-approval…" className={`${INP} resize-none`} />
                  </div>

                  <button onClick={doReactivateInquiry} disabled={inqWorking}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                    <span className="material-icons-outlined text-base">replay</span>
                    Reactivate &amp; Approve
                  </button>
                </div>
              )}

              {/* ── Section 3b: Final Decision (non-rejected) ── */}
              {!['converted','rejected','cancelled'].includes(selInq.status) && (
                <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                      {selInq.status === 'contacted' ? '2' : '3'}
                    </div>
                    <p className="font-semibold text-slate-700 text-sm">Final Decision</p>
                  </div>

                  {/* Email notification hint */}
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700">
                    <span className="material-icons-outlined text-sm text-blue-400 flex-shrink-0">mail</span>
                    <span>
                      An email will be sent to <strong>{selInq.email}</strong> on Approve or Reject.
                      {' '}On approval, they'll be prompted to complete signup and set their own password.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Internal Note (included in email)</label>
                    <textarea rows={2} value={inqNote} onChange={e => setInqNote(e.target.value)}
                      placeholder="Reason or notes for this decision…" className={`${INP} resize-none`} />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => doInquiryAction('converted')} disabled={inqWorking}
                      title="Accept and reserve their pincodes in the coverage map"
                      className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition disabled:opacity-60 flex flex-col items-center gap-1">
                      <span className="material-icons-outlined text-base">verified</span>
                      Accept
                    </button>
                    <button onClick={() => doInquiryAction('rejected')} disabled={inqWorking}
                      className="py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition disabled:opacity-60 flex flex-col items-center gap-1">
                      <span className="material-icons-outlined text-base">cancel</span>
                      Reject
                    </button>
                    <button onClick={() => doInquiryAction('cancelled')} disabled={inqWorking}
                      className="py-2.5 rounded-xl bg-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-300 transition disabled:opacity-60 flex flex-col items-center gap-1">
                      <span className="material-icons-outlined text-base">block</span>
                      Cancel
                    </button>
                  </div>

                  {selInq.requestedAreas?.some(a => a.pincode) && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                      <span className="material-icons-outlined text-sm text-amber-500 flex-shrink-0">info</span>
                      <span><strong>Accept</strong> will reserve their pincodes (amber) in the coverage map until they complete a formal broker application.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Final state banners */}
              {selInq.status === 'converted' && (
                <div className="border border-emerald-200 rounded-2xl p-5 space-y-3 bg-emerald-50/30">
                  <div className="flex items-center gap-2">
                    <span className="material-icons-outlined text-2xl text-emerald-500">verified</span>
                    <div>
                      <p className="font-semibold text-emerald-700 text-sm">Accepted</p>
                      <p className="text-xs text-emerald-600">Pincodes reserved in coverage map pending formal application.</p>
                    </div>
                  </div>
                  {selInq.approvalEmailSent && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-semibold">
                      <span className="material-icons-outlined text-sm">mark_email_read</span>
                      Approval email sent to {selInq.email}
                    </div>
                  )}
                  {selInq.adminNote && <p className="text-xs text-emerald-600 italic">{selInq.adminNote}</p>}

                  <div className="border-t border-emerald-200 pt-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Change Decision</p>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Admin Note</label>
                      <textarea rows={2} value={inqNote} onChange={e => setInqNote(e.target.value)}
                        placeholder="Reason for changing decision…" className={`${INP} resize-none`} />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => doInquiryAction('rejected')} disabled={inqWorking}
                        className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition disabled:opacity-60 flex items-center justify-center gap-1">
                        <span className="material-icons-outlined text-base">cancel</span> Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {selInq.status === 'rejected' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-600">
                  <span className="material-icons-outlined text-2xl block mx-auto mb-1">cancel</span>
                  <p className="font-semibold">Rejected</p>
                  {selInq.rejectionEmailSent && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold">
                      <span className="material-icons-outlined text-sm">mark_email_read</span>
                      Rejection email sent to {selInq.email}
                    </div>
                  )}
                  {selInq.adminNote && <p className="text-xs mt-2 italic">{selInq.adminNote}</p>}
                </div>
              )}
              {selInq.status === 'cancelled' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500">
                  <span className="material-icons-outlined text-2xl block mx-auto mb-1">block</span>
                  <p className="font-semibold">Cancelled</p>
                  {selInq.adminNote && <p className="text-xs mt-2 italic">{selInq.adminNote}</p>}
                </div>
              )}

              {/* Feedback message */}
              {inqMsg.text && (
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold
                  ${inqMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-600'}`}>
                  <span className="material-icons-outlined text-sm">{inqMsg.ok ? 'check_circle' : 'error_outline'}</span>
                  {inqMsg.text}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
              <button onClick={() => setSelInq(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EXPANSIONS TAB ════════════════════════════════════════════════════ */}
      {mainTab === 'expansions' && (
        <div className="space-y-4">
          <div className="bg-[#4900e5]/5 border border-[#4900e5]/10 rounded-2xl p-4 text-sm text-slate-600">
            <span className="font-semibold text-[#4900e5]">Pincode Expansion Requests</span> — Master brokers submit these when they need more pincodes beyond their approved limit. Approving merges the new areas into their coverageAreas and optionally raises their limit.
          </div>

          {expLoading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : expansions.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No expansion requests yet.</div>
          ) : (
            <div className="space-y-3">
              {expansions.map(r => (
                <div key={r._id} className={`bg-white rounded-2xl border p-5 space-y-3 ${r.status === 'pending' ? 'border-amber-200' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize
                          ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                          {r.status}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{r.broker?.name}</p>
                      <p className="text-xs text-slate-400">{r.broker?.email} · {r.broker?.city} {r.broker?.pincode}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400 flex-shrink-0">
                      <p>Current: <span className="font-semibold text-slate-700">{r.broker?.coverageAreas?.length || 0} pincodes</span></p>
                      <p>Limit: <span className="font-semibold text-slate-700">{r.broker?.approvedPincodeLimit ?? '∞'}</span></p>
                      <p>Requesting: <span className="font-semibold text-[#4900e5]">+{r.requestedAreas?.length || 0}</span></p>
                    </div>
                  </div>
                  {r.reason && (
                    <p className="text-sm text-slate-600 italic bg-slate-50 rounded-xl px-3 py-2">"{r.reason}"</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {(r.requestedAreas || []).map((a, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
                        {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                      </span>
                    ))}
                  </div>
                  {r.status === 'pending' ? (
                    <button onClick={() => openExpansion(r)}
                      className="w-full py-2 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition">
                      Review
                    </button>
                  ) : r.adminNote && (
                    <p className="text-xs text-slate-500 italic">Admin note: {r.adminNote}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expansion review modal */}
      {selExp && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelExp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-montserrat font-bold text-slate-800">Review Expansion Request</h3>
              <button onClick={() => setSelExp(null)}><span className="material-icons-outlined text-slate-400">close</span></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                <p className="font-semibold text-slate-800">{selExp.broker?.name}</p>
                <p className="text-xs text-slate-500">{selExp.broker?.email}</p>
                <div className="flex gap-4 pt-1 text-xs">
                  <div><span className="text-slate-400">Current pincodes:</span> <span className="font-bold text-slate-700">{selExp.broker?.coverageAreas?.length || 0}</span></div>
                  <div><span className="text-slate-400">Current limit:</span> <span className="font-bold text-slate-700">{selExp.broker?.approvedPincodeLimit ?? '∞'}</span></div>
                </div>
              </div>
              {selExp.reason && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Reason from Broker</p>
                  <p className="text-sm text-slate-600 italic bg-slate-50 rounded-xl px-3 py-2">"{selExp.reason}"</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Requested Areas (+{selExp.requestedAreas?.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selExp.requestedAreas || []).map((a, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
                      {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">New Pincode Limit (on approval)</label>
                <input type="number" min="1" value={expNewLimit}
                  onChange={e => setExpNewLimit(e.target.value)}
                  placeholder={`Current: ${selExp.broker?.approvedPincodeLimit ?? '∞'} — leave blank to keep`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30" />
                <p className="text-xs text-slate-400 mt-1">After approval they'll have {(selExp.broker?.coverageAreas?.length || 0) + (selExp.requestedAreas?.length || 0)} total pincodes.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Admin Note (optional)</label>
                <textarea rows={2} value={expNote} onChange={e => setExpNote(e.target.value)}
                  placeholder="Reason for approval or rejection…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 resize-none" />
              </div>
              {expMsg.text && (
                <div className={`p-2 rounded-xl text-xs font-semibold text-center ${expMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                  {expMsg.text}
                </div>
              )}
              {selExp.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => doDecideExpansion('approved')} disabled={expWorking}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-1">
                    <span className="material-icons-outlined text-base">verified</span> Approve
                  </button>
                  <button onClick={() => doDecideExpansion('rejected')} disabled={expWorking}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition disabled:opacity-60">
                    Reject
                  </button>
                </div>
              )}
              {selExp.status !== 'pending' && (
                <div className={`p-3 rounded-xl text-sm font-semibold text-center ${selExp.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                  {selExp.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  {selExp.adminNote && ` — ${selExp.adminNote}`}
                </div>
              )}
              <button onClick={() => setSelExp(null)}
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
