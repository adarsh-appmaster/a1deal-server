import { useState, useEffect, useMemo, useRef } from 'react';
import WhatsAppGroupCard from '../../../components/common/WhatsAppGroupCard';
import { useAuth } from '../../../context/AuthContext';
import { useSocket, negoRoom } from '../../../context/SocketContext';
import ChatPanel from '../../../components/common/ChatPanel';
import api from '../../../api/axios';
import { searchLocations } from '../../../data/indiaLocations';
import { validateForm } from '../../../validation/validate';
import { brokerListingSchema } from '../../../validation/schemas';
import { useConfirm } from '../../../hooks/useConfirm';

const STATUS = {
  active:      { label: 'Active',      color: 'bg-emerald-100 text-emerald-700' },
  under_offer: { label: 'Under Offer', color: 'bg-amber-100 text-amber-700' },
  sold:        { label: 'Sold',        color: 'bg-slate-100 text-slate-600' },
};

// ── Property type groups ──────────────────────────────────────────────────
const TYPES_RESIDENTIAL = ['Apartment', 'Penthouse', 'Row House'];
const TYPES_INDEPENDENT = ['Villa', 'Bungalow'];
const TYPES_STUDIO      = ['Studio'];
const TYPES_PLOT        = ['Plot', 'Agricultural Land'];
const TYPES_COMMERCIAL  = ['Commercial', 'Office', 'Shop', 'Warehouse', 'Showroom'];

// Fields that each group supports
function typeFeatures(t) {
  if (TYPES_PLOT.includes(t))
    return { hasBeds: false, hasBaths: false, hasFloor: false, hasFloors: false, hasFurnish: false, hasParking: false, hasFacing: true,  areaLabel: 'Plot Area (sq yd)' };
  if (TYPES_COMMERCIAL.includes(t))
    return { hasBeds: false, hasBaths: false, hasFloor: true,  hasFloors: true,  hasFurnish: false, hasParking: true,  hasFacing: false, areaLabel: 'Carpet Area (sqft)' };
  if (TYPES_STUDIO.includes(t))
    return { hasBeds: false, hasBaths: true,  hasFloor: true,  hasFloors: true,  hasFurnish: true,  hasParking: true,  hasFacing: true,  areaLabel: 'Area (sqft)' };
  if (TYPES_INDEPENDENT.includes(t))
    return { hasBeds: true,  hasBaths: true,  hasFloor: false, hasFloors: true,  hasFurnish: true,  hasParking: true,  hasFacing: true,  areaLabel: 'Area (sqft)' };
  // Residential default
  return   { hasBeds: true,  hasBaths: true,  hasFloor: true,  hasFloors: true,  hasFurnish: true,  hasParking: true,  hasFacing: true,  areaLabel: 'Area (sqft)' };
}

function BLANK_FORM(zone) {
  return {
    title: '', propertyType: 'Apartment', listingType: 'sale',
    city: zone?.city || '', address: '', landmark: '', pincode: zone?.pincode || '',
    price: '', beds: '', baths: '', sqft: '', floor: '', totalFloors: '',
    furnishing: '', facing: '', parking: '', description: '',
  };
}

const INP = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-portal-broker/30 focus:border-portal-broker bg-white';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
        {label}{required && ' *'}
      </label>
      {children}
    </div>
  );
}

