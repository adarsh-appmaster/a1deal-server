import { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { STATE_LIST, getCities } from '../../data/indiaLocations';

const INP = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] bg-white transition';

const UNIT_STATUS_CLS = {
  available:         'bg-emerald-100 text-emerald-700 border-emerald-200',
  under_negotiation: 'bg-amber-100 text-amber-700 border-amber-200',
  sold:              'bg-slate-100 text-slate-400 border-slate-200',
};

function formatPrice(n) {
  if (!n) return null;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function EnquiryModal({ onClose, property = null, preselectedUnit = null }) {
  const { user } = useAuth();
  const isUnitProperty = property?._model === 'UnitProperty';
  const units = property?.units || [];
  const availableUnits = units.filter(u => u.status !== 'sold');

  const [form, setForm] = useState({
    name:      user?.name    || '',
    phone:     user?.phone   || '',
    email:     user?.email   || '',
    state:     STATE_LIST[0] || '',
    city:      property?.city  || '',
    area:      property?.area  || '',
    pincode:   user?.pincode || '',
    message:   '',
  });
  const [selectedUnit, setSelectedUnit] = useState(preselectedUnit || null);
  const [submitting, setSubmitting]     = useState(false);
  const [done, setDone]                 = useState(false);
  const [err, setErr]                   = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.phone.trim()) {
      setErr('Name and phone are required.'); return;
    }
    if (!form.city.trim() && !property) {
      setErr('Please select a city.'); return;
    }
    if (isUnitProperty && !form.pincode.trim()) {
      setErr('Your pincode is required to connect you with the right broker.'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/enquiry', {
        name:    form.name.trim(),
        phone:   form.phone.trim(),
        email:   form.email.trim(),
        state:   form.state,
        city:    property?.city  || form.city.trim(),
        area:    property?.area  || form.area.trim(),
        pincode: form.pincode.trim(),
        message: form.message.trim(),
        ...(property && {
          propertyId:    property._id,
          propertyModel: property._model || null,
          propertyTitle: property.title  || property.name || '',
        }),
        ...(selectedUnit && {
          selectedUnitId:     selectedUnit._id,
          selectedUnitNumber: selectedUnit.unitNumber,
        }),
      });
      setDone(true);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  }

  const cities = getCities(form.state);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4900e5]/10 flex items-center justify-center">
              <span className="material-icons-outlined text-[#4900e5] text-lg">
                {property ? 'home' : 'contact_support'}
              </span>
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-base text-slate-800">Property Enquiry</h2>
              <p className="text-xs text-slate-400">
                {property ? property.title || property.name || 'Specific Property' : 'General Area Enquiry'}
              </p>
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
              <h3 className="font-montserrat font-bold text-lg text-slate-800 mb-2">Enquiry Submitted!</h3>
              <p className="text-slate-500 text-sm mb-6">
                {selectedUnit
                  ? `Your interest in Unit ${selectedUnit.unitNumber} has been recorded. Our team will contact you shortly.`
                  : 'Our team will review your request and connect you with the right broker. You\'ll be contacted shortly.'}
              </p>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Property snapshot */}
              {property && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="material-icons-outlined text-slate-400 text-lg">home</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{property.title || property.name}</p>
                    <p className="text-xs text-slate-400">{[property.area, property.city].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
              )}

              {/* Unit selector — only for unit properties with split units */}
              {isUnitProperty && availableUnits.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Select Unit <span className="text-slate-300 font-normal normal-case">(optional)</span>
                  </label>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {availableUnits.map((u, i) => {
                      const isSelected = selectedUnit?._id === u._id || selectedUnit?.unitNumber === u.unitNumber;
                      const stCls = UNIT_STATUS_CLS[u.status] || UNIT_STATUS_CLS.available;
                      return (
                        <button key={u._id || i} type="button"
                          onClick={() => setSelectedUnit(isSelected ? null : u)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition
                            ${isSelected
                              ? 'bg-[#4900e5]/8 border-[#4900e5]/40 ring-1 ring-[#4900e5]/30'
                              : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition
                              ${isSelected ? 'bg-[#4900e5] border-[#4900e5]' : 'border-slate-300'}`}>
                              {isSelected && <span className="material-icons-outlined text-white text-xs">check</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-700">
                                Unit {u.unitNumber}
                                {u.floor != null && <span className="font-normal text-slate-400"> · Floor {u.floor}</span>}
                              </p>
                              <p className="text-xs text-slate-400">{u.unitType}{u.areaSqft ? ` · ${u.areaSqft.toLocaleString()} sqft` : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {u.price > 0 && (
                              <span className="text-xs font-bold text-[#4900e5]">{formatPrice(u.price)}</span>
                            )}
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${stCls}`}>
                              {u.status === 'available' ? 'Available' : 'Under Offer'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedUnit && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-[#4900e5] font-semibold">
                      <span className="material-icons-outlined text-sm">check_circle</span>
                      Unit {selectedUnit.unitNumber} selected
                      <button type="button" onClick={() => setSelectedUnit(null)} className="ml-auto text-slate-400 hover:text-slate-600">
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Name *</label>
                  <input className={INP} placeholder="Your name" value={form.name}
                    onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone *</label>
                  <input className={INP} placeholder="9876543210" type="tel" value={form.phone}
                    onChange={e => set('phone', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
                <input className={INP} placeholder="you@example.com" type="email" value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>

              {/* Pincode — mandatory for unit properties (broker routing uses buyer's pincode) */}
              {isUnitProperty && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Your Pincode *
                  </label>
                  <input className={INP} placeholder="e.g. 302017" value={form.pincode}
                    onChange={e => set('pincode', e.target.value)} maxLength={6} />
                  <p className="text-xs text-slate-400 mt-1">
                    Used to assign the right broker or master broker for your area.
                  </p>
                </div>
              )}

              {/* Location — only for general (non-property) enquiries */}
              {!property && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">State</label>
                      <select className={INP} value={form.state}
                        onChange={e => { set('state', e.target.value); set('city', ''); }}>
                        <option value="">Select state…</option>
                        {STATE_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">City *</label>
                      <input className={INP} placeholder="e.g. Jaipur" value={form.city}
                        list="enq-cities" onChange={e => set('city', e.target.value)} />
                      <datalist id="enq-cities">
                        {cities.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Area</label>
                      <input className={INP} placeholder="e.g. Malviya Nagar" value={form.area}
                        onChange={e => set('area', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Pincode</label>
                      <input className={INP} placeholder="e.g. 302017" value={form.pincode}
                        onChange={e => set('pincode', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Message</label>
                <textarea rows={2} className={`${INP} resize-none`}
                  placeholder="Any specific requirements, questions, or notes…"
                  value={form.message} onChange={e => set('message', e.target.value)} />
              </div>

              {err && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs">
                  <span className="material-icons-outlined text-sm">error_outline</span>
                  {err}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-60">
                {submitting ? 'Submitting…' : 'Submit Enquiry →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
