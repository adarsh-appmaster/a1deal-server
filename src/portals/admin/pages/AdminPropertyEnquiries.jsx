import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import AssignPanel from '../../../components/common/AssignPanel';
import { useConfirm } from '../../../hooks/useConfirm';
import { resolveOwner } from '../../../utils/owner';

function fmtRs(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

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

// AuctionUnitProperty behaves like UnitProperty for booking/unit-split UI and
// buyer-pincode routing — everywhere else falls back to Mortgage-style copy.
const isUnitLike = m => m === 'UnitProperty' || m === 'AuctionUnitProperty';
const MODEL_LABEL = {
  UnitProperty: 'Unit', MortgageProperty: 'Mortgage', AuctionUnitProperty: 'Auction Unit',
};
const MODEL_BADGE_CLS = {
  UnitProperty: 'bg-primary/10 text-primary', MortgageProperty: 'bg-amber-100 text-amber-700',
  AuctionUnitProperty: 'bg-violet-100 text-violet-700',
};

function fmtBudget(b) {
  if (!b || (!b.min && !b.max)) return '—';
  const fmt = v => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : `₹${(v/100000).toFixed(0)}L`;
  if (b.min && b.max) return `${fmt(b.min)} – ${fmt(b.max)}`;
  if (b.min) return `From ${fmt(b.min)}`;
  return `Up to ${fmt(b.max)}`;
}

export default function AdminPropertyEnquiries() {
  const { user: me }                = useAuth();
  const [enquiries, setEnquiries]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCity, setFilterCity]     = useState('');
  const [search, setSearch]             = useState('');

  const [selected, setSelected]         = useState(null);
  const [pincodeMatches, setPincodeMatches] = useState(null);
  const [teamMembers, setTeamMembers]   = useState([]);
  const [assignTo, setAssignTo]         = useState('');
  const [selectedTeam, setSelectedTeam] = useState([]);
  const [assignNote, setAssignNote]     = useState('');
  const [adminNote, setAdminNote]     = useState('');
  const [newStatus, setNewStatus]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');
  const { confirm, dialog } = useConfirm();

  // Booking modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [propertyUnits, setPropertyUnits] = useState([]);
  const [bookUnitId, setBookUnitId]       = useState('');
  const [bookUnitNumber, setBookUnitNumber] = useState('');
  const [bookPrice, setBookPrice]         = useState('');
  const [bookSaving, setBookSaving]       = useState(false);
  const [bookMsg, setBookMsg]             = useState('');

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCity.trim()) params.city = filterCity.trim();
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/enquiry', { params });
      setEnquiries(data.enquiries || []);
      setTotal(data.total || 0);
    } catch { /* silently */ }
    setLoading(false);
  }, [page, filterStatus, filterCity, search]);

  useEffect(() => { load(); }, [load]);

  async function openEnquiry(enq) {
    setSelected(enq);
    setAssignTo(enq.assignedTo?._id || '');
    setSelectedTeam((enq.assignedTeam || []).map(t => t._id));
    setAssignNote(enq.assignmentNote || '');
    setAdminNote(enq.adminNote || '');
    setNewStatus(enq.status);
    setSaveMsg('');
    setPincodeMatches(null);
    setTeamMembers([]);
    try {
      const params = {};
      if (enq.city) params.city = enq.city;
      // For unit/auction-unit property enquiries use buyer's pincode for exact broker matching
      if (['UnitProperty', 'AuctionUnitProperty'].includes(enq.propertyModel) && enq.pincode) params.pincode = enq.pincode;
      const { data } = await api.get('/enquiry/brokers', { params });
      setPincodeMatches(data.pincodeMatches || null);
      setTeamMembers(data.teamMembers || []);
    } catch {
      setPincodeMatches(null); setTeamMembers([]);
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
      const { data } = await api.patch(`/enquiry/${selected._id}/assign`, {
        assignedTo: assignTo, assignmentNote: assignNote, status: 'assigned',
        ...(isAuctionUnit && { assignedTeam: selectedTeam }),
      });
      setSaveMsg('Assigned successfully.');
      setSelected(data.enquiry);
      setEnquiries(prev => prev.map(e => e._id === data.enquiry._id ? data.enquiry : e));
    } catch (ex) {
      setSaveMsg(ex.response?.data?.message || 'Assignment failed.');
    }
    setSaving(false);
  }

  async function handleStatusUpdate() {
    setSaving(true);
    try {
      const { data } = await api.patch(`/enquiry/${selected._id}`, {
        status: newStatus, adminNote,
      });
      setSaveMsg('Saved.');
      setSelected(data.enquiry);
      setEnquiries(prev => prev.map(e => e._id === data.enquiry._id ? data.enquiry : e));
    } catch (ex) {
      setSaveMsg(ex.response?.data?.message || 'Save failed.');
    }
    setSaving(false);
  }

  async function openBookModal() {
    setBookMsg('');
    setBookUnitId(selected.selectedUnitId || '');
    setBookUnitNumber(selected.selectedUnitNumber || '');
    setBookPrice(selected.bookedPrice != null ? String(selected.bookedPrice) : '');
    setPropertyUnits([]);
    setShowBookModal(true);
    // Only fetch units for unit-like models — mortgage has no unit split
    if (selected.propertyId && isUnitLike(selected.propertyModel)) {
      const endpoint = selected.propertyModel === 'AuctionUnitProperty' ? 'auction-unit-properties' : 'unit-properties';
      try {
        const { data } = await api.get(`/${endpoint}/${selected.propertyId}`);
        const units = data.property?.unitSplit?.units || [];
        setPropertyUnits(units.filter(u => u.status === 'available' || u.status === 'under_negotiation'));
      } catch { setPropertyUnits([]); }
    }
  }

  function selectUnit(unit) {
    setBookUnitId(unit._id);
    setBookUnitNumber(unit.unitNumber || '');
    setBookPrice(String(unit.price || ''));
  }

  async function handleBook() {
    if (!bookPrice || isNaN(Number(bookPrice))) { setBookMsg('Enter a valid price.'); return; }
    setBookSaving(true);
    setBookMsg('');
    try {
      const { data } = await api.patch(`/enquiry/${selected._id}/book`, {
        unitId: bookUnitId || undefined,
        unitNumber: bookUnitNumber || undefined,
        unitPrice: Number(bookPrice),
      });
      setSaveMsg('Unit booked and commission locked.');
      setSelected(data.enquiry);
      setEnquiries(prev => prev.map(e => e._id === data.enquiry._id ? data.enquiry : e));
      setShowBookModal(false);
    } catch (ex) {
      setBookMsg(ex.response?.data?.message || 'Booking failed.');
    }
    setBookSaving(false);
  }

  async function handleMarkPaid() {
    if (!(await confirm('Mark commission as paid? This cannot be undone.', { danger: true, confirmLabel: 'Mark Paid' }))) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/enquiry/${selected._id}/mark-paid`);
      setSaveMsg('Commission marked as paid.');
      setSelected(data.enquiry);
      setEnquiries(prev => prev.map(e => e._id === data.enquiry._id ? data.enquiry : e));
    } catch (ex) {
      setSaveMsg(ex.response?.data?.message || 'Failed.');
    }
    setSaving(false);
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {dialog}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-slate-800">Property Enquiries</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total enquiries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, phone, city…"
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1); }}
          placeholder="Filter by city…"
          className="w-40 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <span className="material-icons-outlined animate-spin mr-2">refresh</span> Loading…
          </div>
        ) : enquiries.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="material-icons-outlined text-4xl mb-2 block">contact_support</span>
            No enquiries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Enquirer', 'Location', 'Purpose / Budget', 'Status', 'Owner', 'Assigned To', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enquiries.map(e => (
                  <tr key={e._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{e.name}</p>
                      <p className="text-slate-400 text-xs">{e.phone}</p>
                      {e.propertyTitle && <p className="text-xs text-primary truncate max-w-[140px]" title={e.propertyTitle}>{e.propertyTitle}</p>}
                      {e.propertyModel && (
                        <span className={`mt-0.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded
                          ${MODEL_BADGE_CLS[e.propertyModel] || 'bg-amber-100 text-amber-700'}`}>
                          {MODEL_LABEL[e.propertyModel] || e.propertyModel}
                        </span>
                      )}
                      {e.siteVisitId && (
                        <span className="mt-0.5 ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700"
                          title={e.visitDate ? `Visit ${e.visitDate}${e.visitSlot ? ` ${e.visitSlot}` : ''}` : 'Site visit'}>
                          <span className="material-icons-outlined text-[11px]">event</span>Site Visit
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{e.city || '—'}</p>
                      {e.area && <p className="text-xs text-slate-400">{e.area}</p>}
                      {e.pincode && <p className="text-xs text-slate-400">{e.pincode}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600">{PURPOSE_LABELS[e.purpose] || e.purpose}</span>
                      {e.bedrooms && <span className="ml-1 text-xs text-slate-400">· {e.bedrooms} BHK</span>}
                      <p className="text-xs text-slate-400">{fmtBudget(e.budget)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[e.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[e.status] || e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => { const o = resolveOwner(e); return (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${o.cls}`} title={o.name || ''}>
                          {o.label}{o.name ? ` · ${o.name.split(' ')[0]}` : ''}
                        </span>
                      ); })()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {e.assignedTo ? (
                        <>
                          <p className="font-medium text-slate-700">{e.assignedTo.name}</p>
                          <p className="text-slate-400">{e.assignedTo.brokerTier === 'master' ? 'Master Broker' : 'Broker'}</p>
                        </>
                      ) : '—'}
                      {e.routingNote && (
                        <span title={e.routingNote}
                          className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          <span className="material-icons-outlined text-xs">warning</span>
                          Verify coverage
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEnquiry(e)}
                        className="text-primary hover:text-primary-container text-xs font-semibold flex items-center gap-1">
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

      {/* Pagination */}
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

      {/* Book Unit Modal */}
      {showBookModal && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowBookModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[85vh]"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-montserrat font-bold text-base text-slate-800">
                {isUnitLike(selected.propertyModel) ? 'Book Unit'
                 : selected.propertyModel === 'MortgageProperty' ? 'Mark as Sold'
                 : 'Mark as Transferred'}
              </h3>
              <button onClick={() => setShowBookModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <p className="text-xs text-slate-500">Enquiry: <span className="font-semibold text-slate-700">{selected.name}</span> — {selected.propertyTitle}</p>

              {/* Unit selector — only for unit-like models */}
              {isUnitLike(selected.propertyModel) && (
                propertyUnits.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Select Unit</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {propertyUnits.map(u => (
                        <button key={u._id} onClick={() => selectUnit(u)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition
                            ${bookUnitId === u._id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}>
                          <span className="font-semibold text-slate-800">Unit {u.unitNumber || u._id?.toString().slice(-4)}</span>
                          {u.unitType && <span className="ml-2 text-xs text-slate-400">{u.unitType}</span>}
                          {u.areaSqft && <span className="ml-2 text-xs text-slate-400">{u.areaSqft} sqft</span>}
                          {u.price && <span className="ml-2 text-xs font-semibold text-primary">{fmtRs(u.price)}</span>}
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-semibold
                            ${u.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {u.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No unit split configured — enter unit details manually below.</p>
                )
              )}

              <div className="space-y-3">
                {isUnitLike(selected.propertyModel) && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit Number</label>
                    <input value={bookUnitNumber} onChange={e => setBookUnitNumber(e.target.value)}
                      placeholder="e.g. A-201"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {isUnitLike(selected.propertyModel) ? 'Confirmed Sale Price (₹)' : 'Final Deal Price (₹)'}
                    <span className="text-rose-500"> *</span>
                  </label>
                  <input type="number" value={bookPrice} onChange={e => setBookPrice(e.target.value)}
                    placeholder="e.g. 4500000"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  {bookPrice && !isNaN(Number(bookPrice)) && (
                    <p className="text-xs text-slate-400 mt-1">{fmtRs(Number(bookPrice))}</p>
                  )}
                </div>
              </div>

              {selected.commission?.mode && bookPrice && !isNaN(Number(bookPrice)) && Number(bookPrice) > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs space-y-1">
                  <p className="font-bold text-primary uppercase tracking-wide">Commission Preview</p>
                  {selected.commission.mode === 'broker_chain' && (
                    <p>Broker ({selected.commission.brokerPercent}%): <span className="font-semibold">{fmtRs(Math.round((selected.commission.brokerPercent || 0) / 100 * Number(bookPrice)))}</span></p>
                  )}
                  <p>Master Broker ({selected.commission.masterBrokerPercent}%): <span className="font-semibold">{fmtRs(Math.round((selected.commission.masterBrokerPercent || 0) / 100 * Number(bookPrice)))}</span></p>
                </div>
              )}

              {bookMsg && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{bookMsg}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowBookModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleBook} disabled={bookSaving || !bookPrice}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-[#3700b3] transition disabled:opacity-60">
                {bookSaving ? 'Saving…'
                 : isUnitLike(selected.propertyModel) ? 'Confirm Booking'
                 : selected.propertyModel === 'MortgageProperty' ? 'Confirm Sale'
                 : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Panel header */}
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

              {/* Property */}
              {selected.propertyTitle && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {selected.propertyModel && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${MODEL_BADGE_CLS[selected.propertyModel] || 'bg-amber-100 text-amber-700'}`}>
                        {selected.propertyModel === 'UnitProperty' ? 'Unit Property'
                         : selected.propertyModel === 'AuctionUnitProperty' ? 'Auction Unit Property'
                         : 'Mortgage / Bank Repo'}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-700">{selected.propertyTitle}</p>
                </div>
              )}

              {/* Details */}
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
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Submitted</p>
                  <p className="text-slate-700">{new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {selected.message && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Message</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{selected.message}</p>
                </div>
              )}

              {selected.routingNote && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <span className="material-icons-outlined text-sm flex-shrink-0">warning</span>
                  {selected.routingNote}
                </div>
              )}

              {selected.commission?.mode && (
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-2">
                  <p className="font-bold text-slate-400 uppercase tracking-wider">Commission Routing
                    <span className="ml-2 font-normal normal-case text-slate-400">
                      {isUnitLike(selected.propertyModel) ? '(buyer pincode)' : '(property pincode)'}
                    </span>
                  </p>
                  {selected.commission.mode === 'broker_chain' ? (
                    <p>Broker <span className="font-semibold">{selected.assignedBroker?.name || 'unmatched'}</span> ({selected.commission.brokerPercent}%) → Master Broker <span className="font-semibold">{selected.assignedMasterBroker?.name || 'unmatched'}</span> ({selected.commission.masterBrokerPercent}%)</p>
                  ) : (
                    <p>Master Broker <span className="font-semibold">{selected.assignedMasterBroker?.name || 'unmatched'}</span> at <span className="font-semibold">{selected.commission.masterBrokerPercent}%</span></p>
                  )}

                  {selected.commission?.bookedAt ? (
                    <div className="border-t border-slate-200 pt-2 space-y-1">
                      <p className="text-emerald-600 font-semibold">
                        Deal Locked
                        {selected.selectedUnitNumber ? ` · Unit ${selected.selectedUnitNumber}` : ''}
                        {selected.bookedPrice != null ? ` · Booked at ${fmtRs(selected.bookedPrice)}` : ''}
                        {selected.commission.brokerAmount ? ` · Broker ${fmtRs(selected.commission.brokerAmount)}` : ''}
                        {` · MB ${fmtRs(selected.commission.masterBrokerAmount)}`}
                      </p>
                      {selected.commissionPaid ? (
                        <p className="text-emerald-700 font-bold flex items-center gap-1">
                          <span className="material-icons-outlined text-sm">check_circle</span>
                          Commission Paid {selected.commissionPaidAt ? `on ${new Date(selected.commissionPaidAt).toLocaleDateString('en-IN')}` : ''}
                        </p>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={handleMarkPaid} disabled={saving}
                            className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-60">
                            Mark Commission Paid
                          </button>
                          <button onClick={openBookModal}
                            className="mt-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                            Revise Price
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={openBookModal}
                      className="mt-1 w-full py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#3700b3] transition">
                      {isUnitLike(selected.propertyModel) ? 'Book Unit & Lock Commission'
                       : selected.propertyModel === 'MortgageProperty' ? 'Mark as Sold & Lock Commission'
                       : 'Mark as Transferred & Lock Commission'}
                    </button>
                  )}
                </div>
              )}

              {/* Assign */}
              <div className="border-t border-slate-100 pt-4">
                <AssignPanel
                  me={me}
                  assignTo={assignTo}
                  onAssignTo={setAssignTo}
                  pincodeMatches={['UnitProperty', 'AuctionUnitProperty'].includes(selected?.propertyModel) ? pincodeMatches : null}
                  teamMembers={teamMembers}
                  onAssign={handleAssign}
                  saving={saving}
                  note={assignNote}
                  onNote={setAssignNote}
                  showTeamMates={selected?.propertyModel === 'AuctionUnitProperty'}
                  selectedTeam={selectedTeam}
                  onToggleTeam={toggleTeamMate}
                />
              </div>

              {/* Status + admin note */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status & Notes</p>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <textarea rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="Admin note…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
                <button onClick={handleStatusUpdate} disabled={saving}
                  className="w-full py-2.5 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>

              {saveMsg && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs">
                  <span className="material-icons-outlined text-sm">check_circle</span>
                  {saveMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
