import { useState, useEffect } from 'react';
import api from '../../api/axios';

const INP = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] bg-white transition';

const ACTION_LABEL = {
  UnitProperty:        'Book Unit',
  MortgageProperty:    'Mark as Sold',
  LoanTransferProperty:'Mark as Transferred',
};
const DONE_LABEL = {
  UnitProperty:        'Booked',
  MortgageProperty:    'Sold',
  LoanTransferProperty:'Transferred',
};

/**
 * BookPropertyModal — admin closes a deal directly from a property/unit page.
 * Either pick an existing PropertyEnquiry tied to this property, or enter the buyer's details manually.
 *
 * Props:
 *   propertyId, propertyModel : the property being booked
 *   unitId, unitNumber        : (UnitProperty only) the specific unit
 *   priceHint                 : listed price, used to prefill the sale price field
 *   onClose()                 : close the modal
 *   onBooked(enquiry)         : called with the resulting enquiry after a successful booking
 */
export default function BookPropertyModal({ propertyId, propertyModel, unitId = null, unitNumber = '', priceHint = '', onClose, onBooked }) {
  const [mode, setMode] = useState('enquiry'); // 'enquiry' | 'manual'
  const [candidates, setCandidates] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [enquiryId, setEnquiryId] = useState('');

  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [price, setPrice] = useState(priceHint ? String(priceHint) : '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr]   = useState('');

  // Pull both enquiries AND scheduled site visits for this property (enquiries filtered to the
  // specific unit when booking a UnitProperty unit) and merge them into one "who approaches" list —
  // a buyer may have enquired, scheduled a visit, or both.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingEnquiries(true);
      try {
        const enqParams = { propertyId, propertyModel, limit: 50 };
        if (unitId) enqParams.unitId = unitId;
        const [enqRes, visitRes] = await Promise.all([
          api.get('/enquiry', { params: enqParams }),
          api.get('/site-visits', { params: { propertyId, propertyModel, limit: 50 } }).catch(() => ({ data: { visits: [] } })),
        ]);
        if (cancelled) return;
        const enqList = enqRes.data.enquiries || [];
        const visits  = visitRes.data.visits  || [];
        const visitByPhone = {};
        visits.forEach(v => { visitByPhone[v.phone] = v; });

        const enqPhones = new Set(enqList.map(e => e.phone));
        const merged = [
          ...enqList.map(e => ({
            kind: 'enquiry', enquiryId: e._id,
            name: e.name, phone: e.phone, email: e.email, status: e.status,
            visit: visitByPhone[e.phone] || null,
          })),
          // Buyers who scheduled a visit but never submitted a separate enquiry —
          // still worth surfacing as someone approaching this property.
          ...visits.filter(v => !enqPhones.has(v.phone)).map(v => ({
            kind: 'visit', enquiryId: null,
            name: v.name, phone: v.phone, email: v.email, status: v.status,
            visit: v,
          })),
        ];
        setCandidates(merged);
      } catch { if (!cancelled) setCandidates([]); }
      if (!cancelled) setLoadingEnquiries(false);
    }
    load();
    return () => { cancelled = true; };
  }, [propertyId, propertyModel, unitId]);

  function pickCandidate(c) {
    if (c.kind === 'enquiry') {
      setMode('enquiry');
      setEnquiryId(c.enquiryId);
    } else {
      // Visit-only candidate — no enquiry doc to book against, switch to manual entry prefilled.
      setMode('manual');
      setEnquiryId('');
      setName(c.name || '');
      setPhone(c.phone || '');
      setEmail(c.email || '');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setErr('Enter a valid sale price.'); return;
    }
    if (mode === 'enquiry' && !enquiryId) {
      setErr('Select an enquiry, or switch to manual entry.'); return;
    }
    if (mode === 'manual' && (!name.trim() || !phone.trim())) {
      setErr('Buyer name and phone are required.'); return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/enquiry/book-for-property', {
        propertyId, propertyModel,
        unitId: unitId || undefined,
        unitNumber: unitNumber || undefined,
        unitPrice: Number(price),
        ...(mode === 'enquiry'
          ? { enquiryId }
          : { name: name.trim(), phone: phone.trim(), email: email.trim() }),
      });
      setDone(true);
      onBooked?.(data.enquiry);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Booking failed. Please try again.');
    }
    setSubmitting(false);
  }

  const actionLabel = ACTION_LABEL[propertyModel] || 'Book';
  const doneLabel   = DONE_LABEL[propertyModel]   || 'Booked';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4900e5]/10 flex items-center justify-center">
              <span className="material-icons-outlined text-[#4900e5] text-lg">sell</span>
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-base text-slate-800">{actionLabel}</h2>
              {unitNumber && <p className="text-xs text-slate-400">Unit {unitNumber}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
            <span className="material-icons-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {done ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-outlined text-emerald-600 text-3xl">check_circle</span>
              </div>
              <h3 className="font-montserrat font-bold text-lg text-slate-800 mb-2">{doneLabel}!</h3>
              <p className="text-slate-500 text-sm mb-6">Commission has been locked against this sale price.</p>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Mode toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button type="button" onClick={() => setMode('enquiry')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${mode === 'enquiry' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                  From Enquiry
                </button>
                <button type="button" onClick={() => setMode('manual')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${mode === 'manual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                  Enter Manually
                </button>
              </div>

              {mode === 'enquiry' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Who's Approaching{unitNumber ? ` · Unit ${unitNumber}` : ''}
                  </label>
                  {loadingEnquiries ? (
                    <p className="text-xs text-slate-400">Loading enquiries &amp; site visits…</p>
                  ) : candidates.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No enquiries or scheduled visits found{unitNumber ? ' for this unit' : ' for this property'}. Switch to "Enter Manually" to book directly.
                    </p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {candidates.map((c, i) => {
                        const isSelected = c.kind === 'enquiry' && enquiryId === c.enquiryId;
                        return (
                          <button key={c.enquiryId || `visit-${i}`} type="button" onClick={() => pickCandidate(c)}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition
                              ${isSelected ? 'bg-[#4900e5]/8 border-[#4900e5]/40 ring-1 ring-[#4900e5]/30' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{c.name}</p>
                              <p className="text-xs text-slate-400">{c.phone}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {c.kind === 'enquiry' && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                                    Enquiry · {c.status}
                                  </span>
                                )}
                                {c.visit && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                    Visit {c.visit.date} · {c.visit.slot}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && <span className="material-icons-outlined text-[#4900e5] text-lg flex-shrink-0">check_circle</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Name *</label>
                      <input className={INP} placeholder="Buyer's name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone *</label>
                      <input className={INP} placeholder="9876543210" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
                    <input className={INP} placeholder="buyer@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Final Sale Price (₹) *</label>
                <input className={INP} type="number" min="0" placeholder="e.g. 7500000" value={price} onChange={e => setPrice(e.target.value)} />
              </div>

              {err && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs">
                  <span className="material-icons-outlined text-sm">error_outline</span>
                  {err}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-60">
                {submitting ? 'Saving…' : `${actionLabel} & Lock Commission`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
