import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { validateForm } from '../../../validation/validate';
import { auctionUnitPropertySchema } from '../../../validation/schemas';
import SharePropertyModal from '../../../components/common/SharePropertyModal';
import BulkShareModal from '../../../components/common/BulkShareModal';
import UnitSplitModal from '../../../components/common/UnitSplitModal';
import BookPropertyModal from '../../../components/common/BookPropertyModal';
import { Pagination } from '../../../components/common/Pagination';
import MediaUploader from '../../../components/common/MediaUploader';
import { useConfirm } from '../../../hooks/useConfirm';
import { toast } from '../../../components/common/Toast';

const PROP_TYPES = [
  'all', 'tower', 'building', 'villa', 'commercial',
  'plot', 'rowhouse', 'duplex', 'penthouse', 'township', 'mixed_use',
  'land', 'farmland', 'warehouse', 'other',
];
const TYPE_ICONS = {
  tower: 'domain', building: 'business', villa: 'cottage', commercial: 'store',
  plot: 'crop_square', rowhouse: 'holiday_village', duplex: 'layers', penthouse: 'roofing',
  township: 'location_city', mixed_use: 'corporate_fare', land: 'landscape',
  farmland: 'agriculture', warehouse: 'warehouse', other: 'category',
};
const LISTING_TYPES = [
  { v: 'new_launch',         l: 'New Launch' },
  { v: 'under_construction', l: 'Under Construction' },
  { v: 'ready_to_handover',  l: 'Ready to Handover' },
  { v: 'resale',             l: 'Resale' },
];
const STATUSES = [
  { v: 'all',               l: 'All' },
  { v: 'available',         l: 'Available' },
  { v: 'under_negotiation', l: 'Under Negotiation' },
  { v: 'sold',              l: 'Sold' },
];
const STATUS_COLORS = {
  available:         'bg-emerald-100 text-emerald-700',
  under_negotiation: 'bg-amber-100 text-amber-700',
  sold:              'bg-slate-100 text-slate-600',
};
const VISIBLE_OPTS = [
  { key: 'guest',     label: 'Public (Guests)', color: 'bg-green-100 text-green-700' },
  { key: 'buyer',     label: 'Buyers',          color: 'bg-violet-100 text-violet-700' },
  { key: 'broker',    label: 'Brokers',         color: 'bg-rose-100 text-rose-600' },
  { key: 'developer', label: 'Developers',      color: 'bg-sky-100 text-sky-700' },
  { key: 'investor',  label: 'Investors',       color: 'bg-emerald-100 text-emerald-700' },
];
const LIMIT = 10;

const EMPTY_FORM = {
  title: '', description: '', city: '', area: '', pincode: '', address: '',
  propertyType: 'tower',
  bedrooms: '', bathrooms: '', areaSqft: '', landAcres: '',
  totalUnits: '', totalFloors: '', reraNumber: '',
  price: '', listingType: 'new_launch', status: 'available',
  auctionDate: '', contactPhone: '', bankName: '', linkedBanker: '',
  visibleTo: ['buyer', 'broker', 'developer', 'investor'], isFeatured: false,
  commissionBrokerPct: '', commissionMasterBrokerPct: '',
};

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30';

