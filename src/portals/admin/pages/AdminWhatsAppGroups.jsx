import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { SearchFilter } from '../../../components/common/SearchFilter';
import { Pagination } from '../../../components/common/Pagination';
import { validateForm } from '../../../validation/validate';
import { whatsappGroupSchema } from '../../../validation/schemas';
import { useConfirm } from '../../../hooks/useConfirm';
import { toast } from '../../../components/common/Toast';

const TYPE_OPTS = [
  { v: 'mortgage', l: 'Mortgage Property', icon: 'home_work', color: 'bg-amber-100 text-amber-700' },
  { v: 'unit',     l: 'Unit Partnership',  icon: 'apartment', color: 'bg-blue-100 text-blue-700' },
];

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30';

const EMPTY_FORM = { type: 'mortgage', city: '', groupName: '', link: '', description: '' };

export default function AdminWhatsAppGroups() {
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const LIMIT = 10;
  const { confirm, dialog } = useConfirm();

  async function fetchGroups() {
    setLoading(true);
    try {
      const params = typeFilter !== 'all' ? `?type=${typeFilter}` : '';
      const { data } = await api.get(`/whatsapp-groups${params}`);
      setGroups(data.groups || []);
    } catch { /* empty */ }
    setLoading(false);
  }

  useEffect(() => { fetchGroups(); }, [typeFilter]); // eslint-disable-line

  const filteredGroups = groups.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (g.city?.toLowerCase().includes(q) || g.groupName?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) || g.type?.toLowerCase().includes(q));
  });
  const totalPages = Math.ceil(filteredGroups.length / LIMIT);
  const paginatedGroups = filteredGroups.slice((page - 1) * LIMIT, page * LIMIT);

  const byCities = paginatedGroups.reduce((acc, g) => {
    if (!acc[g.city]) acc[g.city] = [];
    acc[g.city].push(g);
    return acc;
  }, {});
  
  useEffect(() => { setPage(1); }, [search]);

  function openAdd() { setForm({ ...EMPTY_FORM }); setEditId(null); setMsg(''); setShowForm(true); }
  function openEdit(g) {
    setForm({ type: g.type, city: g.city, groupName: g.groupName, link: g.link, description: g.description || '' });
    setEditId(g._id);
    setMsg('');
    setShowForm(true);
  }

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    const { errors } = validateForm(whatsappGroupSchema, form);
    if (errors) { setMsg(Object.values(errors)[0]); return; }
    setSaving(true); setMsg('');
    try {
      if (editId) {
        await api.patch(`/whatsapp-groups/${editId}`, form);
      } else {
        await api.post('/whatsapp-groups', form);
      }
      setShowForm(false);
      fetchGroups();
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!(await confirm('Remove this group link?', { danger: true, confirmLabel: 'Remove' }))) return;
    try { await api.delete(`/whatsapp-groups/${id}`); fetchGroups(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to remove group.'); }
  }

  // Group by city for display - now computed above with pagination

  return (
    <div className="space-y-6">
      {dialog}
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-montserrat font-bold text-xl text-slate-800">WhatsApp Groups</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage city-wise community groups for mortgage and unit properties</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-xl hover:bg-[#128C7E] transition">
          <span className="material-icons-outlined text-base">add</span> Add Group
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-4 flex gap-3">
        <span className="material-icons-outlined text-[#25D366] text-xl flex-shrink-0 mt-0.5">info</span>
        <div className="text-sm text-slate-700">
          <p className="font-semibold mb-1">How group links work</p>
          <p className="text-slate-500">Add the WhatsApp group invite link (e.g. <span className="font-mono text-xs bg-white px-1 py-0.5 rounded border">https://chat.whatsapp.com/...</span>) for each city.
          Users will see the relevant group for their city on their portal dashboard.</p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        {[{ v: 'all', l: 'All Groups' }, ...TYPE_OPTS.map(t => ({ v: t.v, l: t.l }))].map(t => (
          <button key={t.v} onClick={() => setTypeFilter(t.v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition
              ${typeFilter === t.v ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
            {t.l}
          </button>
        ))}
      </div>

      <SearchFilter
        searchTerm={search}
        onSearchChange={setSearch}
        placeholder="Search groups by city, name, description..."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <p className="font-montserrat font-bold text-2xl text-slate-700">{filteredGroups.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Groups</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <p className="font-montserrat font-bold text-2xl text-amber-600">{filteredGroups.filter(g => g.type === 'mortgage').length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Mortgage Groups</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
          <p className="font-montserrat font-bold text-2xl text-blue-600">{filteredGroups.filter(g => g.type === 'unit').length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Unit Partnership Groups</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-icons-outlined text-3xl animate-spin text-[#25D366]">progress_activity</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">groups</span>
          <p className="text-slate-400 mt-3">No WhatsApp groups added yet</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#128C7E] transition">
            Add First Group
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCities).map(([city, cityGroups]) => (
            <div key={city}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-outlined text-slate-400 text-sm">location_on</span>
                <h2 className="font-montserrat font-bold text-slate-700">{city}</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{cityGroups.length} group{cityGroups.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cityGroups.map(g => {
                  const typeOpt = TYPE_OPTS.find(t => t.v === g.type);
                  return (
                    <div key={g._id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3 hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-icons-outlined text-[#25D366] text-xl">{typeOpt?.icon || 'groups'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-slate-800 text-sm truncate">{g.groupName}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeOpt?.color || 'bg-slate-100 text-slate-600'}`}>
                            {typeOpt?.l || g.type}
                          </span>
                        </div>
                        {g.description && <p className="text-xs text-slate-400 mb-1.5 truncate">{g.description}</p>}
                        <a href={g.link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#25D366] font-semibold hover:underline flex items-center gap-1 truncate">
                          <span className="material-icons-outlined text-sm">link</span>
                          <span className="truncate">{g.link}</span>
                        </a>
                        {g.createdBy && (
                          <p className="text-xs text-slate-300 mt-1">Added by {g.createdBy.name}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(g)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-tertiary hover:border-tertiary transition">
                          <span className="material-icons-outlined text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(g._id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-300 transition">
                          <span className="material-icons-outlined text-sm">delete_outline</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredGroups.length}
          itemsPerPage={LIMIT}
          onPageChange={setPage}
        />
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-montserrat font-bold text-lg text-slate-800">
                {editId ? 'Edit Group Link' : 'Add WhatsApp Group'}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <span className="material-icons-outlined text-slate-400">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {msg && <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm font-semibold">{msg}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Group Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {TYPE_OPTS.map(t => (
                    <button key={t.v} type="button" onClick={() => setForm(f => ({ ...f, type: t.v }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition
                        ${form.type === t.v ? 'border-[#25D366] bg-[#25D366]/5 text-[#128C7E]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <span className="material-icons-outlined text-lg">{t.icon}</span>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City *</label>
                <input name="city" required value={form.city} onChange={handleChange} placeholder="e.g. Pune" className={inp} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Group Name *</label>
                <input name="groupName" required value={form.groupName} onChange={handleChange}
                  placeholder={`e.g. A1 Deal ${form.type === 'mortgage' ? 'Mortgage Property' : 'Unit Partnership'} ${form.city || 'City'}`}
                  className={inp} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">WhatsApp Invite Link *</label>
                <input name="link" required value={form.link} onChange={handleChange}
                  placeholder="https://chat.whatsapp.com/..." className={inp} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Description</label>
                <input name="description" value={form.description} onChange={handleChange}
                  placeholder="Optional note about this group" className={inp} />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#128C7E] transition disabled:opacity-60">
                {saving ? 'Saving…' : editId ? 'Update Group' : 'Add Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
