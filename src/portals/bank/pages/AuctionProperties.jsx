import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';
import { validateForm } from '../../../validation/validate';
import { mortgagePropertySchema } from '../../../validation/schemas';
import MediaUploader from '../../../components/common/MediaUploader';
import { searchLocations } from '../../../data/indiaLocations';
import { getPincodeEntryForCity, expandPincodesForCity, RAJASTHAN_CITY_NAMES } from '../../../data/rajasthanPincodes';
import { MORTGAGE_TYPES as TYPES, MORTGAGE_TYPE_LABELS as TYPE_LABELS, showMortgageField, mortgageTypeLabel } from '../../../utils/mortgagePropertyTypes';
import { useConfirm } from '../../../hooks/useConfirm';
import { toast } from '../../../components/common/Toast';
const VISIBLE_OPTS = [
  { key: 'buyer',     label: 'Buyers',     color: 'bg-violet-100 text-violet-700' },
  { key: 'broker',    label: 'Brokers',    color: 'bg-rose-100 text-rose-600' },
  { key: 'developer', label: 'Developers', color: 'bg-sky-100 text-sky-700' },
  { key: 'investor',  label: 'Investors',  color: 'bg-emerald-100 text-emerald-700' },
];
const STATUS_STYLE = {
  available:    { label: 'Available',     color: 'bg-emerald-100 text-emerald-700' },
  under_auction:{ label: 'Under Auction', color: 'bg-amber-100 text-amber-700' },
  sold:         { label: 'Sold',          color: 'bg-slate-100 text-slate-600' },
  withdrawn:    { label: 'Withdrawn',     color: 'bg-rose-100 text-rose-600' },
};

const EMPTY_FORM = {
  title: '', description: '', city: '', area: '', pincode: '',
  type: 'flat', customType: '', bedrooms: '', area_sqft: '', price: '',
  bankName: '', auctionDate: '', contactPhone: '',
  status: 'available',
  visibleTo: ['buyer', 'broker', 'developer', 'investor'],
  commissionBankPct: '',
  localityPrices: [],
};

// Drop blank rows and coerce the price to a number before sending to the API.
function cleanLocalityPrices(rows) {
  return (rows || [])
    .filter(r => (r.area && r.area.trim()) || (r.pincode && r.pincode.trim()) || r.expectedPrice !== '')
    .map(r => ({
      area: r.area?.trim() || '',
      pincode: r.pincode?.trim() || '',
      expectedPrice: r.expectedPrice !== '' && r.expectedPrice != null ? Number(r.expectedPrice) : null,
    }));
}

const inp = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30';
const LIMIT = 9;

function fmt(n) {
  const v = Number(n);
  if (!v) return '—';
  return v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
}