function fmt(n) {
  if (!n) return '—';
  const l = Number(n);
  return l >= 10000000 ? `₹${(l / 10000000).toFixed(2)} Cr` : `₹${(l / 100000).toFixed(1)} L`;
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Auction Unit Property — combines Property Deals (bank auction/repo) with Property
// Partner (developer unit inventory). Admin-only CRUD (no bank self-submission, unlike
// Mortgage Property); broker/master-broker routing on enquiries resolves from the
// buyer's/guest's own pincode at enquiry time, same as Unit Property.
export default function AdminAuctionUnitProperties() {
  const [properties, setProperties] = useState([]);
  const [stats, setStats]           = useState({ total: 0, available: 0, underNegotiation: 0, sold: 0, featured: 0 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [loadError, setLoadError]   = useState('');

  const [search, setSearch]         = useState('');
  const [inputVal, setInputVal]     = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [formImages, setFormImages] = useState([]);
  const [formVideo, setFormVideo]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const { confirm, dialog } = useConfirm();

  const [bankers, setBankers]           = useState([]);
  const [bankersLoaded, setBankersLoaded] = useState(false);

  const [shareProperty, setShareProperty]     = useState(null);
  const [selectedIds, setSelectedIds]         = useState(new Set());
  const [showBulkShare, setShowBulkShare]     = useState(false);
  const [splitProperty, setSplitProperty]     = useState(null);
  const [unitPickProperty, setUnitPickProperty] = useState(null);
  const [bookTarget, setBookTarget]           = useState(null);

  const fetchProps = useCallback(async (p = 1) => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (search)                 params.set('search', search);
      if (typeFilter !== 'all')   params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const { data } = await api.get(`/auction-unit-properties?${params}`);
      setProperties(data.properties || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch (err) {
      setLoadError(err.response?.data?.message || `Failed to load properties (${err.response?.status || 'network error'}).`);
    }
    setLoading(false);
  }, [search, typeFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/auction-unit-properties/stats');
      setStats(data);
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchProps(1); fetchStats(); }, [fetchProps, fetchStats]);

  async function loadBankers() {
    if (bankersLoaded) return;
    try {
      const { data } = await api.get('/users?role=bank');
      setBankers(Array.isArray(data) ? data : []);
      setBankersLoaded(true);
    } catch { setBankers([]); }
  }

  function handleSearch(e) { e.preventDefault(); setSearch(inputVal.trim()); }

  function openAdd() {
    setForm({ ...EMPTY_FORM }); setFormImages([]); setFormVideo('');
    setEditId(null); setMsg(''); setShowForm(true);
    loadBankers();
  }
  function openEdit(p) {
    setForm({
      title: p.title || '', description: p.description || '',
      city: p.city || '', area: p.area || '', pincode: p.pincode || '', address: p.address || '',
      propertyType: p.propertyType || 'tower',
      bedrooms: p.bedrooms ?? '', bathrooms: p.bathrooms ?? '',
      areaSqft: p.areaSqft ?? '', landAcres: p.landAcres ?? '',
      totalUnits: p.totalUnits ?? '', totalFloors: p.totalFloors ?? '',
      reraNumber: p.reraNumber || '',
      price: p.price || '', listingType: p.listingType || 'new_launch',
      status: p.status || 'available',
      auctionDate: p.auctionDate ? new Date(p.auctionDate).toISOString().split('T')[0] : '',
      contactPhone: p.contactPhone || '', bankName: p.bankName || '',
      linkedBanker: p.linkedBanker?._id || '',
      visibleTo: p.visibleTo || ['buyer', 'broker', 'developer', 'investor'],
      isFeatured: p.isFeatured || false,
      commissionBrokerPct:       p.commission?.brokerPct       ?? '',
      commissionMasterBrokerPct: p.commission?.masterBrokerPct ?? '',
    });
    setFormImages(p.images || []);
    setFormVideo(p.video || '');
    setEditId(p._id); setMsg(''); setShowForm(true);
    loadBankers();
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }
  function toggleVisible(key) {
    setForm(f => ({
      ...f,
      visibleTo: f.visibleTo.includes(key) ? f.visibleTo.filter(k => k !== key) : [...f.visibleTo, key],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { errors } = validateForm(auctionUnitPropertySchema, form);
    if (errors) { setMsg(Object.values(errors)[0]); return; }
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...form,
        bedrooms:    form.bedrooms    !== '' ? Number(form.bedrooms)    : undefined,
        bathrooms:   form.bathrooms   !== '' ? Number(form.bathrooms)   : undefined,
        areaSqft:    form.areaSqft    !== '' ? Number(form.areaSqft)    : undefined,
        landAcres:   form.landAcres   !== '' ? Number(form.landAcres)   : undefined,
        totalUnits:  form.totalUnits  !== '' ? Number(form.totalUnits)  : undefined,
        totalFloors: form.totalFloors !== '' ? Number(form.totalFloors) : undefined,
        price: Number(form.price),
        auctionDate: form.auctionDate || undefined,
        linkedBanker: form.linkedBanker || null,
        images: formImages, video: formVideo,
        commission: {
          brokerPct:       form.commissionBrokerPct       !== '' ? Number(form.commissionBrokerPct)       : null,
          masterBrokerPct: form.commissionMasterBrokerPct !== '' ? Number(form.commissionMasterBrokerPct) : null,
        },
      };
      if (editId) {
        await api.patch(`/auction-unit-properties/${editId}`, payload);
        setMsg('Property updated.');
      } else {
        await api.post('/auction-unit-properties', payload);
        setMsg('Property added.');
      }
      setShowForm(false);
      fetchProps(editId ? page : 1);
      fetchStats();
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!(await confirm('Deactivate this property?', { danger: true, confirmLabel: 'Deactivate' }))) return;
    try { await api.delete(`/auction-unit-properties/${id}`); fetchProps(page); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to deactivate property.'); }
  }

  async function toggleGuestVisibility(prop) {
    const has = prop.visibleTo?.includes('guest');
    const visibleTo = has
      ? prop.visibleTo.filter(v => v !== 'guest')
      : ['guest', ...(prop.visibleTo || [])];
    try {
      await api.patch(`/auction-unit-properties/${prop._id}`, { visibleTo });
      setProperties(prev => prev.map(p => p._id === prop._id ? { ...p, visibleTo } : p));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update visibility.'); }
  }

  function handleSplitUpdate(updated) {
    setProperties(prev => prev.map(p => p._id === updated._id ? { ...p, unitSplit: updated.unitSplit } : p));
    if (splitProperty?._id === updated._id) setSplitProperty(prev => ({ ...prev, unitSplit: updated.unitSplit }));
  }

  return (
    <div className="space-y-6">
      {dialog}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-montserrat font-bold text-xl text-slate-800">Auction Unit Properties</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bank-linked auction inventory with developer-style unit listings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button onClick={() => setShowBulkShare(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-xl hover:bg-[#1ebe5d] transition">
              <span className="material-icons-outlined text-base">send</span>
              Bulk Share ({selectedIds.size})
            </button>
          )}
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-white text-sm font-semibold rounded-xl hover:bg-[#2e3044] transition">
            <span className="material-icons-outlined text-base">add</span> Add Property
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',             value: stats.total,            color: 'text-slate-700' },
          { label: 'Available',         value: stats.available,        color: 'text-emerald-600' },
          { label: 'Under Negotiation', value: stats.underNegotiation, color: 'text-amber-600' },
          { label: 'Sold',              value: stats.sold,             color: 'text-slate-500' },
          { label: 'Featured',          value: stats.featured,         color: 'text-tertiary' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
            <p className={`font-montserrat font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
            <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder="Search by title, city, area, bank…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tertiary/30 bg-white" />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-tertiary text-white text-sm font-semibold hover:bg-[#2e3044] transition">
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
          <span className="text-xs text-slate-400 font-semibold mr-1">Type:</span>
          {PROP_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize
                ${typeFilter === t ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {t !== 'all' && <span className="material-icons-outlined text-xs">{TYPE_ICONS[t]}</span>}
              {t === 'all' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold">Status:</span>
          {STATUSES.map(t => (
            <button key={t.v} onClick={() => setStatusFilter(t.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${statusFilter === t.v ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <span className="material-icons-outlined text-base flex-shrink-0">error_outline</span>
          <span className="flex-1">{loadError}</span>
          <button onClick={() => fetchProps(page)} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{total} propert{total !== 1 ? 'ies' : 'y'}{search ? ` for "${search}"` : ''}</span>
        <div className="flex items-center gap-3">
          {properties.length > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox"
                checked={properties.length > 0 && properties.every(p => selectedIds.has(p._id))}
                onChange={e => {
                  if (e.target.checked) setSelectedIds(prev => new Set([...prev, ...properties.map(p => p._id)]));
                  else setSelectedIds(prev => { const s = new Set(prev); properties.forEach(p => s.delete(p._id)); return s; });
                }}
                className="accent-tertiary" />
              <span>Select page</span>
            </label>
          )}
          {selectedIds.size > 0 && (
            <button onClick={() => setSelectedIds(new Set())} className="text-rose-500 hover:underline">
              Clear ({selectedIds.size})
            </button>
          )}
          <span>Page {page} of {pages}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-icons-outlined text-3xl animate-spin text-tertiary">progress_activity</span>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">gavel</span>
          <p className="text-slate-400 mt-3">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map(p => (
            <div key={p._id}
              className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow
                ${selectedIds.has(p._id) ? 'border-tertiary ring-2 ring-tertiary/20' : 'border-slate-100'}`}>

              {p.images?.[0] ? (
                <div className="relative h-36 bg-slate-100">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  <input type="checkbox" checked={selectedIds.has(p._id)}
                    onChange={e => setSelectedIds(prev => { const s = new Set(prev); e.target.checked ? s.add(p._id) : s.delete(p._id); return s; })}
                    className="absolute top-2 left-2 w-4 h-4 accent-tertiary cursor-pointer" />
                  <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                    {p.images.length} photo{p.images.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div className="h-16 bg-gradient-to-br from-slate-100 to-slate-50 relative flex items-center justify-center">
                  <span className="material-icons-outlined text-slate-300 text-3xl">{TYPE_ICONS[p.propertyType] || 'gavel'}</span>
                  <input type="checkbox" checked={selectedIds.has(p._id)}
                    onChange={e => setSelectedIds(prev => { const s = new Set(prev); e.target.checked ? s.add(p._id) : s.delete(p._id); return s; })}
                    className="absolute top-2 left-2 w-4 h-4 accent-tertiary cursor-pointer" />
                </div>
              )}

              <div className="px-4 pt-3 pb-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {(p.status || '').replace('_', ' ')}
                    </span>
                    {p.isFeatured && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>
                    )}
                    {p.unitSplit?.enabled && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        {p.unitSplit.units?.length || 0} units
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-0.5 text-xs text-slate-400 capitalize flex-shrink-0">
                    <span className="material-icons-outlined text-xs">{TYPE_ICONS[p.propertyType] || 'gavel'}</span>
                    {p.propertyType}
                  </span>
                </div>
                <p className="font-montserrat font-bold text-slate-800 leading-tight line-clamp-1">{p.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">location_on</span>
                  {[p.area, p.city, p.pincode].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="px-4 py-2 border-y border-slate-50 grid grid-cols-2 gap-2">
                <div><p className="text-xs text-slate-400">Price</p><p className="font-bold text-slate-800 text-sm">{fmt(p.price)}</p></div>
                <div><p className="text-xs text-slate-400">Size</p>
                  <p className="font-semibold text-slate-700 text-sm">
                    {p.areaSqft ? `${p.areaSqft.toLocaleString()} sqft` : p.landAcres ? `${p.landAcres} acres` : '—'}
                  </p>
                </div>
                {p.totalUnits > 0 && <div><p className="text-xs text-slate-400">Units</p><p className="text-xs text-slate-600">{p.totalUnits}</p></div>}
                {p.auctionDate && <div><p className="text-xs text-slate-400">Auction Date</p><p className="text-xs text-slate-600">{new Date(p.auctionDate).toLocaleDateString('en-IN')}</p></div>}
                <div><p className="text-xs text-slate-400">Listing</p><p className="text-xs text-slate-600 capitalize">{(p.listingType || '').replace(/_/g, ' ')}</p></div>
                {p.bankName && <div><p className="text-xs text-slate-400">Bank</p><p className="text-xs text-slate-600">{p.bankName}</p></div>}
              </div>

              {(p.linkedBanker?.name || p.addedBy?.name) && (
                <div className="px-4 py-2 space-y-0.5">
                  {p.linkedBanker?.name && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">account_balance</span>
                      <span className="font-medium">{p.linkedBanker.name}</span>
                    </p>
                  )}
                  {p.addedBy?.name && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">manage_accounts</span>
                      Managed by: <span className="font-medium text-slate-500">{p.addedBy.name}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="px-4 py-1.5 flex flex-wrap items-center gap-1">
                <button
                  onClick={() => toggleGuestVisibility(p)}
                  title={p.visibleTo?.includes('guest') ? 'Remove from public homepage' : 'Show on public homepage'}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition mr-1 ${
                    p.visibleTo?.includes('guest')
                      ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                  }`}>
                  <span className="material-icons-outlined text-[10px]">{p.visibleTo?.includes('guest') ? 'public' : 'public_off'}</span>
                  {p.visibleTo?.includes('guest') ? 'Public' : 'Private'}
                </button>
                {(p.visibleTo || []).filter(r => r !== 'guest').map(role => {
                  const opt = VISIBLE_OPTS.find(o => o.key === role);
                  return (
                    <span key={role} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${opt?.color || 'bg-slate-100 text-slate-600'}`}>
                      {role}
                    </span>
                  );
                })}
              </div>

              <div className="px-4 pb-4 pt-2 flex gap-2">
                <button onClick={() => setShareProperty(p)}
                  className="px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1ebe5d] transition flex items-center gap-1">
                  {WA_ICON}
                </button>
                <button onClick={() => setSplitProperty(p)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition
                    ${p.unitSplit?.enabled
                      ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <span className="material-icons-outlined text-sm">call_split</span>
                  Split
                </button>
                <button onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
                  <span className="material-icons-outlined text-sm">edit</span> Edit
                </button>
                <button onClick={() => handleDelete(p._id)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition">
                  <span className="material-icons-outlined text-sm">delete_outline</span>
                </button>
              </div>

              {p.status !== 'sold' && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => {
                      const openUnits = (p.unitSplit?.units || []).filter(u => u.status !== 'booked' && u.status !== 'sold');
                      if (p.unitSplit?.enabled && openUnits.length > 0) setUnitPickProperty(p);
                      else setBookTarget({ property: p, unit: null });
                    }}
                    className="w-full py-2 rounded-xl text-sm font-bold border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center gap-1.5">
                    <span className="material-icons-outlined text-base">sell</span>
                    Manage Booking
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={pages} totalItems={total} itemsPerPage={LIMIT} onPageChange={p => fetchProps(p)} />

      {shareProperty && <SharePropertyModal property={shareProperty} type="unit" onClose={() => setShareProperty(null)} />}
      {showBulkShare && selectedIds.size > 0 && (
        <BulkShareModal properties={properties.filter(p => selectedIds.has(p._id))} type="unit" onClose={() => setShowBulkShare(false)} />
      )}
      {splitProperty && (
        <UnitSplitModal
          property={splitProperty}
          apiBase="auction-unit-properties"
          onClose={() => setSplitProperty(null)}
          onUpdate={handleSplitUpdate}
        />
      )}

      {unitPickProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setUnitPickProperty(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-montserrat font-bold text-base text-slate-800">Select Unit to Book</h2>
              <button onClick={() => setUnitPickProperty(null)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-1.5">
              {(unitPickProperty.unitSplit?.units || [])
                .filter(u => u.status !== 'booked' && u.status !== 'sold')
                .map(u => (
                  <button key={u._id} type="button"
                    onClick={() => { setBookTarget({ property: unitPickProperty, unit: u }); setUnitPickProperty(null); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-left transition">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700">Unit {u.unitNumber}</p>
                      <p className="text-xs text-slate-400">{u.unitType}{u.floor != null ? ` · Floor ${u.floor}` : ''}</p>
                    </div>
                    <span className="text-xs font-bold text-primary flex-shrink-0">{fmt(u.price)}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {bookTarget && (
        <BookPropertyModal
          propertyId={bookTarget.property._id}
          propertyModel="AuctionUnitProperty"
          unitId={bookTarget.unit?._id || null}
          unitNumber={bookTarget.unit?.unitNumber || ''}
          priceHint={bookTarget.unit?.price ?? bookTarget.property.price}
          onClose={() => setBookTarget(null)}
          onBooked={() => { setBookTarget(null); fetchProps(page); }}
        />
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-montserrat font-bold text-base text-slate-800">{editId ? 'Edit' : 'Add'} Auction Unit Property</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
              {msg && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold text-center ${msg.includes('added') || msg.includes('updated') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg}</div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Title *</label>
                <input name="title" value={form.title} onChange={handleChange} className={inp} placeholder="Skyline Auction Tower" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className={inp} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Property Type</label>
                  <select name="propertyType" value={form.propertyType} onChange={handleChange} className={inp}>
                    {PROP_TYPES.filter(t => t !== 'all').map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Listing Type</label>
                  <select name="listingType" value={form.listingType} onChange={handleChange} className={inp}>
                    {LISTING_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City *</label>
                  <input name="city" value={form.city} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area</label>
                  <input name="area" value={form.area} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} className={inp} maxLength={6} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Address</label>
                <input name="address" value={form.address} onChange={handleChange} className={inp} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Price (₹) *</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area (sqft)</label>
                  <input type="number" name="areaSqft" value={form.areaSqft} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inp}>
                    {STATUSES.filter(s => s.v !== 'all').map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bedrooms</label>
                  <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Units</label>
                  <input type="number" name="totalUnits" value={form.totalUnits} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Floors</label>
                  <input type="number" name="totalFloors" value={form.totalFloors} onChange={handleChange} className={inp} />
                </div>
              </div>

              {/* Auction / bank section */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-outlined text-base text-slate-400">gavel</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auction & Bank Link (optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Auction Date</label>
                    <input type="date" name="auctionDate" value={form.auctionDate} onChange={handleChange} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact Phone</label>
                    <input name="contactPhone" value={form.contactPhone} onChange={handleChange} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bank Name</label>
                    <input name="bankName" value={form.bankName} onChange={handleChange} className={inp} placeholder="HDFC Bank" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Linked Banker</label>
                    <select name="linkedBanker" value={form.linkedBanker} onChange={handleChange} className={inp}>
                      <option value="">— None —</option>
                      {bankers.map(b => <option key={b._id} value={b._id}>{b.name}{b.email ? ` · ${b.email}` : ''}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Commission override */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-icons-outlined text-base text-slate-400">percent</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commission Override (optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Broker %</label>
                    <input type="number" name="commissionBrokerPct" value={form.commissionBrokerPct} onChange={handleChange} className={inp} placeholder="Uses global rate if blank" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Master Broker %</label>
                    <input type="number" name="commissionMasterBrokerPct" value={form.commissionMasterBrokerPct} onChange={handleChange} className={inp} placeholder="Uses global rate if blank" />
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className="border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visible To</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {VISIBLE_OPTS.map(o => (
                    <button key={o.key} type="button" onClick={() => toggleVisible(o.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                        ${form.visibleTo.includes(o.key) ? o.color + ' border-transparent' : 'bg-white border-slate-200 text-slate-500'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                  <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="accent-tertiary" />
                  Feature on buyer homepage
                </label>
              </div>

              {/* Media */}
              <div className="border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Photos & Video</span>
                <div className="mt-2">
                  <MediaUploader images={formImages} onImages={setFormImages} video={formVideo} onVideo={setFormVideo} folder="a1deal/properties" showVideo />
                </div>
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-tertiary text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60">
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Property'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