// Grouped type chip-picker
function TypeSelector({ value, onChange }) {
  const groups = [
    { label: 'Residential Flat',  types: TYPES_RESIDENTIAL },
    { label: 'Independent House', types: TYPES_INDEPENDENT },
    { label: 'Studio',            types: TYPES_STUDIO },
    { label: 'Plot / Land',       types: TYPES_PLOT },
    { label: 'Commercial',        types: TYPES_COMMERCIAL },
  ];
  return (
    <div className="space-y-2.5">
      {groups.map(g => (
        <div key={g.label}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{g.label}</p>
          <div className="flex flex-wrap gap-2">
            {g.types.map(t => (
              <button
                key={t} type="button" onClick={() => onChange(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${value === t
                    ? 'bg-portal-broker text-white border-portal-broker shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-portal-broker hover:text-portal-broker'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Lead status helpers ───────────────────────────────────────────────────
const LEAD_STATUSES = [
  { value: 'new',         label: 'New',         color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted',   label: 'Contacted',   color: 'bg-amber-100 text-amber-700' },
  { value: 'site_visit',  label: 'Site Visit',  color: 'bg-purple-100 text-purple-700' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-orange-100 text-orange-700' },
  { value: 'closed_won',  label: 'Won',         color: 'bg-emerald-100 text-emerald-700' },
  { value: 'closed_lost', label: 'Lost',        color: 'bg-slate-100 text-slate-600' },
];
const LEAD_SOURCES = ['manual', 'whatsapp', 'website', 'referral', 'walk_in', 'email'];

function leadStatusColor(s) {
  return LEAD_STATUSES.find(x => x.value === s)?.color || 'bg-slate-100 text-slate-600';
}
function leadStatusLabel(s) {
  return LEAD_STATUSES.find(x => x.value === s)?.label || s;
}

const BLANK_LEAD = { name: '', phone: '', email: '', source: 'manual', status: 'new', budget: '' };

function PropertyLeadsModal({ listing, onClose }) {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(BLANK_LEAD);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get(`/broker/listings/${listing._id}/leads`)
      .then(r => setLeads(r.data?.leads || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [listing._id]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setError('Name and phone are required.'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await api.post(`/broker/listings/${listing._id}/leads`, {
        ...form, budget: form.budget ? Number(form.budget) : undefined,
      });
      setLeads(prev => [data.lead, ...prev]);
      setForm(BLANK_LEAD);
      setShowAdd(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lead.');
    }
    setSaving(false);
  }

  async function changeStatus(leadId, status) {
    await api.patch(`/broker/listings/${listing._id}/leads/${leadId}`, { status }).catch(() => {});
    setLeads(prev => prev.map(l => l._id === leadId ? { ...l, status } : l));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-6 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-montserrat font-bold text-lg text-slate-800">Leads</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{listing.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowAdd(v => !v); setError(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-portal-broker text-white text-xs font-semibold hover:bg-[#e04e53] transition">
              <span className="material-icons-outlined text-sm">{showAdd ? 'close' : 'person_add'}</span>
              {showAdd ? 'Cancel' : 'Add Lead'}
            </button>
            <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Add lead form */}
          {showAdd && (
            <form onSubmit={handleAdd} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">New Lead</p>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Name *</label>
                  <input className={INP} placeholder="Client name" value={form.name}
                    onChange={e => setF('name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone *</label>
                  <input className={INP} placeholder="Mobile number" value={form.phone}
                    onChange={e => setF('phone', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                  <input className={INP} type="email" placeholder="optional" value={form.email}
                    onChange={e => setF('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Budget (₹)</label>
                  <input className={INP} type="number" placeholder="e.g. 5000000" value={form.budget}
                    onChange={e => setF('budget', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Source</label>
                  <select className={INP} value={form.source} onChange={e => setF('source', e.target.value)}>
                    {LEAD_SOURCES.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                  <select className={INP} value={form.status} onChange={e => setF('status', e.target.value)}>
                    {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-2.5 rounded-xl bg-portal-broker text-white text-sm font-semibold hover:bg-[#e04e53] transition disabled:opacity-50">
                {saving ? 'Adding…' : 'Add Lead'}
              </button>
            </form>
          )}

          {/* Leads list */}
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : leads.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <span className="material-icons-outlined text-4xl text-slate-200 mb-2">group_add</span>
              <p className="font-semibold text-slate-600 mb-1">No leads yet</p>
              <p className="text-sm text-slate-400">Add a lead above to track interest in this property</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map(l => (
                <div key={l._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <span className="material-icons-outlined text-portal-broker text-base">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800">{l.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{l.phone}</span>
                      {l.email && <span>{l.email}</span>}
                      {l.budget && <span>₹{Number(l.budget).toLocaleString('en-IN')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${leadStatusColor(l.status)}`}>
                      {leadStatusLabel(l.status)}
                    </span>
                    <select
                      value={l.status}
                      onChange={e => changeStatus(l._id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:border-portal-broker"
                    >
                      {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <a href={`tel:${l.phone}`}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
                      <span className="material-icons-outlined text-sm">call</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddListingModal({ myAreas, onClose, onAdded }) {
  const { user } = useAuth();

  // Sub-broker = has masterBroker set; master broker = brokerTier is 'master'.
  // Listings are commission-free but pincode-gated: every broker may only list in
  // pincodes approved for them, so all brokers get the locked chip UI built from
  // their approved zones (home + coverage + admin/master-granted areas).
  const isMasterBroker = user?.brokerTier === 'master';
  const useLockedZones = true;

  // Build locked zones for sub-brokers and master brokers
  const lockedZones = useMemo(() => {
    if (!useLockedZones) return [];
    const list = [];
    const seen = new Set();
    function add(z, label) {
      if (!z?.city) return;
      const key = `${z.city}|${z.area || ''}|${z.pincode || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ city: z.city, area: z.area || '', pincode: z.pincode || '', label });
    }
    add({ city: user?.city, area: user?.area, pincode: user?.pincode }, 'Home');
    for (const ca of (user?.coverageAreas || [])) add(ca, null);
    for (const aa of (user?.additionalAreas || [])) add(aa, aa.label || null);
    for (const aa of (myAreas?.additionalAreas || [])) add(aa, aa.label || null);
    return list;
  }, [useLockedZones, user, myAreas]);

  // State for sub-broker locked zone selection
  const [selectedZone, setSelectedZone] = useState(() => lockedZones[0] || null);

  // ── Location state (free-form broker) ──────────────────────────────────────
  const [locCity, setLocCity]         = useState('');
  const [locAddress, setLocAddress]   = useState('');
  const [locLandmark, setLocLandmark] = useState('');
  const [locPincode, setLocPincode]   = useState('');
  const [citySugg, setCitySugg]       = useState([]);
  const [showCitySugg, setShowCitySugg] = useState(false);
  const [pinSugg, setPinSugg]         = useState([]);
  const [showPinSugg, setShowPinSugg] = useState(false);
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const pinTimer = useMemo(() => ({ t: null }), []);

  function handleCityInput(val) {
    setLocCity(val);
    setLocPincode(''); setPincodeInfo(null); setPinSugg([]);
    if (val.trim().length >= 2) {
      const results = searchLocations(val).filter(s => s.state === 'Rajasthan');
      setCitySugg(results);
      setShowCitySugg(true);
    } else {
      setCitySugg([]); setShowCitySugg(false);
    }
  }

  function selectCity(label, state) {
    setLocCity(label);
    setShowCitySugg(false);
    // Fetch pincodes for this city from coverage-map
    api.get('/master-broker/coverage-map', { params: { city: label } })
      .then(r => setPinSugg(r.data?.coverage || []))
      .catch(() => setPinSugg([]));
    // Trigger master-broker check
    triggerAreaCheck(locPincode, label);
  }

  function triggerAreaCheck(pincode, city) {
    setPincodeInfo(null);
    clearTimeout(pinTimer.t);
    const pin = (pincode ?? locPincode).trim();
    const cty = (city   ?? locCity).trim();
    if (pin.length >= 4 || cty.length >= 2) {
      pinTimer.t = setTimeout(async () => {
        setCheckingPin(true);
        try {
          const params = {};
          if (pin) params.pincode = pin;
          if (cty) params.city    = cty;
          const { data } = await api.get('/broker/pincode-check', { params });
          setPincodeInfo(data);
        } catch { setPincodeInfo(null); }
        setCheckingPin(false);
      }, 500);
    }
  }

  function handlePincodeChange(val) {
    setLocPincode(val);
    setShowPinSugg(false);
    triggerAreaCheck(val, locCity);
  }

  function selectPincode(pin) {
    setLocPincode(pin);
    setShowPinSugg(false);
    triggerAreaCheck(pin, locCity);
  }

  // ── Media state ─────────────────────────────────────────────────────────────
  const [images, setImages]       = useState([]); // [{url, preview}]
  const [video, setVideo]         = useState(null); // {url, name}
  const [imgUploading, setImgUploading] = useState(false);
  const [vidUploading, setVidUploading] = useState(false);

  async function handleImageFiles(files) {
    const arr = Array.from(files).slice(0, 10 - images.length);
    if (!arr.length) return;
    setImgUploading(true);
    const fd = new FormData();
    arr.forEach(f => fd.append('images', f));
    fd.append('folder', 'a1deal/broker-listings');
    try {
      const { data } = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const uploaded = (data.urls || []).map((u, i) => ({
        url: u.url,
        preview: URL.createObjectURL(arr[i]),
      }));
      setImages(prev => [...prev, ...uploaded]);
    } catch { /* silent */ }
    setImgUploading(false);
  }

  async function handleVideoFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Video must be under 10 MB. Please compress or trim it first.');
      return;
    }
    setVidUploading(true);
    const fd = new FormData();
    fd.append('video', file);
    fd.append('folder', 'a1deal/broker-listings');
    try {
      const { data } = await api.post('/upload/video', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setVideo({ url: data.url, name: file.name });
    } catch { /* silent */ }
    setVidUploading(false);
  }

  const [form, setForm]     = useState(BLANK_FORM(null));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const ft  = typeFeatures(form.propertyType);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function pickZone(z) {
    setSelectedZone(z);
  }

  function changeType(t) {
    setForm(f => ({
      ...BLANK_FORM(null),
      title: f.title, price: f.price, listingType: f.listingType,
      description: f.description, propertyType: t,
    }));
  }

  const effectiveCity    = useLockedZones ? (selectedZone?.city    || '') : locCity;
  const effectivePincode = useLockedZones ? (selectedZone?.pincode || '') : locPincode;

  async function handleSubmit(e) {
    e.preventDefault();
    if (useLockedZones && !selectedZone) { setError('Please select your pincode first.'); return; }
    if (!useLockedZones && !locCity.trim()) { setError('City is required.'); return; }
    if (!form.title.trim() || !form.price) { setError('Title and price are required.'); return; }

    setSaving(true); setError('');
    try {
      const payload = {
        title:        form.title,
        propertyType: form.propertyType,
        listingType:  form.listingType,
        city:         effectiveCity,
        address:      locAddress.trim()  || undefined,
        landmark:     locLandmark.trim() || undefined,
        pincode:      effectivePincode   || undefined,
        price:        Number(form.price),
        sqft:         form.sqft        || undefined,
        description:  form.description || undefined,
        ...(ft.hasBeds    && { beds:        form.beds        ? Number(form.beds)        : undefined }),
        ...(ft.hasBaths   && { baths:       form.baths       ? Number(form.baths)       : undefined }),
        ...(ft.hasFloor   && { floor:       form.floor       ? Number(form.floor)       : undefined }),
        ...(ft.hasFloors  && { totalFloors: form.totalFloors ? Number(form.totalFloors) : undefined }),
        ...(ft.hasFurnish && { furnishing:  form.furnishing  || undefined }),
        ...(ft.hasFacing  && { facing:      form.facing      || undefined }),
        ...(ft.hasParking && { parking:     form.parking     ? Number(form.parking)     : undefined }),
        images: images.map(i => i.url),
        video:  video?.url || '',
      };
      const { errors } = validateForm(brokerListingSchema, payload);
      if (errors) { setError(Object.values(errors)[0]); setSaving(false); return; }
      const { data } = await api.post('/broker/listings', payload);
      onAdded(data.listing);
      if (data.pendingApproval) {
        const territory = effectivePincode || effectiveCity;
        alert(`Listing submitted for approval!\n\n${territory} is managed by ${pincodeInfo?.masterBroker?.name || 'a master broker'}. Your listing will go live once they approve it.`);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add listing.');
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-6 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-montserrat font-bold text-lg text-slate-800">Add New Listing</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[82vh]">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>
          )}

          {/* ── Location Section ── */}
          {useLockedZones ? (
            /* Sub-broker / master broker: locked to assigned pincodes */
            <div className={`p-4 rounded-xl border space-y-3 ${!selectedZone ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-amber-500 text-base">location_on</span>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  {lockedZones.length === 0 ? 'No pincode assigned' : lockedZones.length === 1 ? 'Your assigned pincode' : `Select pincode (${lockedZones.length} available)`}
                </p>
              </div>
              {lockedZones.length === 0 && (
                <p className="text-xs text-rose-600">
                  {isMasterBroker
                    ? 'No coverage areas set on your account. Ask admin to assign your zones.'
                    : 'No pincodes assigned to your account. Contact your master broker or admin.'}
                </p>
              )}
              {lockedZones.length === 1 && (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold">
                  <span className="material-icons-outlined text-base">check_circle</span>
                  <div>
                    <p>{lockedZones[0].city}{lockedZones[0].area ? ` · ${lockedZones[0].area}` : ''}</p>
                    {lockedZones[0].pincode && <p className="text-xs opacity-80 font-normal">{lockedZones[0].pincode}</p>}
                  </div>
                </div>
              )}
              {lockedZones.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {lockedZones.map((z, i) => {
                    const active = selectedZone?.city === z.city && selectedZone?.pincode === z.pincode && selectedZone?.area === z.area;
                    return (
                      <button key={i} type="button" onClick={() => pickZone(z)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                          ${active ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-amber-200 text-amber-700 hover:border-amber-400'}`}>
                        <span className="material-icons-outlined text-[13px]">{active ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                        {z.city}{z.area ? ` · ${z.area}` : ''}
                        {z.pincode && <span className={`ml-1 ${active ? 'opacity-80' : 'text-amber-500'}`}>({z.pincode})</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Normal broker: autocomplete city → area → pincode */
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-slate-500 text-base">location_on</span>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Location</p>
              </div>
              {/* Address row — full width */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Address *</label>
                  <input className={INP} placeholder="e.g. 12, MG Road, Near Bus Stand"
                    value={locAddress} onChange={e => setLocAddress(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Landmark <span className="font-normal text-slate-300">(optional)</span></label>
                  <input className={INP} placeholder="e.g. Near City Mall"
                    value={locLandmark} onChange={e => setLocLandmark(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">

                {/* City autocomplete */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">City *</label>
                  <input className={INP} placeholder="e.g. Udaipur" value={locCity}
                    onChange={e => handleCityInput(e.target.value)}
                    onBlur={() => setTimeout(() => setShowCitySugg(false), 150)}
                    onFocus={() => locCity.trim().length >= 2 && setShowCitySugg(true)}
                    autoComplete="off" required />
                  {showCitySugg && citySugg.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-sm">
                      {citySugg.map((s, i) => (
                        <li key={i}>
                          <button type="button" onMouseDown={() => selectCity(s.label, s.state)}
                            className="w-full text-left px-3 py-2 hover:bg-violet-50 hover:text-violet-700 flex items-center justify-between gap-2">
                            <span>{s.label}</span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{s.state}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Pincode — typed input + dropdown suggestions from coverage-map */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Pincode</label>
                  <div className="relative">
                    <input className={INP} placeholder="e.g. 411045" value={locPincode}
                      onChange={e => handlePincodeChange(e.target.value)}
                      onFocus={() => pinSugg.length > 0 && setShowPinSugg(true)}
                      onBlur={() => setTimeout(() => setShowPinSugg(false), 150)}
                      maxLength={10} autoComplete="off" />
                    {checkingPin && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 material-icons-outlined text-slate-400 text-sm animate-spin">refresh</span>
                    )}
                    {!checkingPin && pinSugg.length > 0 && (
                      <button type="button" onClick={() => setShowPinSugg(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 material-icons-outlined text-slate-400 text-sm">
                        expand_more
                      </button>
                    )}
                  </div>
                  {showPinSugg && pinSugg.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-xs">
                      {pinSugg.map((p, i) => (
                        <li key={i}>
                          <button type="button" onMouseDown={() => selectPincode(p.pincode)}
                            className="w-full text-left px-3 py-2 hover:bg-violet-50 flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-700">{p.pincode}</span>
                            {p.masterBroker
                              ? <span className="text-amber-600 font-semibold">{p.masterBroker.name} (master)</span>
                              : <span className="text-emerald-600">Free</span>
                            }
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* Territory ownership notice */}
              {pincodeInfo?.masterBroker && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="material-icons-outlined text-amber-600 text-base flex-shrink-0 mt-0.5">warning</span>
                    <div>
                      <p className="font-semibold">
                        {locPincode.trim() ? 'Pincode' : (locCity.trim() || 'This city')} is managed by {pincodeInfo.masterBroker.name}
                      </p>
                      <p className="mt-0.5 text-amber-700">Your listing will go for approval. Once submitted you can challenge the terms in chat.</p>
                    </div>
                  </div>
                </div>
              )}
              {pincodeInfo?.masterBroker === null && (locPincode.trim().length >= 4 || locCity.trim().length >= 2) && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs">
                  <span className="material-icons-outlined text-sm">check_circle</span>
                  Free territory — your listing will go live immediately.
                </div>
              )}
            </div>
          )}

          {/* ── Property Type ── */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Property Type *</p>
            <TypeSelector value={form.propertyType} onChange={changeType} />
          </div>

          {/* ── Title + Listing type ── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Title" required>
                <input className={INP} value={form.title} onChange={e => set('title', e.target.value)} required
                  placeholder={
                    TYPES_PLOT.includes(form.propertyType)       ? 'e.g. Residential Plot — Sector 12' :
                    TYPES_COMMERCIAL.includes(form.propertyType) ? 'e.g. Ground Floor Office — BKC' :
                    TYPES_STUDIO.includes(form.propertyType)     ? 'e.g. Studio Apartment — Powai' :
                    'e.g. Skyline Residences 3BHK'
                  } />
              </Field>
            </div>
            <div>
              <Field label="For">
                <select className={INP} value={form.listingType} onChange={e => set('listingType', e.target.value)}>
                  <option value="sale">Sale</option>
                  <option value="lease">Lease</option>
                </select>
              </Field>
            </div>
          </div>

          {/* ── Price ── */}
          <Field label="Price (₹)" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
              <input className={INP + ' pl-7'} type="number" placeholder="e.g. 5000000"
                value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
          </Field>

          {/* ── Type-specific fields ── */}
          <div className="grid grid-cols-2 gap-3">
            {ft.hasBeds && (
              <Field label="Bedrooms">
                <select className={INP} value={form.beds} onChange={e => set('beds', e.target.value)}>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} BHK</option>)}
                  <option value="7">7+ BHK</option>
                </select>
              </Field>
            )}

            {ft.hasBaths && (
              <Field label="Bathrooms">
                <select className={INP} value={form.baths} onChange={e => set('baths', e.target.value)}>
                  <option value="">Select</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  <option value="6">6+</option>
                </select>
              </Field>
            )}

            <Field label={ft.areaLabel}>
              <input className={INP} type="number" min="0"
                placeholder={TYPES_PLOT.includes(form.propertyType) ? 'e.g. 200' : 'e.g. 1200'}
                value={form.sqft} onChange={e => set('sqft', e.target.value)} />
            </Field>

            {ft.hasFloor && (
              <Field label="Floor No.">
                <input className={INP} type="number" min="0" placeholder="e.g. 4"
                  value={form.floor} onChange={e => set('floor', e.target.value)} />
              </Field>
            )}

            {ft.hasFloors && (
              <Field label="Total Floors">
                <input className={INP} type="number" min="1" placeholder="e.g. 12"
                  value={form.totalFloors} onChange={e => set('totalFloors', e.target.value)} />
              </Field>
            )}

            {ft.hasFurnish && (
              <Field label="Furnishing">
                <select className={INP} value={form.furnishing} onChange={e => set('furnishing', e.target.value)}>
                  <option value="">Select</option>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi">Semi Furnished</option>
                  <option value="fully">Fully Furnished</option>
                </select>
              </Field>
            )}

            {ft.hasFacing && (
              <Field label="Facing">
                <select className={INP} value={form.facing} onChange={e => set('facing', e.target.value)}>
                  <option value="">Select</option>
                  {['North','South','East','West','North-East','North-West','South-East','South-West'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
            )}

            {ft.hasParking && (
              <Field label="Parking Spots">
                <select className={INP} value={form.parking} onChange={e => set('parking', e.target.value)}>
                  <option value="">None</option>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
            )}
          </div>

          {/* ── Description ── */}
          <Field label="Description">
            <textarea className={INP + ' resize-none'} rows={3}
              placeholder="Key features, amenities, highlights…"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>

          {/* ── Images ── */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-slate-500 text-base">photo_library</span>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Photos</p>
              </div>
              <span className="text-[10px] text-slate-400">{images.length}/10 · max 10 MB each</span>
            </div>

            {/* Thumbnail grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                    <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span className="material-icons-outlined text-[11px]">close</span>
                    </button>
                  </div>
                ))}
                {imgUploading && (
                  <div className="aspect-square rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <span className="material-icons-outlined text-slate-400 text-xl animate-spin">refresh</span>
                  </div>
                )}
              </div>
            )}

            {/* Drop / click zone */}
            {images.length < 10 && (
              <label
                className="flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-slate-200 hover:border-violet-400 hover:bg-violet-50 rounded-xl cursor-pointer transition-all"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleImageFiles(e.dataTransfer.files); }}>
                <input type="file" multiple accept="image/*" className="hidden"
                  onChange={e => handleImageFiles(e.target.files)} />
                {imgUploading
                  ? <span className="material-icons-outlined text-violet-400 text-2xl animate-spin">refresh</span>
                  : <span className="material-icons-outlined text-slate-300 text-3xl">add_photo_alternate</span>
                }
                <p className="text-xs text-slate-400">{imgUploading ? 'Uploading…' : 'Click or drag photos here'}</p>
              </label>
            )}
          </div>

          {/* ── Video ── */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-slate-500 text-base">videocam</span>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Video Tour</p>
              <span className="text-[10px] text-slate-400 ml-auto">max 10 MB</span>
            </div>

            {video
              ? (
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm">
                  <span className="material-icons-outlined text-violet-500 flex-shrink-0">movie</span>
                  <span className="flex-1 text-slate-700 truncate text-xs">{video.name}</span>
                  <button type="button" onClick={() => setVideo(null)}
                    className="material-icons-outlined text-slate-400 hover:text-rose-500 text-base flex-shrink-0">
                    delete
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 w-full py-5 border-2 border-dashed border-slate-200 hover:border-violet-400 hover:bg-violet-50 rounded-xl cursor-pointer transition-all">
                  <input type="file" accept="video/*" className="hidden"
                    onChange={e => e.target.files[0] && handleVideoFile(e.target.files[0])} />
                  {vidUploading
                    ? <span className="material-icons-outlined text-violet-400 text-2xl animate-spin">refresh</span>
                    : <span className="material-icons-outlined text-slate-300 text-3xl">video_call</span>
                  }
                  <p className="text-xs text-slate-400">{vidUploading ? 'Uploading…' : 'Click to add a video tour'}</p>
                </label>
              )
            }
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-portal-broker text-white text-sm font-semibold hover:bg-[#e04e53] transition disabled:opacity-50">
              {saving ? 'Adding…' : `Add ${form.propertyType}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Inline master-broker actions shown on territory listing cards ──────────
function TerritoryActions({ listing, onOpenChat, onDecided }) {
  const brokerId   = listing.broker?._id || listing.broker;
  const brokerName = listing.broker?.name || 'Broker';
  const [rate, setRate]         = useState('');
  const [rateType, setRateType] = useState('percent');
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy]         = useState(null);
  const [err, setErr]           = useState('');

  async function decide(action) {
    if (action === 'approve' && !rate) { setErr('Enter a commission rate first.'); return; }
    setBusy(action); setErr('');
    try {
      const body = action === 'approve'
        ? { rate: Number(rate), rateType }
        : {};
      await api.patch(`/broker/commission-requests/${listing._id}/${action}`, body);
      onDecided?.(listing._id, action);
    } catch (e) {
      setErr(e.response?.data?.message || 'Action failed.');
    }
    setBusy(null);
  }

  if (!expanded) {
    return (
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button onClick={() => onOpenChat?.(brokerId, brokerName)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-violet-200 text-violet-600 text-xs font-semibold hover:bg-violet-50 transition whitespace-nowrap">
          <span className="material-icons-outlined text-sm">forum</span>Challenge
        </button>
        <button onClick={() => setExpanded(true)}
          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition whitespace-nowrap">
          Set &amp; Approve
        </button>
        <button onClick={() => decide('reject')} disabled={busy === 'reject'}
          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition disabled:opacity-50 whitespace-nowrap">
          {busy === 'reject' ? '…' : 'Reject'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
      {err && <p className="text-[10px] text-rose-600">{err}</p>}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
        <input type="number" min="0" step="0.01" value={rate}
          onChange={e => setRate(e.target.value)}
          placeholder={rateType === 'percent' ? 'Rate' : 'Amount'}
          className="flex-1 px-2 py-1.5 text-xs focus:outline-none w-16" />
        <select value={rateType} onChange={e => setRateType(e.target.value)}
          className="px-1.5 py-1.5 text-[10px] border-l border-slate-200 bg-slate-50 focus:outline-none">
          <option value="percent">%</option>
          <option value="flat">₹</option>
        </select>
      </div>
      <button onClick={() => decide('approve')} disabled={!!busy}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
        {busy === 'approve' ? '…' : 'Approve'}
      </button>
      <button onClick={() => setExpanded(false)}
        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition">
        Cancel
      </button>
    </div>
  );
}

// ── Commission request card shown to master brokers ──────────────────────
// ── Broker-side actions on a pending listing awaiting master broker approval ──
function PendingOfferActions({ listing, onOpenChat, onWithdrawn, onAccepted }) {
  const mb     = listing.commissionRequest?.masterBroker;
  const mbId   = mb?._id   || mb;
  const mbName = mb?.name  || 'Master Broker';
  const [busy, setBusy]   = useState(null); // 'accept' | 'withdraw'
  const [done, setDone]   = useState('');
  const accepted = listing.commissionRequest?.brokerAccepted;
  const { confirm, dialog } = useConfirm();

  async function handleAccept() {
    setBusy('accept');
    try {
      await api.patch(`/broker/listings/${listing._id}/accept-offer`);
      // Notify master broker via chat
      const brokerId = listing.broker?._id || listing.broker;
      const room = negoRoom(String(brokerId), String(mbId));
      await api.post('/chat/message', {
        room,
        text: `I accept the commission terms for "${listing.title}". Please proceed with approval.`,
      }).catch(() => {});
      setDone('accepted');
      onAccepted?.(listing._id);
    } catch { setDone(''); }
    setBusy(null);
  }

  async function handleWithdraw() {
    if (!(await confirm('Withdraw this listing request? This cannot be undone.', { danger: true, confirmLabel: 'Withdraw' }))) return;
    setBusy('withdraw');
    try {
      await api.patch(`/broker/listings/${listing._id}/withdraw`);
      setDone('withdrawn');
      onWithdrawn?.(listing._id);
    } catch { setDone(''); }
    setBusy(null);
  }

  if (done === 'withdrawn') return null;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {dialog}
      {!accepted ? (
        <button
          onClick={handleAccept}
          disabled={busy === 'accept'}
          className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline disabled:opacity-50"
        >
          <span className="material-icons-outlined text-sm">check_circle</span>
          {busy === 'accept' ? '…' : 'Accept Offer'}
        </button>
      ) : (
        <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
          <span className="material-icons-outlined text-sm">verified</span>
          Accepted
        </span>
      )}
      <button
        onClick={() => onOpenChat?.(mbId, mbName)}
        className="flex items-center gap-1 text-xs text-violet-600 font-semibold hover:underline"
      >
        <span className="material-icons-outlined text-sm">forum</span>
        Challenge in Chat
      </button>
      <button
        onClick={handleWithdraw}
        disabled={busy === 'withdraw'}
        className="flex items-center gap-1 text-xs text-rose-500 font-semibold hover:underline disabled:opacity-50"
      >
        <span className="material-icons-outlined text-sm">cancel</span>
        {busy === 'withdraw' ? '…' : 'Withdraw'}
      </button>
    </div>
  );
}

function CommissionRequestCard({ req, onDecided, onOpenChat }) {
  const [rate, setRate]         = useState('');
  const [rateType, setRateType] = useState('percent');
  const [note, setNote]         = useState('');
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');

  async function decide(action) {
    if (action === 'approve' && !rate) { setErr('Enter commission rate before approving.'); return; }
    setBusy(true); setErr('');
    try {
      const body = action === 'approve'
        ? { rate: Number(rate), rateType, masterNote: note }
        : { masterNote: note };
      await api.patch(`/broker/commission-requests/${req._id}/${action}`, body);
      onDecided(req._id, action);
    } catch (e) {
      setErr(e.response?.data?.message || 'Action failed.');
    }
    setBusy(false);
  }

  const broker = req.broker || {};
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
          <span className="material-icons-outlined text-amber-500">home_work</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-slate-800">{req.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {[req.address, req.city, req.pincode].filter(Boolean).join(', ')} · {req.propertyType}
          </p>
          <p className="text-sm font-bold text-slate-700 mt-1">
            ₹{Number(req.price).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-right text-xs text-slate-400 flex-shrink-0">
          <p className="font-semibold text-slate-700">{broker.name}</p>
          {broker.phone && <p>{broker.phone}</p>}
          {broker.email && <p>{broker.email}</p>}
          {req.commissionRequest?.brokerAccepted && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
              <span className="material-icons-outlined text-[11px]">check_circle</span>
              Broker accepted
            </span>
          )}
        </div>
      </div>

      {err && <p className="text-xs text-rose-600">{err}</p>}

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Commission Rate</label>
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            <input type="number" min="0" step="0.01" value={rate}
              onChange={e => setRate(e.target.value)}
              placeholder={rateType === 'percent' ? 'e.g. 2' : 'e.g. 50000'}
              className="flex-1 px-3 py-2 text-sm focus:outline-none" />
            <select value={rateType} onChange={e => setRateType(e.target.value)}
              className="px-2 py-2 text-xs border-l border-slate-200 bg-slate-50 text-slate-600 focus:outline-none">
              <option value="percent">%</option>
              <option value="flat">₹ flat</option>
            </select>
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Note to broker (optional)</label>
          <input className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="Reason or instructions…" value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => decide('approve')} disabled={busy}
          className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 min-w-[120px]">
          {busy ? '…' : 'Approve & Set Commission'}
        </button>
        <button onClick={() => decide('reject')} disabled={busy}
          className="py-2 px-4 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50 transition disabled:opacity-50">
          {busy ? '…' : 'Reject'}
        </button>
        {onOpenChat && req.broker?._id && (
          <button
            onClick={() => onOpenChat(req.broker._id, req.broker.name)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-violet-200 text-violet-600 text-sm font-semibold hover:bg-violet-50 transition"
          >
            <span className="material-icons-outlined text-base">forum</span>
            Challenge in Chat
          </button>
        )}
      </div>
    </div>
  );
}

export default function PropertyListings() {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Derive master status from the backend (always fresh DB lookup) instead of
  // potentially-stale localStorage user object. A successful territory response
  // means the server confirmed master-broker access; a 403 means it didn't.
  const [isMaster, setIsMaster] = useState(
    user?.brokerTier === 'master' || (user?.role === 'broker' && (user?.coverageAreas?.length > 0))
  );

  // Self-registered brokers can't create/manage listings until their partnership
  // is approved — the backend enforces this too (requirePartnership middleware);
  // this just keeps the button honest about it up front.
  const isLocked = user?.partnershipStatus === 'pending' || user?.partnershipStatus === 'rejected';

  const [tab, setTab]               = useState('listings'); // 'listings' | 'requests'
  const [filter, setFilter]         = useState('all');
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [myAreas, setMyAreas]       = useState({ homeArea: null, additionalAreas: [] });
  const [leadsListing, setLeadsListing] = useState(null);

  // Negotiation chat
  const [chatOpen, setChatOpen]         = useState(false);
  const [chatRoom, setChatRoom]         = useState(null);
  const [chatOther, setChatOther]       = useState('');

  // Open chat with a specific user (by their userId and display name)
  function openChat(otherId, otherName) {
    const room = negoRoom(user.id, otherId);
    setChatRoom(room);
    setChatOther(otherName);
    setChatOpen(true);
  }

  // Master broker: commission requests
  const [commReqs, setCommReqs]         = useState([]);
  const [commLoading, setCommLoading]   = useState(false);

  // Master broker: territory overview
  const [territory, setTerritory]       = useState({ listings: [], pincodes: [], cities: [] });
  const [terrLoading, setTerrLoading]   = useState(false);
  const [terrLoaded, setTerrLoaded]     = useState(false);
  const [terrFilter, setTerrFilter]     = useState('all'); // 'all' | 'pending' | 'approved' | 'not_required'

  function loadTerritory() {
    if (terrLoaded) return;
    setTerrLoading(true);
    api.get('/broker/territory')
      .then(r => { setTerritory(r.data || { listings: [], pincodes: [], cities: [] }); setTerrLoaded(true); })
      .catch(() => {})
      .finally(() => setTerrLoading(false));
  }

  useEffect(() => {
    api.get('/broker/listings')
      .then(r => setListings(r.data?.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));

    api.get('/mortgage-properties/my-areas')
      .then(r => setMyAreas(r.data || { homeArea: null, additionalAreas: [] }))
      .catch(() => {
        if (user?.city || user?.pincode) {
          setMyAreas({
            homeArea: { city: user.city, area: user.area || '', pincode: user.pincode || '' },
            additionalAreas: [],
          });
        }
      });

    // Probe territory endpoint — auth middleware always does a fresh DB lookup,
    // so a 200 response authoritatively confirms master-broker access regardless
    // of what the stale localStorage user object says.
    api.get('/broker/territory')
      .then(r => {
        setIsMaster(true);
        setTerritory(r.data || { listings: [], pincodes: [], cities: [] });
        setTerrLoaded(true);
      })
      .catch(() => setIsMaster(false));

    setCommLoading(true);
    api.get('/broker/commission-requests')
      .then(r => setCommReqs(r.data?.listings || []))
      .catch(() => setCommReqs([]))
      .finally(() => setCommLoading(false));
  }, [user?.id]);

  const filtered = filter === 'all' ? listings : listings.filter(l => l.status === filter);
  const count    = s => listings.filter(l => l.status === s).length;
  const pendingCount = commReqs.filter(r => r.approvalStatus === 'pending').length;

  function handleAdded(listing) {
    setListings(prev => [listing, ...prev]);
  }

  function handleCommDecided(id, action) {
    setCommReqs(prev => prev.map(r =>
      r._id === id ? { ...r, approvalStatus: action === 'approve' ? 'approved' : 'rejected' } : r
    ));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Property Listings</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage your property portfolio in your zone</p>
        </div>
        {tab === 'listings' && (
          <button
            onClick={() => !isLocked && setShowAdd(true)}
            disabled={isLocked}
            title={isLocked ? 'Available once your broker partnership is approved' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition
              ${isLocked
                ? 'bg-surface-container text-on-surface-variant/60 cursor-not-allowed'
                : 'bg-portal-broker text-white hover:bg-[#e04e53]'}`}>
            <span className="material-icons-outlined text-base">{isLocked ? 'lock' : 'add'}</span>
            Add Listing
          </button>
        )}
      </div>

      {/* Tab switcher — only shown for master brokers */}
      {isMaster && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button onClick={() => setTab('listings')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors
              ${tab === 'listings' ? 'bg-portal-broker text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            My Listings
          </button>
          <button onClick={() => { setTab('territory'); loadTerritory(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
              ${tab === 'territory' ? 'bg-violet-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            <span className="material-icons-outlined text-sm">map</span>
            My Territory
          </button>
          <button onClick={() => setTab('requests')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
              ${tab === 'requests' ? 'bg-amber-500 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            <span className="material-icons-outlined text-sm">approval</span>
            Approval Requests
            {pendingCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'requests' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'}`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Commission Requests Tab ── */}
      {tab === 'requests' && isMaster && (
        <div>
          {commLoading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="card h-40 animate-pulse" />)}</div>
          ) : commReqs.length === 0 ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <span className="material-icons-outlined text-5xl text-slate-200 mb-3">task_alt</span>
              <p className="font-semibold text-on-surface mb-1">No commission requests</p>
              <p className="text-sm text-on-surface-variant">Listings from brokers in your pincodes will appear here for approval.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending first */}
              {commReqs.filter(r => r.approvalStatus === 'pending').map(r => (
                <CommissionRequestCard key={r._id} req={r} onDecided={handleCommDecided} onOpenChat={openChat} />
              ))}
              {/* Decided listings */}
              {commReqs.filter(r => r.approvalStatus !== 'pending').length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Decided</p>
                  {commReqs.filter(r => r.approvalStatus !== 'pending').map(r => (
                    <div key={r._id} className="card p-4 flex items-center gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{r.title}</p>
                        <p className="text-xs text-slate-400">{[r.city, r.pincode].filter(Boolean).join(' · ')} · {r.broker?.name}</p>
                      </div>
                      {r.approvalStatus === 'approved' ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Approved {r.commissionRequest?.rate ? `· ${r.commissionRequest.rate}${r.commissionRequest.rateType === 'percent' ? '%' : '₹'}` : ''}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">Rejected</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Territory Tab ── */}
      {tab === 'territory' && isMaster && (
        <div>
          {/* Area chips */}
          {(territory.pincodes.length > 0 || territory.cities.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {territory.cities.map(c => (
                <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 text-xs font-semibold">
                  <span className="material-icons-outlined text-[13px]">location_city</span>{c}
                </span>
              ))}
              {territory.pincodes.map(p => (
                <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-600 text-xs font-semibold border border-violet-100">
                  <span className="material-icons-outlined text-[13px]">pin_drop</span>{p}
                </span>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          {!terrLoading && territory.listings.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { key: 'all',          label: 'All',           count: territory.listings.length },
                { key: 'pending',      label: 'Pending Approval', count: territory.listings.filter(l => l.approvalStatus === 'pending').length },
                { key: 'approved',     label: 'Approved',      count: territory.listings.filter(l => l.approvalStatus === 'approved').length },
                { key: 'not_required', label: 'Direct',        count: territory.listings.filter(l => l.approvalStatus === 'not_required').length },
              ].map(f => f.count > 0 && (
                <button key={f.key} onClick={() => setTerrFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${terrFilter === f.key ? 'bg-violet-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${terrFilter === f.key ? 'bg-white/20' : 'bg-violet-100 text-violet-700'}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {terrLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}</div>
          ) : territory.listings.length === 0 ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <span className="material-icons-outlined text-5xl text-slate-200 mb-3">map</span>
              <p className="font-semibold text-on-surface mb-1">No listings in your territory yet</p>
              <p className="text-sm text-on-surface-variant">When brokers post in your city or pincodes, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {territory.listings
                .filter(l => terrFilter === 'all' || l.approvalStatus === terrFilter)
                .map(l => {
                  const isOwn    = l.broker?._id === user?.id || l.broker === user?.id;
                  const statusMap = {
                    pending:      { label: 'Pending Approval', cls: 'bg-amber-100 text-amber-700' },
                    approved:     { label: 'Approved',         cls: 'bg-emerald-100 text-emerald-700' },
                    rejected:     { label: 'Rejected',         cls: 'bg-rose-100 text-rose-700' },
                    not_required: { label: 'Direct',           cls: 'bg-slate-100 text-slate-600' },
                  };
                  const as = statusMap[l.approvalStatus] || statusMap.not_required;
                  return (
                    <div key={l._id} className={`card p-4 border-l-4 ${l.approvalStatus === 'pending' ? 'border-l-amber-400' : l.approvalStatus === 'approved' ? 'border-l-emerald-400' : 'border-l-slate-200'}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <span className="material-icons-outlined text-violet-500">home_work</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-slate-800 truncate">{l.title}</h3>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${as.cls}`}>{as.label}</span>
                            {isOwn && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Your listing</span>}
                          </div>
                          <p className="text-xs text-slate-400">{[l.address, l.city, l.pincode].filter(Boolean).join(' · ')} · {l.propertyType}</p>
                          <div className="flex items-center gap-4 mt-1.5">
                            <p className="text-sm font-bold text-slate-700">₹{Number(l.price).toLocaleString('en-IN')}</p>
                            {!isOwn && l.broker?.name && (
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <span className="material-icons-outlined text-[13px]">person</span>
                                {l.broker.name}
                                {l.broker.phone && <span>· {l.broker.phone}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Inline master-broker actions for pending listings */}
                        {l.approvalStatus === 'pending' && !isOwn && (
                          <TerritoryActions
                            listing={l}
                            onOpenChat={openChat}
                            onDecided={(id, action) => {
                              setTerritory(prev => ({
                                ...prev,
                                listings: prev.listings.map(x =>
                                  x._id === id ? { ...x, approvalStatus: action === 'approve' ? 'approved' : 'rejected' } : x
                                ),
                              }));
                              setCommReqs(prev => prev.map(r =>
                                r._id === id ? { ...r, approvalStatus: action === 'approve' ? 'approved' : 'rejected' } : r
                              ));
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── Listings Tab ── */}
      {tab === 'listings' && (
      <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active',      value: count('active'),      color: 'text-emerald-600' },
          { label: 'Under Offer', value: count('under_offer'), color: 'text-amber-600'   },
          { label: 'Sold',        value: count('sold'),        color: 'text-slate-500'   },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`font-montserrat font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'active', 'under_offer', 'sold'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filter === s
                ? 'bg-portal-broker text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            {s === 'all' ? 'All' : STATUS[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <span className="material-icons-outlined text-5xl text-slate-200 mb-3">home_work</span>
          <p className="font-semibold text-on-surface mb-1">No listings yet</p>
          <p className="text-sm text-on-surface-variant mb-4">
            Add your first property to start managing your portfolio
          </p>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-portal-broker text-white text-sm font-semibold hover:bg-[#e04e53] transition">
            <span className="material-icons-outlined text-base">add</span>
            Add First Listing
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => (
            <div key={l._id || l.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-portal-broker text-2xl">home</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-montserrat font-bold text-on-surface">{l.name || l.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS[l.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS[l.status]?.label || l.status}
                    </span>
                    {l.approvalStatus === 'pending' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                        <span className="material-icons-outlined text-[11px]">hourglass_top</span>
                        Pending Approval
                      </span>
                    )}
                    {l.approvalStatus === 'approved' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <span className="material-icons-outlined text-[11px]">verified</span>
                        Approved
                      </span>
                    )}
                    {l.approvalStatus === 'rejected' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                        <span className="material-icons-outlined text-[11px]">cancel</span>
                        Rejected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    {[l.address, l.city, l.pincode].filter(Boolean).join(', ')}
                    {l.landmark && <span className="text-slate-400"> · Near {l.landmark}</span>}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-on-surface-variant">
                    {l.propertyType && <span>{l.propertyType}</span>}
                    {l.beds > 0 && <span>{l.beds} Beds</span>}
                    {l.sqft && <span>{l.sqft} sqft</span>}
                    {l.views != null && (
                      <span className="flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">visibility</span>{l.views} views
                      </span>
                    )}
                    {l.inquiries != null && (
                      <span className="flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">chat</span>{l.inquiries} enquiries
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-on-surface text-lg">
                    {l.price ? `₹${Number(l.price).toLocaleString('en-IN')}` : '—'}
                  </p>
                  {l.listed && <p className="text-xs text-on-surface-variant">Listed {l.listed}</p>}
                  <div className="flex gap-2 mt-2 justify-end flex-wrap">
                    <button onClick={() => setLeadsListing(l)}
                      className="flex items-center gap-1 text-xs text-portal-broker font-semibold hover:underline">
                      <span className="material-icons-outlined text-sm">group</span>
                      Leads{l.inquiries > 0 ? ` (${l.inquiries})` : ''}
                    </button>
                    {l.approvalStatus === 'pending' && l.commissionRequest?.masterBroker && (
                      <PendingOfferActions
                        listing={l}
                        onOpenChat={openChat}
                        onWithdrawn={(id) => setListings(prev => prev.filter(x => x._id !== id))}
                        onAccepted={(id) => setListings(prev => prev.map(x => x._id === id ? { ...x, commissionRequest: { ...x.commissionRequest, brokerAccepted: true } } : x))}
                      />
                    )}
                    <button className="text-xs text-on-surface-variant hover:text-on-surface">Share</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <WhatsAppGroupCard type="unit" />
      </div>
      </>
      )}

      {showAdd && (
        <AddListingModal
          myAreas={myAreas}
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}

      {/* Inline chat panel for negotiation */}
      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        initialRoom={chatRoom}
        initialOtherName={chatOther}
      />
      {chatOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setChatOpen(false)} />
      )}

      {leadsListing && (
        <PropertyLeadsModal
          listing={leadsListing}
          onClose={() => setLeadsListing(null)}
        />
      )}
    </div>
  );
}
