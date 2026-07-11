import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { validateForm } from '../../../validation/validate';
import { mortgagePropertySchema } from '../../../validation/schemas';
import MortgageHub from '../../../components/common/MortgageHub';
import SharePropertyModal from '../../../components/common/SharePropertyModal';
import BulkShareModal from '../../../components/common/BulkShareModal';
import { Pagination } from '../../../components/common/Pagination';
import { SearchFilter } from '../../../components/common/SearchFilter';
import MediaUploader from '../../../components/common/MediaUploader';
import BookPropertyModal from '../../../components/common/BookPropertyModal';
import { useConfirm } from '../../../hooks/useConfirm';
import { toast } from '../../../components/common/Toast';
import { MORTGAGE_TYPES as TYPES, MORTGAGE_TYPE_LABELS as TYPE_LABELS, showMortgageField, mortgageTypeLabel } from '../../../utils/mortgagePropertyTypes';
const VISIBLE_TO_OPTS = [
  { key: 'guest',     label: 'Public (Guests)' },
  { key: 'buyer',     label: 'Buyers' },
  { key: 'broker',    label: 'Brokers' },
  { key: 'developer', label: 'Developers' },
  { key: 'investor',  label: 'Investors' },
];
const ROLE_COLORS = {
  guest:     'bg-green-100 text-green-700',
  buyer:     'bg-violet-100 text-violet-700',
  broker:    'bg-rose-100 text-rose-600',
  developer: 'bg-sky-100 text-sky-700',
  investor:  'bg-emerald-100 text-emerald-700',
};

