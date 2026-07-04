import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const STATUS_COLOR = {
  active:    'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  suspended: 'bg-rose-100 text-rose-700',
};

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', city: '' };
const inp = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30 focus:border-[#484a5a]';

export default function TeamDirectory() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');

  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users', { params: { role: 'team' } });
      const list = Array.isArray(data) ? data : (data.users || []);
      setMembers(list);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load team members.';
      setError(msg);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await api.post('/users', { ...form, role: 'team', status: 'active' });
      setMsg('Team member created.');
      setForm({ ...EMPTY_FORM });
      setTimeout(() => { setShowAdd(false); setMsg(''); load(); }, 1000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create.');
    }
    setSaving(false);
  }

  async function toggleStatus(m) {
    const endpoint = m.status === 'active' ? 'suspend' : 'activate';
    const next     = m.status === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/users/${m._id}/${endpoint}`);
      setMembers(prev => prev.map(x => x._id === m._id ? { ...x, status: next } : x));
      if (selected?._id === m._id) setSelected(s => ({ ...s, status: next }));
    } catch { /* silently */ }
  }

  const filtered = members.filter(m =>
    !search.trim() ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-slate-800">Team Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowAdd(true); setMsg(''); setForm({ ...EMPTY_FORM }); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#484a5a] text-white font-semibold text-sm hover:bg-[#2e3044] transition">
          <span className="material-icons-outlined text-sm">person_add</span>
          Add Team Member
        </button>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email or phone…"
        className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30 focus:border-[#484a5a]"
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <span className="material-icons-outlined text-base">error_outline</span>
          {error}
          <button onClick={load} className="ml-auto text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center text-center">
          <span className="material-icons-outlined text-5xl text-slate-200 mb-3">groups</span>
          <p className="font-semibold text-slate-700 mb-1">
            {search ? 'No members match your search' : 'No team members yet'}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            {search ? 'Try a different name or email' : 'Add your first team member to get started'}
          </p>
          {!search && (
            <button onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-xl bg-[#484a5a] text-white font-semibold text-sm hover:bg-[#2e3044] transition">
              Add Team Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div key={m._id}
              onClick={() => setSelected(m)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-[#484a5a]/10 flex items-center justify-center text-[#484a5a] font-bold text-lg flex-shrink-0">
                  {m.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{m.name}</p>
                  <p className="text-xs text-slate-400 truncate">{m.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[m.status] || 'bg-slate-100 text-slate-500'}`}>
                  {m.status?.charAt(0).toUpperCase() + m.status?.slice(1)}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                {m.phone && (
                  <p className="flex items-center gap-1.5">
                    <span className="material-icons-outlined text-sm text-slate-400">phone</span>
                    {m.phone}
                  </p>
                )}
                {m.city && (
                  <p className="flex items-center gap-1.5">
                    <span className="material-icons-outlined text-sm text-slate-400">location_on</span>
                    {m.city}
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <span className="material-icons-outlined text-sm text-slate-400">calendar_today</span>
                  Joined {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Member detail modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-montserrat font-bold text-base text-slate-800">Team Member</h2>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#484a5a]/10 flex items-center justify-center text-[#484a5a] font-bold text-2xl">
                  {selected.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">{selected.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[selected.status] || 'bg-slate-100 text-slate-500'}`}>
                    {selected.status?.charAt(0).toUpperCase() + selected.status?.slice(1)}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="material-icons-outlined text-base text-slate-400">email</span>
                  {selected.email}
                </div>
                {selected.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="material-icons-outlined text-base text-slate-400">phone</span>
                    {selected.phone}
                  </div>
                )}
                {selected.city && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="material-icons-outlined text-base text-slate-400">location_on</span>
                    {[selected.area, selected.city].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <button
                onClick={() => toggleStatus(selected)}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition ${
                  selected.status === 'active'
                    ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                    : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}>
                {selected.status === 'active' ? 'Suspend Member' : 'Activate Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add member modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-montserrat font-bold text-base text-slate-800">Add Team Member</h2>
              <button onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-3">
              <input required placeholder="Full name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inp} />
              <input required type="email" placeholder="Email address" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inp} />
              <input required type="password" placeholder="Password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={inp} />
              <input placeholder="Phone number" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inp} />
              <input placeholder="City" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className={inp} />
              {msg && (
                <p className={`text-xs px-3 py-2 rounded-lg ${msg.includes('created') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {msg}
                </p>
              )}
              <button type="submit" disabled={saving}
                className="w-full py-2.5 rounded-xl bg-[#484a5a] text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60">
                {saving ? 'Creating…' : 'Create Team Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
