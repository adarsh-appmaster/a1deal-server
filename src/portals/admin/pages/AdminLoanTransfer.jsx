import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import SharePropertyModal from '../../../components/common/SharePropertyModal';
import BulkShareModal from '../../../components/common/BulkShareModal';
import { Pagination } from '../../../components/common/Pagination';
import { SearchFilter } from '../../../components/common/SearchFilter';
import MediaUploader from '../../../components/common/MediaUploader';
import BookPropertyModal from '../../../components/common/BookPropertyModal';

const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'row_house'];
const VISIBLE_TO_OPTS = [
  { key: 'buyer',     label: 'Buyers' },
  { key: 'broker',    label: 'Brokers' },
  { key: 'developer', label: 'Developers' },
  { key: 'investor',  label: 'Investors' },
  { key: 'bank',      label: 'Banks' },
];
const ROLE_COLORS = {
  buyer:     'bg-violet-100 text-violet-700',
  broker:    'bg-rose-100 text-rose-600',
  developer: 'bg-sky-100 text-sky-700',
  investor:  'bg-emerald-100 text-emerald-700',
  bank:      'bg-blue-100 text-blue-700',
};
const STATUS_COLORS = {
  available:     'bg-emerald-100 text-emerald-700',
  under_process: 'bg-amber-100 text-amber-700',
  transferred:   'bg-sky-100 text-sky-700',
};

const EMPTY_FORM = {
  title: '', description: '', city: '', area: '', pincode: '', address: '',
  propertyType: 'apartment', bedrooms: '', areaSqft: '', askingPrice: '',
  loanBank: '', outstandingLoanAmount: '', monthlyEmi: '', tenureRemainingMonths: '', interestRate: '',
  status: 'available',
  visibleTo: ['buyer', 'broker'],
  linkedBanker: '',
  commissionBrokerPct: '',
  commissionMasterBrokerPct: '',
};

const LIMIT = 10;