export default function AuctionProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [formImages, setFormImages] = useState([]);
  const [formVideo, setFormVideo]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const { confirm, dialog } = useConfirm();

  // City autosuggest
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityWrapRef = useRef(null);

  // Pincode autosuggest — derived from the current city, filtered by what's typed so far
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
  const pincodeWrapRef = useRef(null);

  useEffect(() => {
    function close(e) {
      if (cityWrapRef.current && !cityWrapRef.current.contains(e.target)) setShowCitySuggestions(false);
      if (pincodeWrapRef.current && !pincodeWrapRef.current.contains(e.target)) setShowPincodeSuggestions(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const fetchProps = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const { data } = await api.get(`/mortgage-properties?${params}`);
      setProperties(data.properties || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchProps(1); }, [fetchProps]);

  // Stats derived from current page or total — use a separate call for counts
  const [stats, setStats] = useState({ available: 0, under_auction: 0, sold: 0 });
  useEffect(() => {
    async function loadStats() {
      try {
        const [av, ua, so] = await Promise.all([
          api.get('/mortgage-properties?page=1&limit=1&status=available'),
          api.get('/mortgage-properties?page=1&limit=1&status=under_auction'),
          api.get('/mortgage-properties?page=1&limit=1&status=sold'),
        ]);
        setStats({ available: av.data.total || 0, under_auction: ua.data.total || 0, sold: so.data.total || 0 });
      } catch { /* empty */ }
    }
    loadStats();
  }, [properties]);

  function openAdd() { setForm({ ...EMPTY_FORM }); setFormImages([]); setFormVideo(''); setEditId(null); setMsg(''); setShowForm(true); }
  function openEdit(p) {
    setForm({
      title: p.title || '', description: p.description || '',
      city: p.city || '', area: p.area || '', pincode: p.pincode || '',
      type: p.type || 'flat', customType: p.customType || '', bedrooms: p.bedrooms ?? '', area_sqft: p.area_sqft ?? '',
      price: p.price || '', bankName: p.bankName || '',
      auctionDate: p.auctionDate ? new Date(p.auctionDate).toISOString().split('T')[0] : '',
      contactPhone: p.contactPhone || '',
      status: p.status || 'available',
      visibleTo: p.visibleTo || ['buyer', 'broker', 'developer', 'investor'],
      commissionBankPct: p.commissionOverride?.bankPct ?? '',
      localityPrices: (p.localityPrices || []).map(r => ({
        area: r.area || '', pincode: r.pincode || '',
        expectedPrice: r.expectedPrice ?? '',
      })),
    });
    setFormImages(p.images || []);
    setFormVideo(p.video || '');
    setEditId(p._id);
    setMsg('');
    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => {
      const next = { ...f, [name]: value };
      if (name === 'type' && !showMortgageField(value, 'bedrooms')) next.bedrooms = '';
      if (name === 'type' && value !== 'other') next.customType = '';
      return next;
    });
  }

  function handleCityChange(e) {
    const v = e.target.value;
    setForm(f => ({ ...f, city: v }));
    const matches = v.trim().length >= 2
      ? searchLocations(v).filter(s => s.state === 'Rajasthan' && RAJASTHAN_CITY_NAMES.has(s.label.toLowerCase())).slice(0, 6)
      : [];
    setCitySuggestions(matches);
    setShowCitySuggestions(true);
  }

  function pickCity(loc) {
    setForm(f => ({ ...f, city: loc.label, pincode: '' }));
    setShowCitySuggestions(false);
    setShowPincodeSuggestions(false);
  }

  function handlePincodeChange(e) {
    const v = e.target.value;
    setForm(f => ({ ...f, pincode: v }));
    setShowPincodeSuggestions(v.trim().length >= 3);
  }

  function pickPincode(pin) {
    setForm(f => ({ ...f, pincode: pin }));
    setShowPincodeSuggestions(false);
  }

  const pincodeSuggestions = (() => {
    const typed = form.pincode.trim();
    if (typed.length < 3) return [];
    const all = expandPincodesForCity(form.city);
    return all.filter(p => p.startsWith(typed));
  })();

  function toggleVisible(key) {
    setForm(f => ({
      ...f,
      visibleTo: f.visibleTo.includes(key) ? f.visibleTo.filter(k => k !== key) : [...f.visibleTo, key],
    }));
  }

  // ── Extra locality/area expected prices (optional) ──────────────────────────
  function addLocalityPrice() {
    setForm(f => ({ ...f, localityPrices: [...(f.localityPrices || []), { area: '', pincode: '', expectedPrice: '' }] }));
  }
  function updateLocalityPrice(i, key, value) {
    setForm(f => {
      const rows = [...(f.localityPrices || [])];
      rows[i] = { ...rows[i], [key]: value };
      return { ...f, localityPrices: rows };
    });
  }
  function removeLocalityPrice(i) {
    setForm(f => ({ ...f, localityPrices: (f.localityPrices || []).filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { errors } = validateForm(mortgagePropertySchema, form);
    if (errors) { setMsg(Object.values(errors)[0]); return; }
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...form,
        bedrooms: form.bedrooms !== '' ? Number(form.bedrooms) : undefined,
        area_sqft: form.area_sqft !== '' ? Number(form.area_sqft) : undefined,
        price: Number(form.price),
        auctionDate: form.auctionDate || undefined,
        commissionOverride: { bankPct: form.commissionBankPct !== '' ? Number(form.commissionBankPct) : null },
        localityPrices: cleanLocalityPrices(form.localityPrices),
        images: formImages,
        video: formVideo,
      };
      delete payload.commissionBankPct;
      if (editId) {
        await api.patch(`/mortgage-properties/${editId}`, payload);
      } else {
        await api.post('/mortgage-properties', payload);
      }
      setShowForm(false);
      fetchProps(editId ? page : 1);
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!(await confirm('Remove this property listing?', { danger: true, confirmLabel: 'Remove' }))) return;
    try { await api.delete(`/mortgage-properties/${id}`); fetchProps(page); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to remove property listing.'); }
  }

  return (
    <div>
      {dialog}
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Auction Properties</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage your bank's repo / auction listings</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f4c81] text-white text-sm font-semibold hover:bg-[#1565c0] transition">
          <span className="material-icons-outlined text-base">add</span> List Property
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available',     value: stats.available,     color: 'text-emerald-600' },
          { label: 'Under Auction', value: stats.under_auction, color: 'text-amber-600' },
          { label: 'Sold/Closed',   value: stats.sold,          color: 'text-slate-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`font-montserrat font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all', 'available', 'under_auction', 'sold', 'withdrawn'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
                ${statusFilter === s ? 'bg-[#0f4c81] text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
              {s === 'all' ? 'All Properties' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant">{total} listing{total !== 1 ? 's' : ''} · page {page}/{pages}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-icons-outlined text-3xl animate-spin text-[#0f4c81]">progress_activity</span>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 card">
          <span className="material-icons-outlined text-5xl text-slate-200">gavel</span>
          <p className="text-on-surface-variant mt-3">No properties found</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl bg-[#0f4c81] text-white text-sm font-semibold hover:bg-[#1565c0] transition">
            Add Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map(a => {
            const st = STATUS_STYLE[a.status] || STATUS_STYLE.available;
            return (
              <div key={a._id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>
                    {a.status === 'under_auction' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1 align-middle" />}
                    {st.label}
                  </span>
                  <span className="text-xs text-on-surface-variant capitalize">{mortgageTypeLabel(a)}</span>
                </div>

                <div>
                  <h3 className="font-montserrat font-bold text-on-surface leading-tight">{a.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                    <span className="material-icons-outlined text-sm">location_on</span>
                    {[a.city, a.area, a.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-on-surface-variant">Price</p>
                    <p className="font-bold text-on-surface">{fmt(a.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Bank</p>
                    <p className="font-semibold text-on-surface text-xs truncate">{a.bankName || '—'}</p>
                  </div>
                  {a.bedrooms > 0 && (
                    <div>
                      <p className="text-xs text-on-surface-variant">Beds</p>
                      <p className="font-semibold text-on-surface">{a.bedrooms} BHK</p>
                    </div>
                  )}
                  {a.area_sqft > 0 && (
                    <div>
                      <p className="text-xs text-on-surface-variant">Area</p>
                      <p className="font-semibold text-on-surface">{a.area_sqft?.toLocaleString()} sqft</p>
                    </div>
                  )}
                </div>

                {a.auctionDate && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <span className="material-icons-outlined text-sm">event</span>
                    Auction: {new Date(a.auctionDate).toLocaleDateString('en-IN')}
                  </p>
                )}

                {a.status === 'sold' && a.bookedPrice != null && (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="material-icons-outlined text-sm">check_circle</span>
                    Sold at {fmt(a.bookedPrice)}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {(a.visibleTo || []).map(role => {
                    const opt = VISIBLE_OPTS.find(o => o.key === role);
                    return (
                      <span key={role} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${opt?.color || 'bg-slate-100 text-slate-600'}`}>
                        {role}
                      </span>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1 border-t border-outline-variant">
                  <button onClick={() => openEdit(a)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#0f4c81]/30 text-[#0f4c81] text-xs font-semibold hover:bg-[#0f4c81]/5 transition">
                    <span className="material-icons-outlined text-sm">edit</span> Edit
                  </button>
                  <button onClick={() => handleDelete(a._id)}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition">
                    <span className="material-icons-outlined text-sm">delete_outline</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => fetchProps(page - 1)} disabled={page <= 1}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-40">
            <span className="material-icons-outlined text-sm">chevron_left</span>
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchProps(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold transition
                ${p === page ? 'bg-[#0f4c81] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => fetchProps(page + 1)} disabled={page >= pages}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-40">
            <span className="material-icons-outlined text-sm">chevron_right</span>
          </button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-montserrat font-bold text-lg text-slate-800">
                {editId ? 'Edit Listing' : 'Add Auction Property'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 -mr-1">
                <span className="material-icons-outlined text-slate-400">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {msg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold">{msg}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Title *</label>
                  <input name="title" required value={form.title} onChange={handleChange} placeholder="e.g. 3BHK Flat – HDFC Bank Repo, Andheri" className={inp} />
                </div>
                <div ref={cityWrapRef} className="relative">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City *</label>
                  <input name="city" required value={form.city} onChange={handleCityChange}
                    onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                    autoComplete="off" placeholder="Jaipur" className={inp} />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <ul className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                      {citySuggestions.map((s, i) => (
                        <li key={i}>
                          <button type="button" onMouseDown={() => pickCity(s)}
                            className="w-full text-left px-3 py-2.5 hover:bg-[#0f4c81]/5 flex items-center gap-2 text-sm">
                            <span className="material-icons-outlined text-sm text-slate-400">location_on</span>
                            <span className="text-slate-800 font-medium">{s.label}</span>
                            <span className="text-slate-400 text-xs ml-auto">{s.state}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area</label>
                  <input name="area" value={form.area} onChange={handleChange} placeholder="Andheri West" className={inp} />
                </div>
                <div ref={pincodeWrapRef} className="relative">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handlePincodeChange}
                    onFocus={() => form.pincode.trim().length >= 3 && setShowPincodeSuggestions(true)}
                    autoComplete="off" placeholder="302001" inputMode="numeric" className={inp} />
                  {showPincodeSuggestions && pincodeSuggestions.length > 0 && (
                    <ul className="absolute z-20 top-full mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
                      {pincodeSuggestions.map(pin => (
                        <li key={pin}>
                          <button type="button" onMouseDown={() => pickPincode(pin)}
                            className="w-full text-left px-3 py-2 hover:bg-[#0f4c81]/5 text-sm text-slate-800 font-medium">
                            {pin}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {getPincodeEntryForCity(form.city) && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Valid range{getPincodeEntryForCity(form.city).pincodes.length > 1 ? 's' : ''} for {form.city}: {getPincodeEntryForCity(form.city).pincodes.join(', ')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className={inp}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                {form.type === 'other' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Custom Type *</label>
                    <input name="customType" required value={form.customType} onChange={handleChange}
                      placeholder="e.g. Duplex" className={inp} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inp}>
                    <option value="available">Available</option>
                    <option value="under_auction">Under Auction</option>
                    <option value="sold">Sold</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Price (₹) *</label>
                  <input name="price" type="number" required value={form.price} onChange={handleChange} placeholder="12000000" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bank Name</label>
                  <input name="bankName" value={form.bankName} onChange={handleChange} placeholder="HDFC Bank" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Bank Commission % <span className="normal-case font-normal text-slate-300">(optional)</span>
                  </label>
                  <input name="commissionBankPct" type="number" min="0" max="100" step="0.1"
                    value={form.commissionBankPct} onChange={handleChange} placeholder="e.g. 0.5" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Auction Date</label>
                  <input name="auctionDate" type="date" value={form.auctionDate} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact Phone</label>
                  <input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="9988776655" className={inp} />
                </div>
                {showMortgageField(form.type, 'bedrooms') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bedrooms</label>
                    <input name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange} placeholder="3" className={inp} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area (sqft)</label>
                  <input name="area_sqft" type="number" value={form.area_sqft} onChange={handleChange} placeholder="1100" className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</label>
                  <textarea name="description" rows={2} value={form.description} onChange={handleChange}
                    placeholder="Bank repossessed property. Reserve price below market…" className={`${inp} resize-none`} />
                </div>

                {/* Extra expected prices by locality/area (optional) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Expected Prices by Locality / Area <span className="normal-case font-normal text-slate-300">(optional)</span>
                    </label>
                    <button type="button" onClick={addLocalityPrice}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0f4c81] hover:underline">
                      <span className="material-icons-outlined text-sm">add</span> Add price
                    </button>
                  </div>
                  {(form.localityPrices || []).length === 0 && (
                    <p className="text-xs text-slate-400">Add expected prices for other localities/areas of this deal.</p>
                  )}
                  <div className="space-y-2">
                    {(form.localityPrices || []).map((row, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <input value={row.area} onChange={e => updateLocalityPrice(i, 'area', e.target.value)}
                          placeholder="Locality / Area" className={`${inp} flex-1 min-w-[120px]`} />
                        <input value={row.pincode} onChange={e => updateLocalityPrice(i, 'pincode', e.target.value)}
                          placeholder="Pincode" maxLength={6} className={`${inp} w-28`} />
                        <input type="number" value={row.expectedPrice} onChange={e => updateLocalityPrice(i, 'expectedPrice', e.target.value)}
                          placeholder="Expected ₹" className={`${inp} w-36`} />
                        <button type="button" onClick={() => removeLocalityPrice(i)}
                          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200">
                          <span className="material-icons-outlined text-base">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="border-t border-slate-100 pt-4">
                <MediaUploader
                  images={formImages}
                  onImages={setFormImages}
                  video={formVideo}
                  onVideo={setFormVideo}
                  folder="a1deal/mortgage"
                  showVideo
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Visible To</label>
                <div className="flex flex-wrap gap-3">
                  {VISIBLE_OPTS.map(o => (
                    <label key={o.key} className="flex items-center gap-2 py-1.5 cursor-pointer">
                      <input type="checkbox" checked={form.visibleTo.includes(o.key)} onChange={() => toggleVisible(o.key)} className="w-4 h-4 accent-[#0f4c81]" />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${form.visibleTo.includes(o.key) ? o.color : 'text-slate-400'}`}>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-3 -mx-4 sm:-mx-6 px-4 sm:px-6 -mb-4 sm:-mb-6 pb-4 sm:pb-6 border-t border-slate-100">
                <button type="submit" disabled={saving}
                  className="w-full py-3 rounded-xl bg-[#0f4c81] text-white font-bold text-sm hover:bg-[#1565c0] transition disabled:opacity-60">
                  {saving ? 'Saving…' : editId ? 'Update Listing' : 'Add Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