const EMPTY_FORM = {
  title: '', description: '', city: '', area: '', pincode: '', address: '',
  type: 'flat', customType: '', bedrooms: '', area_sqft: '', price: '',
  bankName: '', auctionDate: '', contactPhone: '',
  status: 'available',
  visibleTo: ['broker', 'developer', 'investor'],
  sellDirect: false,
  linkedBanker: '',
  commissionBrokerPct: '',
  commissionMasterBrokerPct: '',
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

const STATUS_COLORS = {
  available: 'bg-emerald-100 text-emerald-700',
  under_auction: 'bg-amber-100 text-amber-700',
  sold: 'bg-slate-100 text-slate-600',
  withdrawn: 'bg-rose-100 text-rose-600',
};

const LIMIT = 10;

// ── Tab 1: Properties ────────────────────────────────────────────────────────

function PropertiesTab() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [formImages, setFormImages] = useState([]);
  const [formVideo, setFormVideo]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [shareProperty, setShareProperty]       = useState(null);
  const [bulkShareProperty, setBulkShareProperty] = useState(null);
  const [selectedIds, setSelectedIds]           = useState(new Set());
  const [showBulkShare, setShowBulkShare]       = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Link Banker
  const [linkTarget, setLinkTarget]       = useState(null);
  const [bankers, setBankers]             = useState([]);
  const [bankersLoaded, setBankersLoaded] = useState(false);
  const [selectedBankerId, setSelectedBankerId] = useState('');
  const [linkSaving, setLinkSaving]       = useState(false);
  const [linkMsg, setLinkMsg]             = useState('');
  const [bookProperty, setBookProperty]   = useState(null);
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProps(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);   // eslint-disable-line

  useEffect(() => { fetchProps(1); }, [statusFilter]);   // eslint-disable-line

  async function fetchProps(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      const { data } = await api.get(`/mortgage-properties?${params}`);
      setProperties(data.properties || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
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

  async function openAdd() {
    setForm({ ...EMPTY_FORM });
    setFormImages([]); setFormVideo('');
    setEditId(null); setMsg(''); setShowForm(true);
    if (!bankersLoaded) {
      try {
        const { data } = await api.get('/users?role=bank');
        setBankers(Array.isArray(data) ? data : []);
        setBankersLoaded(true);
      } catch { setBankers([]); }
    }
  }
  async function openEdit(p) {
    setForm({
      title: p.title || '', description: p.description || '',
      city: p.city || '', area: p.area || '', pincode: p.pincode || '', address: p.address || '',
      type: p.type || 'flat', customType: p.customType || '', bedrooms: p.bedrooms ?? '', area_sqft: p.area_sqft ?? '',
      price: p.price || '', bankName: p.bankName || '',
      auctionDate: p.auctionDate ? new Date(p.auctionDate).toISOString().split('T')[0] : '',
      contactPhone: p.contactPhone || '',
      status: p.status || 'available',
      visibleTo: p.visibleTo || ['broker', 'developer', 'investor'],
      sellDirect: p.sellDirect || false,
      linkedBanker: p.linkedBanker?._id || '',
      commissionBrokerPct: p.commissionOverride?.brokerPct ?? '',
      commissionMasterBrokerPct: p.commissionOverride?.masterBrokerPct ?? '',
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
    if (!bankersLoaded) {
      try {
        const { data } = await api.get('/users?role=bank');
        setBankers(Array.isArray(data) ? data : []);
        setBankersLoaded(true);
      } catch { setBankers([]); }
    }
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
        linkedBanker: form.linkedBanker || null,
        commissionOverride: {
          brokerPct:       form.commissionBrokerPct       !== '' ? Number(form.commissionBrokerPct)       : null,
          masterBrokerPct: form.commissionMasterBrokerPct !== '' ? Number(form.commissionMasterBrokerPct) : null,
          bankPct:         form.commissionBankPct         !== '' ? Number(form.commissionBankPct)         : null,
        },
        localityPrices: cleanLocalityPrices(form.localityPrices),
        images: formImages,
        video: formVideo,
      };
      delete payload.commissionBrokerPct;
      delete payload.commissionMasterBrokerPct;
      delete payload.commissionBankPct;
      if (editId) {
        await api.patch(`/mortgage-properties/${editId}`, payload);
        setMsg('Updated.');
      } else {
        await api.post('/mortgage-properties', payload);
        setMsg('Added.');
      }
      setShowForm(false);
      fetchProps(editId ? page : 1);
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  }

  async function deactivate(id) {
    if (!(await confirm('Deactivate this property?', { danger: true, confirmLabel: 'Deactivate' }))) return;
    try { await api.delete(`/mortgage-properties/${id}`); fetchProps(page); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to deactivate property.'); }
  }

  async function openLinkBanker(p) {
    setLinkTarget(p);
    setSelectedBankerId(p.linkedBanker?._id || '');
    setLinkMsg('');
    if (!bankersLoaded) {
      try {
        const { data } = await api.get('/users?role=bank');
        setBankers(Array.isArray(data) ? data : []);
        setBankersLoaded(true);
      } catch { setBankers([]); }
    }
  }

  async function handleLinkBanker() {
    if (!linkTarget) return;
    setLinkSaving(true); setLinkMsg('');
    try {
      await api.patch(`/mortgage-properties/${linkTarget._id}`, { linkedBanker: selectedBankerId || null });
      setLinkMsg('Banker linked successfully.');
      fetchProps(page);
      setTimeout(() => setLinkTarget(null), 1200);
    } catch (err) { setLinkMsg(err.response?.data?.message || 'Failed to link.'); }
    setLinkSaving(false);
  }

  async function toggleGuestVisibility(p) {
    const has = p.visibleTo?.includes('guest');
    const visibleTo = has
      ? p.visibleTo.filter(v => v !== 'guest')
      : ['guest', ...(p.visibleTo || [])];
    try {
      await api.patch(`/mortgage-properties/${p._id}`, { visibleTo });
      setProperties(prev => prev.map(x => x._id === p._id ? { ...x, visibleTo } : x));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update visibility.'); }
  }

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search properties by title, city, area, pincode..."
        />
        <div className="flex gap-2 flex-wrap">
          {['all', 'available', 'under_auction', 'sold', 'withdrawn'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition capitalize
                ${statusFilter === s ? 'bg-primary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-primary'}`}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-slate-400">{total} listing{total !== 1 ? 's' : ''}</p>
          {selectedIds.size > 0 && (
            <button onClick={() => setShowBulkShare(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] text-white text-sm font-semibold rounded-xl hover:bg-[#1ebe5d] transition">
              <span className="material-icons-outlined text-sm">send</span>
              Bulk Share ({selectedIds.size})
            </button>
          )}
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition">
            <span className="material-icons-outlined text-base">add</span> Add Property
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No mortgage properties found.</div>
      ) : (
        <>
        {/* Select-all row */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox"
              checked={properties.length > 0 && properties.every(p => selectedIds.has(p._id))}
              onChange={e => {
                if (e.target.checked) setSelectedIds(prev => new Set([...prev, ...properties.map(p => p._id)]));
                else setSelectedIds(prev => { const s = new Set(prev); properties.forEach(p => s.delete(p._id)); return s; });
              }}
              className="accent-primary" />
            Select page ({properties.length})
          </label>
          {selectedIds.size > 0 && (
            <button onClick={() => setSelectedIds(new Set())} className="text-rose-500 hover:underline">
              Clear ({selectedIds.size} selected)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map(p => (
            <div key={p._id}
              className={`bg-white rounded-2xl border p-5 space-y-3 transition-shadow hover:shadow-sm
                ${!p.isActive ? 'opacity-50' : ''}
                ${selectedIds.has(p._id) ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <input type="checkbox" checked={selectedIds.has(p._id)}
                    onChange={e => setSelectedIds(prev => {
                      const s = new Set(prev);
                      e.target.checked ? s.add(p._id) : s.delete(p._id);
                      return s;
                    })}
                    className="mt-1 accent-primary cursor-pointer flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 leading-tight">{p.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.bankName || 'No bank listed'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>
                    {(p.status || '').replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold capitalize">{mortgageTypeLabel(p)}</span>
                </div>
              </div>
              <div className="text-sm text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <span className="material-icons-outlined text-sm text-slate-400">location_on</span>
                  {[p.city, p.area, p.pincode].filter(Boolean).join(', ')}
                </p>
                <p className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="material-icons-outlined text-sm text-slate-400">currency_rupee</span>
                  {Number(p.price).toLocaleString('en-IN')}
                </p>
                {p.auctionDate && (
                  <p className="flex items-center gap-1.5 text-amber-600">
                    <span className="material-icons-outlined text-sm">event</span>
                    Auction: {new Date(p.auctionDate).toLocaleDateString('en-IN')}
                  </p>
                )}
                {p.addedBy && (
                  <p className="text-xs text-slate-400">
                    Added by: <span className="capitalize">{p.addedBy.role}</span> · {p.addedBy.name}
                  </p>
                )}
                {p.linkedBanker && (
                  <p className="text-xs flex items-center gap-1 text-blue-600">
                    <span className="material-icons-outlined text-xs">account_balance</span>
                    Banker: {p.linkedBanker.name} {p.linkedBanker.company ? `· ${p.linkedBanker.company}` : ''}
                  </p>
                )}
                {p.commission?.mode && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 flex-wrap">
                    <span className="material-icons-outlined text-xs">percent</span>
                    {p.commission.mode === 'direct'
                      ? <>Direct · MB {p.assignedMasterBroker?.name || 'unmatched'} ({p.commission.masterBrokerPercent}%)</>
                      : <>Broker {p.assignedBroker?.name || 'unmatched'} ({p.commission.brokerPercent}%) → MB {p.assignedMasterBroker?.name || 'unmatched'} ({p.commission.masterBrokerPercent}%)</>}
                  </p>
                )}
                {p.status === 'sold' && p.commission?.bookedAt && (
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 flex-wrap">
                    <span className="material-icons-outlined text-xs">paid</span>
                    Booked · Broker ₹{Number(p.commission.brokerAmount || 0).toLocaleString('en-IN')} · MB ₹{Number(p.commission.masterBrokerAmount || 0).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1">
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
                {(p.visibleTo || []).filter(role => role !== 'guest').map(role => (
                  <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-600'}`}>
                    {role}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShareProperty(p)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1ebe5d] transition">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share
                </button>
                <button onClick={() => setBulkShareProperty(p)}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition">
                  <span className="material-icons-outlined text-sm">group_add</span>
                  Bulk
                </button>
                <button onClick={() => openLinkBanker(p)}
                  title="Link banker to this property"
                  className="px-3 py-2 rounded-xl border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50 transition">
                  <span className="material-icons-outlined text-sm">account_balance</span>
                </button>
                <button onClick={() => openEdit(p)}
                  className="px-3 py-2 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition">
                  <span className="material-icons-outlined text-sm">edit</span>
                </button>
                <button onClick={() => deactivate(p._id)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition">
                  <span className="material-icons-outlined text-sm">delete_outline</span>
                </button>
              </div>
              {p.status !== 'sold' && (
                <button onClick={() => setBookProperty(p)}
                  className="w-full py-2 rounded-xl text-sm font-bold border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center gap-1.5">
                  <span className="material-icons-outlined text-base">sell</span>
                  Manage Booking
                </button>
              )}
            </div>
          ))}
        </div>
        </>
      )}

      <Pagination
        currentPage={page}
        totalPages={pages}
        totalItems={total}
        itemsPerPage={LIMIT}
        onPageChange={p => fetchProps(p)}
      />

      {dialog}

      {shareProperty && (
        <SharePropertyModal property={shareProperty} type="mortgage" onClose={() => setShareProperty(null)} />
      )}

      {bookProperty && (
        <BookPropertyModal
          propertyId={bookProperty._id}
          propertyModel="MortgageProperty"
          priceHint={bookProperty.price}
          onClose={() => setBookProperty(null)}
          onBooked={() => { setBookProperty(null); fetchProps(page); }}
        />
      )}

      {bulkShareProperty && (
        <BulkShareModal
          properties={[bulkShareProperty]}
          type="mortgage"
          onClose={() => setBulkShareProperty(null)}
        />
      )}

      {showBulkShare && selectedIds.size > 0 && (
        <BulkShareModal
          properties={properties.filter(p => selectedIds.has(p._id))}
          type="mortgage"
          onClose={() => setShowBulkShare(false)}
        />
      )}

      {/* Link Banker Modal */}
      {linkTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setLinkTarget(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="font-montserrat font-bold text-slate-800">Link Banker</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{linkTarget.title}</p>
            </div>
            <p className="text-sm text-slate-500">Select a bank user to give them visibility into this property's enquiries, site visits, and commissions.</p>
            <select
              value={selectedBankerId}
              onChange={e => setSelectedBankerId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">— No banker (unlink) —</option>
              {bankers.map(b => (
                <option key={b._id} value={b._id}>
                  {b.name}{b.company ? ` · ${b.company}` : ''} ({b.email})
                </option>
              ))}
            </select>
            {bankers.length === 0 && bankersLoaded && (
              <p className="text-xs text-amber-600">No banker accounts found. Create one via User Management.</p>
            )}
            {linkMsg && (
              <div className={`p-2 rounded-xl text-xs font-semibold text-center ${linkMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {linkMsg}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleLinkBanker} disabled={linkSaving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-container transition disabled:opacity-50">
                {linkSaving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setLinkTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-montserrat font-bold text-lg text-slate-800">
                {editId ? 'Edit Mortgage Property' : 'Add Mortgage Property'}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <span className="material-icons-outlined text-slate-400">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {msg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${msg.includes('pdat') || msg.includes('dded') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Title *</label>
                  <input name="title" required value={form.title} onChange={handleChange} placeholder="e.g. 3BHK Flat – Bank Repo" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City *</label>
                  <input name="city" required value={form.city} onChange={handleChange} placeholder="Pune" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area</label>
                  <input name="area" value={form.area} onChange={handleChange} placeholder="Baner" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="411045" className={inp} />
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
                    <input name="customType" required value={form.customType} onChange={handleChange} placeholder="e.g. Duplex" className={inp} />
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
                  <input name="price" type="number" required value={form.price} onChange={handleChange} placeholder="2500000" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bank Name</label>
                  <input name="bankName" value={form.bankName} onChange={handleChange} placeholder="HDFC Bank" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Auction Date</label>
                  <input name="auctionDate" type="date" value={form.auctionDate} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact Phone</label>
                  <input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="+91 98765 43210" className={inp} />
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
                  <textarea name="description" rows={2} value={form.description} onChange={handleChange} placeholder="Additional details…" className={`${inp} resize-none`} />
                </div>

                {/* Extra expected prices by locality/area (optional) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Expected Prices by Locality / Area <span className="normal-case font-normal text-slate-300">(optional)</span>
                    </label>
                    <button type="button" onClick={addLocalityPrice}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
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
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                <input type="checkbox" id="sellDirect" checked={form.sellDirect}
                  onChange={() => setForm(f => ({ ...f, sellDirect: !f.sellDirect }))}
                  className="accent-primary" />
                <label htmlFor="sellDirect" className="text-sm text-slate-700 cursor-pointer">
                  <span className="font-semibold">Sell Direct</span> — skip the standard broker, route straight to the pincode's Master Broker (higher default commission)
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Link Banker (optional)</label>
                <select
                  value={form.linkedBanker}
                  onChange={e => setForm(f => ({ ...f, linkedBanker: e.target.value }))}
                  className={inp}>
                  <option value="">— None —</option>
                  {bankers.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.name}{b.company ? ` · ${b.company}` : ''} ({b.email})
                    </option>
                  ))}
                </select>
                {bankers.length === 0 && bankersLoaded && (
                  <p className="text-xs text-amber-600 mt-1">No banker accounts yet. Create one via User Management.</p>
                )}
                <p className="text-xs text-slate-400 mt-1">Banker will see enquiries, site visits, and commissions for this property.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Set % that goes to broker and master broker for this property. Leave blank to use global commission rates.
                  Bank-added properties default to a flat 1% / 1% override, editable here.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Broker %</label>
                    <input name="commissionBrokerPct" type="number" min="0" max="100" step="0.1"
                      value={form.commissionBrokerPct} onChange={handleChange}
                      placeholder="e.g. 1" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Master Broker %</label>
                    <input name="commissionMasterBrokerPct" type="number" min="0" max="100" step="0.1"
                      value={form.commissionMasterBrokerPct} onChange={handleChange}
                      placeholder="e.g. 1" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bank %</label>
                    <input name="commissionBankPct" type="number" min="0" max="100" step="0.1"
                      value={form.commissionBankPct} onChange={handleChange}
                      placeholder="e.g. 0.5" className={inp} />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Bank % is the bank's own commission on the deal (optional).</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Visible To</label>
                <div className="flex flex-wrap gap-3">
                  {VISIBLE_TO_OPTS.map(o => (
                    <label key={o.key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.visibleTo.includes(o.key)} onChange={() => toggleVisible(o.key)} className="accent-primary" />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${form.visibleTo.includes(o.key) ? ROLE_COLORS[o.key] : 'text-slate-500'}`}>{o.label}</span>
                    </label>
                  ))}
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

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60">
                {saving ? 'Saving…' : editId ? 'Update Property' : 'Add Property'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: User Area Access ──────────────────────────────────────────────────

function UserAreaAccessTab() {
  const [roleFilter, setRoleFilter] = useState('broker');
  const [users, setUsers]           = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [areas, setAreas]           = useState([]);     // editing additionalAreas for selected user
  const [newArea, setNewArea]       = useState({ city: '', area: '', pincode: '', label: '' });
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');

  useEffect(() => {
    setSelected(null);
    fetchUsers(roleFilter);
  }, [roleFilter]);

  async function fetchUsers(role) {
    setLoadingUsers(true);
    try {
      const r = await api.get(`/users?role=${role}`);
      setUsers(Array.isArray(r.data) ? r.data : []);
    } catch { setUsers([]); }
    setLoadingUsers(false);
  }

  function openUser(u) {
    setSelected(u);
    setAreas(u.additionalAreas ? [...u.additionalAreas] : []);
    setMsg('');
  }

  function addArea() {
    if (!newArea.city && !newArea.pincode) return;
    setAreas(a => [...a, { ...newArea }]);
    setNewArea({ city: '', area: '', pincode: '', label: '' });
  }

  function removeArea(idx) {
    setAreas(a => a.filter((_, i) => i !== idx));
  }

  async function saveAreas() {
    setSaving(true);
    try {
      await api.patch(`/users/${selected._id}/areas`, { additionalAreas: areas });
      setMsg('Areas saved successfully.');
      // refresh list
      fetchUsers(roleFilter);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to save.');
    }
    setSaving(false);
  }

  const inp = 'flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-5">
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-sm text-slate-600">
        <span className="font-semibold text-primary">How it works:</span> By default, users only see mortgage properties matching their registered city/area/pincode.
        Grant additional area access here so they can also see properties from other locations.
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 flex-wrap">
        {['buyer', 'broker', 'developer', 'investor'].map(role => (
          <button key={role} onClick={() => setRoleFilter(role)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition capitalize
              ${roleFilter === role ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary'}`}>
            {role}s
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* User list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{roleFilter}s ({users.length})</p>
          </div>
          {loadingUsers ? (
            <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No {roleFilter}s found.</div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
              {users.map(u => (
                <button key={u._id} onClick={() => openUser(u)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${selected?._id === u._id ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.city || '—'}{u.area ? `, ${u.area}` : ''}</p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      {(u.additionalAreas?.length > 0) && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                          +{u.additionalAreas.length}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Area editor */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-100 py-16">
              Select a user to manage their area access
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <div>
                <p className="font-montserrat font-bold text-slate-800">{selected.name}</p>
                <p className="text-xs text-slate-400">{selected.email} · {selected.role}</p>
              </div>

              {/* Home area (read-only) */}
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-400 mb-1">Registered Area (always included)</p>
                <p className="text-sm text-slate-700 flex items-center gap-1.5">
                  <span className="material-icons-outlined text-sm text-slate-400">home</span>
                  {[selected.city, selected.area, selected.pincode].filter(Boolean).join(' · ') || 'No location registered'}
                </p>
              </div>

              {/* Existing additional areas */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Additional Area Access ({areas.length})</p>
                {areas.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No additional areas granted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {areas.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
                        <span className="material-icons-outlined text-sm text-primary">location_on</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">
                            {a.label || [a.city, a.area, a.pincode].filter(Boolean).join(' · ')}
                          </p>
                          {a.label && (
                            <p className="text-xs text-slate-400">{[a.city, a.area, a.pincode].filter(Boolean).join(' · ')}</p>
                          )}
                        </div>
                        <button onClick={() => removeArea(i)}
                          className="text-rose-400 hover:text-rose-600 flex-shrink-0">
                          <span className="material-icons-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new area */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grant New Area</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input className={inp} placeholder="City *" value={newArea.city}
                    onChange={e => setNewArea(a => ({ ...a, city: e.target.value }))} />
                  <input className={inp} placeholder="Area" value={newArea.area}
                    onChange={e => setNewArea(a => ({ ...a, area: e.target.value }))} />
                  <input className={inp} placeholder="Pincode" value={newArea.pincode}
                    onChange={e => setNewArea(a => ({ ...a, pincode: e.target.value }))} />
                  <input className={inp} placeholder="Label (optional)" value={newArea.label}
                    onChange={e => setNewArea(a => ({ ...a, label: e.target.value }))} />
                </div>
                <button onClick={addArea} disabled={!newArea.city && !newArea.pincode}
                  className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition disabled:opacity-40">
                  + Add Area
                </button>
              </div>

              {msg && (
                <div className={`p-2 rounded-xl text-xs font-semibold text-center ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {msg}
                </div>
              )}

              <button onClick={saveAreas} disabled={saving}
                className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-container transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Area Access'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

// ── Pending Review Tab ───────────────────────────────────────────────────────

function PendingReviewTab({ onApproved }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing]         = useState(false);
  const [msg, setMsg]               = useState('');

  async function fetchPending() {
    setLoading(true);
    try {
      const { data } = await api.get('/mortgage-properties/pending');
      setProperties(data.properties || []);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { fetchPending(); }, []);

  async function approve(id) {
    setActing(true);
    try {
      await api.patch(`/mortgage-properties/${id}/verify`, { action: 'approve' });
      setMsg('Property approved and now live.');
      fetchPending();
      onApproved?.();
    } catch (err) { setMsg(err.response?.data?.message || 'Failed.'); }
    setActing(false);
  }

  async function reject() {
    if (!rejectModal) return;
    setActing(true);
    try {
      await api.patch(`/mortgage-properties/${rejectModal}/verify`, { action: 'reject', rejectionReason: rejectReason });
      setMsg('Property rejected. Bank has been notified.');
      setRejectModal(null);
      setRejectReason('');
      fetchPending();
    } catch (err) { setMsg(err.response?.data?.message || 'Failed.'); }
    setActing(false);
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`p-3 rounded-xl text-sm font-semibold ${msg.includes('approved') || msg.includes('rejected') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{msg}</div>
      )}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">verified</span>
          <p className="text-slate-400 mt-3">No pending submissions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border-2 border-amber-200 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">pending</span> Pending Review
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{mortgageTypeLabel(p)}</span>
                  </div>
                  <p className="font-montserrat font-bold text-slate-800">{p.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <span className="material-icons-outlined text-xs">location_on</span>
                    {[p.city, p.area, p.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">Submitted</p>
                  <p className="text-xs font-semibold text-slate-600">{new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-3">
                <div>
                  <p className="text-xs text-slate-400">Price</p>
                  <p className="font-bold text-slate-800 text-sm">₹{Number(p.price).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Bank</p>
                  <p className="text-sm font-semibold text-slate-700">{p.bankName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Auction Date</p>
                  <p className="text-sm text-slate-700">{p.auctionDate ? new Date(p.auctionDate).toLocaleDateString('en-IN') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Contact</p>
                  <p className="text-sm text-slate-700">{p.contactPhone || '—'}</p>
                </div>
              </div>

              {p.description && (
                <p className="text-sm text-on-surface-variant bg-slate-50 rounded-xl p-3">{p.description}</p>
              )}

              {/* Submitted by */}
              {p.addedBy && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                  <span className="material-icons-outlined text-blue-400 text-sm">business</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-700">{p.addedBy.name}</p>
                    <p className="text-xs text-blue-400">{p.addedBy.email} · {p.addedBy.role}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => approve(p._id)} disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-60">
                  <span className="material-icons-outlined text-base">check_circle</span> Approve & Publish
                </button>
                <button onClick={() => { setRejectModal(p._id); setRejectReason(''); }} disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-rose-300 text-rose-700 text-sm font-semibold hover:bg-rose-50 transition disabled:opacity-60">
                  <span className="material-icons-outlined text-base">cancel</span> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-montserrat font-bold text-slate-800">Reject Property</h3>
            <p className="text-sm text-slate-500">Optionally provide a reason — the bank will be notified.</p>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)…"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
            <div className="flex gap-3">
              <button onClick={reject} disabled={acting}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition disabled:opacity-60">
                {acting ? 'Rejecting…' : 'Confirm Reject'}
              </button>
              <button onClick={() => setRejectModal(null)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminMortgageProperties() {
  const [tab, setTab] = useState('properties');

  const TABS = [
    { key: 'properties', label: 'All Properties',  icon: 'home_work' },
    { key: 'preview',    label: 'Preview (Admin)',  icon: 'visibility' },
    { key: 'areas',      label: 'User Area Access', icon: 'manage_accounts' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Mortgage Properties</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage bank repo / auction listings and control who sees what by area</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition relative
              ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="material-icons-outlined text-base">{t.icon}</span>
            {t.label}
            {t.badge > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'properties' && <PropertiesTab />}
      {tab === 'preview'    && <MortgageHub portalColor="#451886" showRoleBadges />}
      {tab === 'areas'      && <UserAreaAccessTab />}
    </div>
  );
}