export default function AdminLoanTransfer() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [total, setTotal]           = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [formImages, setFormImages] = useState([]);
  const [formVideo, setFormVideo]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [shareProperty, setShareProperty]       = useState(null);
  const [bulkShareProperty, setBulkShareProperty] = useState(null);
  const [bookProperty, setBookProperty]         = useState(null);
  const [selectedIds, setSelectedIds]           = useState(new Set());
  const [showBulkShare, setShowBulkShare]       = useState(false);
  // Link Banker
  const [linkTarget, setLinkTarget]       = useState(null);
  const [bankers, setBankers]             = useState([]);
  const [bankersLoaded, setBankersLoaded] = useState(false);
  const [selectedBankerId, setSelectedBankerId] = useState('');
  const [linkSaving, setLinkSaving]       = useState(false);
  const [linkMsg, setLinkMsg]             = useState('');

  useEffect(() => {
    const t = setTimeout(() => fetchProps(1), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);  // eslint-disable-line

  useEffect(() => { fetchProps(1); }, [statusFilter]);  // eslint-disable-line

  async function fetchProps(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      const { data } = await api.get(`/loan-transfer?${params}`);
      setProperties(data.properties || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  }

  async function loadBankers() {
    if (bankersLoaded) return;
    try {
      const { data } = await api.get('/users?role=bank');
      setBankers(Array.isArray(data) ? data : []);
      setBankersLoaded(true);
    } catch { setBankers([]); }
  }

  async function openAdd() {
    setForm({ ...EMPTY_FORM });
    setFormImages([]); setFormVideo('');
    setEditId(null); setMsg(''); setShowForm(true);
    await loadBankers();
  }

  async function openEdit(p) {
    setForm({
      title: p.title || '', description: p.description || '',
      city: p.city || '', area: p.area || '', pincode: p.pincode || '', address: p.address || '',
      propertyType: p.propertyType || 'apartment',
      bedrooms: p.bedrooms ?? '', areaSqft: p.areaSqft ?? '', askingPrice: p.askingPrice || '',
      loanBank: p.loanBank || '', outstandingLoanAmount: p.outstandingLoanAmount || '',
      monthlyEmi: p.monthlyEmi || '', tenureRemainingMonths: p.tenureRemainingMonths || '',
      interestRate: p.interestRate || '',
      status: p.status || 'available',
      visibleTo: p.visibleTo || ['buyer', 'broker'],
      linkedBanker: p.linkedBanker?._id || '',
      commissionBrokerPct: p.commissionOverride?.brokerPct ?? '',
      commissionMasterBrokerPct: p.commissionOverride?.masterBrokerPct ?? '',
    });
    setFormImages(p.images || []);
    setFormVideo(p.video || '');
    setEditId(p._id);
    setMsg(''); setShowForm(true);
    await loadBankers();
  }

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  function toggleVisible(key) {
    setForm(f => ({
      ...f,
      visibleTo: f.visibleTo.includes(key) ? f.visibleTo.filter(k => k !== key) : [...f.visibleTo, key],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload = {
        ...form,
        bedrooms:               form.bedrooms !== '' ? Number(form.bedrooms) : undefined,
        areaSqft:               form.areaSqft !== '' ? Number(form.areaSqft) : undefined,
        askingPrice:            form.askingPrice !== '' ? Number(form.askingPrice) : undefined,
        outstandingLoanAmount:  form.outstandingLoanAmount !== '' ? Number(form.outstandingLoanAmount) : undefined,
        monthlyEmi:             form.monthlyEmi !== '' ? Number(form.monthlyEmi) : undefined,
        tenureRemainingMonths:  form.tenureRemainingMonths !== '' ? Number(form.tenureRemainingMonths) : undefined,
        interestRate:           form.interestRate !== '' ? Number(form.interestRate) : undefined,
        linkedBanker:           form.linkedBanker || null,
        commissionOverride: {
          brokerPct:       form.commissionBrokerPct       !== '' ? Number(form.commissionBrokerPct)       : null,
          masterBrokerPct: form.commissionMasterBrokerPct !== '' ? Number(form.commissionMasterBrokerPct) : null,
        },
        images: formImages,
        video:  formVideo,
      };
      delete payload.commissionBrokerPct;
      delete payload.commissionMasterBrokerPct;
      if (editId) {
        await api.patch(`/loan-transfer/${editId}`, payload);
        setMsg('Updated.');
      } else {
        await api.post('/loan-transfer', payload);
        setMsg('Added.');
      }
      setShowForm(false);
      fetchProps(editId ? page : 1);
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  }

  async function deactivate(id) {
    if (!window.confirm('Deactivate this property?')) return;
    try { await api.delete(`/loan-transfer/${id}`); fetchProps(page); } catch { /* empty */ }
  }

  async function openLinkBanker(p) {
    setLinkTarget(p);
    setSelectedBankerId(p.linkedBanker?._id || '');
    setLinkMsg('');
    await loadBankers();
  }

  async function handleLinkBanker() {
    if (!linkTarget) return;
    setLinkSaving(true); setLinkMsg('');
    try {
      await api.patch(`/loan-transfer/${linkTarget._id}`, { linkedBanker: selectedBankerId || null });
      setLinkMsg('Banker linked successfully.');
      fetchProps(page);
      setTimeout(() => setLinkTarget(null), 1200);
    } catch (err) { setLinkMsg(err.response?.data?.message || 'Failed to link.'); }
    setLinkSaving(false);
  }

  const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Loan Transfer Properties</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage loan transfer listings and commission routing by property pincode</p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search by title, city, area, loan bank..."
          />
          <div className="flex gap-2 flex-wrap">
            {['all', 'available', 'under_process', 'transferred'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition capitalize
                  ${statusFilter === s ? 'bg-[#4900e5] text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-[#4900e5]'}`}>
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
              className="flex items-center gap-2 px-4 py-2 bg-[#4900e5] text-white text-sm font-semibold rounded-xl hover:bg-[#6236ff] transition">
              <span className="material-icons-outlined text-base">add</span> Add Property
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading…</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 text-slate-400">No loan transfer properties found.</div>
        ) : (
          <>
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox"
                checked={properties.length > 0 && properties.every(p => selectedIds.has(p._id))}
                onChange={e => {
                  if (e.target.checked) setSelectedIds(prev => new Set([...prev, ...properties.map(p => p._id)]));
                  else setSelectedIds(prev => { const s = new Set(prev); properties.forEach(p => s.delete(p._id)); return s; });
                }}
                className="accent-[#4900e5]" />
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
                  ${selectedIds.has(p._id) ? 'border-[#4900e5] ring-2 ring-[#4900e5]/20' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <input type="checkbox" checked={selectedIds.has(p._id)}
                      onChange={e => setSelectedIds(prev => {
                        const s = new Set(prev);
                        e.target.checked ? s.add(p._id) : s.delete(p._id);
                        return s;
                      })}
                      className="mt-1 accent-[#4900e5] cursor-pointer flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 leading-tight">{p.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{p.loanBank || 'No bank listed'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-500'}`}>
                      {(p.status || '').replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-[#4900e5]/10 text-[#4900e5] rounded-full text-xs font-semibold capitalize">
                      {(p.propertyType || '').replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-slate-500 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <span className="material-icons-outlined text-sm text-slate-400">location_on</span>
                    {[p.city, p.area, p.pincode].filter(Boolean).join(', ')}
                  </p>
                  {p.askingPrice > 0 && (
                    <p className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="material-icons-outlined text-sm text-slate-400">currency_rupee</span>
                      {Number(p.askingPrice).toLocaleString('en-IN')}
                    </p>
                  )}
                  {p.outstandingLoanAmount > 0 && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">account_balance</span>
                      Outstanding: ₹{Number(p.outstandingLoanAmount).toLocaleString('en-IN')}
                      {p.interestRate ? ` @ ${p.interestRate}%` : ''}
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
                      Banker: {p.linkedBanker.name}{p.linkedBanker.company ? ` · ${p.linkedBanker.company}` : ''}
                    </p>
                  )}
                  {p.commission?.mode && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 flex-wrap">
                      <span className="material-icons-outlined text-xs">percent</span>
                      Broker {p.assignedBroker?.name || 'unmatched'} ({p.commission.brokerPercent}%) → MB {p.assignedMasterBroker?.name || 'unmatched'} ({p.commission.masterBrokerPercent}%)
                    </p>
                  )}
                  {p.status === 'transferred' && p.commission?.bookedAt && (
                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 flex-wrap">
                      <span className="material-icons-outlined text-xs">paid</span>
                      Booked · Broker ₹{Number(p.commission.brokerAmount || 0).toLocaleString('en-IN')} · MB ₹{Number(p.commission.masterBrokerAmount || 0).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {(p.visibleTo || []).map(role => (
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
                    className="px-3 py-2 rounded-xl border border-[#4900e5]/30 text-[#4900e5] text-xs font-semibold hover:bg-[#4900e5]/5 transition">
                    <span className="material-icons-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => deactivate(p._id)}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition">
                    <span className="material-icons-outlined text-sm">delete_outline</span>
                  </button>
                </div>
                {p.status !== 'transferred' && (
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
      </div>

      {shareProperty && (
        <SharePropertyModal property={shareProperty} type="loan-transfer" onClose={() => setShareProperty(null)} />
      )}
      {bookProperty && (
        <BookPropertyModal
          propertyId={bookProperty._id}
          propertyModel="LoanTransferProperty"
          priceHint={bookProperty.askingPrice}
          onClose={() => setBookProperty(null)}
          onBooked={() => { setBookProperty(null); fetchProps(page); }}
        />
      )}
      {bulkShareProperty && (
        <BulkShareModal properties={[bulkShareProperty]} type="loan-transfer" onClose={() => setBulkShareProperty(null)} />
      )}
      {showBulkShare && selectedIds.size > 0 && (
        <BulkShareModal
          properties={properties.filter(p => selectedIds.has(p._id))}
          type="loan-transfer"
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
            <p className="text-sm text-slate-500">Select a bank user to give them visibility into this property's enquiries and commissions.</p>
            <select
              value={selectedBankerId}
              onChange={e => setSelectedBankerId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30">
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
              <div className={`p-2 rounded-xl text-xs font-semibold text-center ${linkMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                {linkMsg}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleLinkBanker} disabled={linkSaving}
                className="flex-1 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-bold hover:bg-[#6236ff] transition disabled:opacity-50">
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
                {editId ? 'Edit Loan Transfer Property' : 'Add Loan Transfer Property'}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <span className="material-icons-outlined text-slate-400">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {msg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${msg.includes('pdat') || msg.includes('dded') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{msg}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Title *</label>
                  <input name="title" required value={form.title} onChange={handleChange} placeholder="3BHK Apartment – Loan Transfer Available" className={inp} />
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Property Type</label>
                  <select name="propertyType" value={form.propertyType} onChange={handleChange} className={inp}>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inp}>
                    <option value="available">Available</option>
                    <option value="under_process">Under Process</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Asking Price (₹)</label>
                  <input name="askingPrice" type="number" min="0" value={form.askingPrice} onChange={handleChange} placeholder="7500000" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bedrooms</label>
                  <input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={handleChange} placeholder="3" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area (sqft)</label>
                  <input name="areaSqft" type="number" min="0" value={form.areaSqft} onChange={handleChange} placeholder="1100" className={inp} />
                </div>
              </div>

              {/* Loan Details */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-t border-slate-100 pt-4">Loan Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Loan Bank</label>
                    <input name="loanBank" value={form.loanBank} onChange={handleChange} placeholder="HDFC Bank" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Outstanding Amount (₹)</label>
                    <input name="outstandingLoanAmount" type="number" min="0" value={form.outstandingLoanAmount} onChange={handleChange} placeholder="4500000" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Monthly EMI (₹)</label>
                    <input name="monthlyEmi" type="number" min="0" value={form.monthlyEmi} onChange={handleChange} placeholder="38000" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tenure Remaining (months)</label>
                    <input name="tenureRemainingMonths" type="number" min="0" value={form.tenureRemainingMonths} onChange={handleChange} placeholder="180" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Interest Rate (%)</label>
                    <input name="interestRate" type="number" min="0" step="0.01" value={form.interestRate} onChange={handleChange} placeholder="8.5" className={inp} />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</label>
                <textarea name="description" rows={2} value={form.description} onChange={handleChange} placeholder="Additional details…" className={`${inp} resize-none`} />
              </div>

              {/* Link Banker */}
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
                <p className="text-xs text-slate-400 mt-1">Banker will see enquiries and commissions for this property.</p>
              </div>

              {/* Commission override */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Set % that goes to broker and master broker for this property. Leave blank to use global commission rates.
                  Bank-added properties default to a flat 1% / 1% override, editable here.
                </p>
                <div className="grid grid-cols-2 gap-3">
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
                </div>
              </div>

              {/* Visible To */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Visible To</label>
                <div className="flex flex-wrap gap-3">
                  {VISIBLE_TO_OPTS.map(o => (
                    <label key={o.key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.visibleTo.includes(o.key)} onChange={() => toggleVisible(o.key)} className="accent-[#4900e5]" />
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
                  folder="a1deal/loan-transfer"
                  showVideo
                />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-60">
                {saving ? 'Saving…' : editId ? 'Update Property' : 'Add Property'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
