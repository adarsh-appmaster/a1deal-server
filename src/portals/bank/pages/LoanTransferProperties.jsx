import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import MediaUploader from '../../../components/common/MediaUploader';

const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'row_house'];
const VISIBLE_OPTS = [
  { key: 'buyer',     label: 'Buyers',     color: 'bg-violet-100 text-violet-700' },
  { key: 'broker',    label: 'Brokers',    color: 'bg-rose-100 text-rose-600' },
  { key: 'developer', label: 'Developers', color: 'bg-sky-100 text-sky-700' },
  { key: 'investor',  label: 'Investors',  color: 'bg-emerald-100 text-emerald-700' },
];
const STATUS_STYLE = {
  available:     { label: 'Available',     color: 'bg-emerald-100 text-emerald-700' },
  under_process: { label: 'Under Process', color: 'bg-amber-100 text-amber-700' },
  transferred:   { label: 'Transferred',   color: 'bg-sky-100 text-sky-700' },
};

const EMPTY_FORM = {
  title: '', description: '', city: '', area: '', pincode: '', address: '',
  propertyType: 'apartment', bedrooms: '', areaSqft: '', askingPrice: '',
  loanBank: '', outstandingLoanAmount: '', monthlyEmi: '', tenureRemainingMonths: '', interestRate: '',
  status: 'available',
  visibleTo: ['buyer', 'broker'],
};

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4c81]/30';
const LIMIT = 9;

function fmt(n) {
  const v = Number(n);
  if (!v) return '—';
  return v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
}

export default function LoanTransferProperties() {
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

  const fetchProps = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const { data } = await api.get(`/loan-transfer?${params}`);
      setProperties(data.properties || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } catch { /* empty */ }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchProps(1); }, [fetchProps]);

  const [stats, setStats] = useState({ available: 0, under_process: 0, transferred: 0 });
  useEffect(() => {
    async function loadStats() {
      try {
        const [av, up, tr] = await Promise.all([
          api.get('/loan-transfer?page=1&limit=1&status=available'),
          api.get('/loan-transfer?page=1&limit=1&status=under_process'),
          api.get('/loan-transfer?page=1&limit=1&status=transferred'),
        ]);
        setStats({ available: av.data.total || 0, under_process: up.data.total || 0, transferred: tr.data.total || 0 });
      } catch { /* empty */ }
    }
    loadStats();
  }, [properties]);

  function openAdd() { setForm({ ...EMPTY_FORM }); setFormImages([]); setFormVideo(''); setEditId(null); setMsg(''); setShowForm(true); }
  function openEdit(p) {
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
    });
    setFormImages(p.images || []);
    setFormVideo(p.video || '');
    setEditId(p._id);
    setMsg('');
    setShowForm(true);
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
        bedrooms:              form.bedrooms !== '' ? Number(form.bedrooms) : undefined,
        areaSqft:               form.areaSqft !== '' ? Number(form.areaSqft) : undefined,
        askingPrice:            form.askingPrice !== '' ? Number(form.askingPrice) : undefined,
        outstandingLoanAmount:  form.outstandingLoanAmount !== '' ? Number(form.outstandingLoanAmount) : undefined,
        monthlyEmi:             form.monthlyEmi !== '' ? Number(form.monthlyEmi) : undefined,
        tenureRemainingMonths:  form.tenureRemainingMonths !== '' ? Number(form.tenureRemainingMonths) : undefined,
        interestRate:           form.interestRate !== '' ? Number(form.interestRate) : undefined,
        images: formImages,
        video: formVideo,
      };
      if (editId) {
        await api.patch(`/loan-transfer/${editId}`, payload);
      } else {
        await api.post('/loan-transfer', payload);
      }
      setShowForm(false);
      fetchProps(editId ? page : 1);
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this property listing?')) return;
    try { await api.delete(`/loan-transfer/${id}`); fetchProps(page); } catch { /* empty */ }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Loan Transfer Properties</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage properties with an existing loan available for transfer</p>
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
          { label: 'Under Process', value: stats.under_process, color: 'text-amber-600' },
          { label: 'Transferred',   value: stats.transferred,   color: 'text-sky-600' },
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
          {['all', 'available', 'under_process', 'transferred'].map(s => (
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
          <span className="material-icons-outlined text-5xl text-slate-200">sync_alt</span>
          <p className="text-on-surface-variant mt-3">No properties found</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl bg-[#0f4c81] text-white text-sm font-semibold hover:bg-[#1565c0] transition">
            Add Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map(p => {
            const st = STATUS_STYLE[p.status] || STATUS_STYLE.available;
            return (
              <div key={p._id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                  <span className="text-xs text-on-surface-variant capitalize">{p.propertyType?.replace('_', ' ')}</span>
                </div>

                <div>
                  <h3 className="font-montserrat font-bold text-on-surface leading-tight">{p.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                    <span className="material-icons-outlined text-sm">location_on</span>
                    {[p.city, p.area, p.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-on-surface-variant">Asking Price</p>
                    <p className="font-bold text-on-surface">{fmt(p.askingPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Loan Bank</p>
                    <p className="font-semibold text-on-surface text-xs truncate">{p.loanBank || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Outstanding</p>
                    <p className="font-semibold text-on-surface">{fmt(p.outstandingLoanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Monthly EMI</p>
                    <p className="font-semibold text-on-surface">{fmt(p.monthlyEmi)}</p>
                  </div>
                </div>

                {p.status === 'transferred' && p.bookedPrice != null && (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="material-icons-outlined text-sm">check_circle</span>
                    Transferred at {fmt(p.bookedPrice)}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {(p.visibleTo || []).map(role => {
                    const opt = VISIBLE_OPTS.find(o => o.key === role);
                    return (
                      <span key={role} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${opt?.color || 'bg-slate-100 text-slate-600'}`}>
                        {role}
                      </span>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-1 border-t border-outline-variant">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#0f4c81]/30 text-[#0f4c81] text-xs font-semibold hover:bg-[#0f4c81]/5 transition">
                    <span className="material-icons-outlined text-sm">edit</span> Edit
                  </button>
                  <button onClick={() => handleDelete(p._id)}
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
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-semibold">{msg}</div>
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</label>
                  <textarea name="description" rows={2} value={form.description} onChange={handleChange} placeholder="Additional details…" className={`${inp} resize-none`} />
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

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Visible To</label>
                <div className="flex flex-wrap gap-3">
                  {VISIBLE_OPTS.map(o => (
                    <label key={o.key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.visibleTo.includes(o.key)} onChange={() => toggleVisible(o.key)} className="accent-[#0f4c81]" />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${form.visibleTo.includes(o.key) ? o.color : 'text-slate-400'}`}>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-[#0f4c81] text-white font-bold text-sm hover:bg-[#1565c0] transition disabled:opacity-60">
                {saving ? 'Saving…' : editId ? 'Update Listing' : 'Add Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
