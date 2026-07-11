import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { Pagination } from '../../../components/common/Pagination';
import { validateForm } from '../../../validation/validate';
import { Joi } from '../../../validation/schemas';
import { name as nameRule, email as emailRule, password as passwordRule, phone as phoneRule, shortText, pincode as pincodeRule } from '../../../validation/common';

const createUserFormSchema = Joi.object({
  name: nameRule.required(),
  email: emailRule.required(),
  password: passwordRule.required(),
  role: Joi.string().valid('buyer', 'broker', 'developer', 'investor', 'bank', 'admin', 'team').required(),
  phone: phoneRule.allow('', null),
  company: shortText.allow('', null),
  city: shortText.allow('', null),
  area: shortText.allow('', null),
  pincode: pincodeRule.allow('', null),
}).unknown(true);

const createBankerFormSchema = Joi.object({
  name: nameRule.required(),
  email: emailRule.required(),
  phone: phoneRule.allow('', null),
  company: shortText.allow('', null),
  city: shortText.allow('', null),
  area: shortText.allow('', null),
  pincode: pincodeRule.allow('', null),
}).unknown(true);

const ROLES = ['buyer', 'broker', 'developer', 'investor', 'bank', 'admin', 'team'];

const ROLE_COLOR = {
  developer: 'bg-blue-100 text-blue-800',
  broker:    'bg-purple-100 text-purple-800',
  buyer:     'bg-green-100 text-green-800',
  investor:  'bg-orange-100 text-orange-800',
  admin:     'bg-gray-100 text-gray-800',
  bank:      'bg-amber-100 text-amber-800',
  team:      'bg-cyan-100 text-cyan-800',
};

const STATUS_COLOR = {
  active:    'bg-emerald-100 text-emerald-800',
  suspended: 'bg-red-100 text-red-800',
  pending:   'bg-amber-100 text-amber-800',
};

const EMPTY_FORM = {
  name: '', email: '', password: '', role: 'buyer',
  phone: '', company: '', city: '', area: '', pincode: '',
};

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const LIMIT = 15;

export default function UserManagement() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]   = useState({ ...EMPTY_FORM });
  const [saving, setSaving]   = useState(false);
  const [formMsg, setFormMsg] = useState('');

  const [editUser, setEditUser]   = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg]     = useState('');

  const [actionMsg, setActionMsg] = useState('');
  const [actionOk, setActionOk] = useState(true);

  // Create banker modal state
  const [showBankerModal, setShowBankerModal] = useState(false);
  const [bankerForm, setBankerForm] = useState({ name: '', email: '', phone: '', company: '', city: '', pincode: '' });
  const [bankerSaving, setBankerSaving] = useState(false);
  const [bankerMsg, setBankerMsg] = useState('');
  const [bankerCreated, setBankerCreated] = useState(null); // { user, tempPassword }

  async function fetchUsers(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (roleFilter !== 'all')   params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim())          params.set('q', search.trim());
      const { data } = await api.get(`/users?${params}`);
      if (data && typeof data === 'object' && 'users' in data) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotal(data.length);
        setPages(1);
      }
      setPage(p);
    } catch (err) {
      console.error('fetch users error', err);
      setUsers([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(t);
  }, [roleFilter, statusFilter, search]); // eslint-disable-line

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    const { errors } = validateForm(createUserFormSchema, form);
    if (errors) { setFormMsg(Object.values(errors)[0]); return; }
    setSaving(true); setFormMsg('');
    try {
      await api.post('/users', form);
      setFormMsg('User created successfully.');
      setForm({ ...EMPTY_FORM });
      setTimeout(() => { setShowCreate(false); setFormMsg(''); fetchUsers(1); }, 1200);
    } catch (err) {
      setFormMsg(err.response?.data?.message || 'Failed to create user.');
    }
    setSaving(false);
  }

  function openEdit(u) {
    setEditUser(u);
    setEditForm({
      name: u.name || '', role: u.role || 'buyer',
      phone: u.phone || '', company: u.company || '',
      city: u.city || '', area: u.area || '', pincode: u.pincode || '',
      brokerTier: u.brokerTier || 'standard',
      coverageAreas: u.coverageAreas?.length ? u.coverageAreas : [],
    });
    setEditMsg('');
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setEditSaving(true); setEditMsg('');
    try {
      await api.put(`/users/${editUser._id}`, editForm);
      setEditMsg('Saved.');
      setTimeout(() => { setEditUser(null); fetchUsers(page); }, 800);
    } catch (err) {
      setEditMsg(err.response?.data?.message || 'Failed to update.');
    }
    setEditSaving(false);
  }

  async function handleCreateBanker(e) {
    e.preventDefault();
    const { errors } = validateForm(createBankerFormSchema, bankerForm);
    if (errors) { setBankerMsg(Object.values(errors)[0]); return; }
    setBankerSaving(true); setBankerMsg(''); setBankerCreated(null);
    try {
      const { data } = await api.post('/users/create-banker', bankerForm);
      setBankerCreated({ user: data.user, tempPassword: data.tempPassword });
      setBankerMsg('Banker account created successfully.');
      setBankerForm({ name: '', email: '', phone: '', company: '', city: '', pincode: '' });
      fetchUsers(1);
    } catch (err) {
      setBankerMsg(err.response?.data?.message || 'Failed to create banker.');
    }
    setBankerSaving(false);
  }

  async function toggleSuspend(u) {
    const action = u.status === 'suspended' ? 'activate' : 'suspend';
    try {
      await api.patch(`/users/${u._id}/${action}`);
      setActionOk(true);
      setActionMsg(`User ${action}d.`);
      fetchUsers(page);
      setTimeout(() => setActionMsg(''), 2500);
    } catch (err) {
      setActionOk(false);
      setActionMsg(err.response?.data?.message || `Failed to ${action} user.`);
      setTimeout(() => setActionMsg(''), 3500);
    }
  }

  async function handleApprove(u) {
    try {
      await api.patch(`/users/${u._id}/approve`);
      setActionOk(true);
      setActionMsg('User approved and activated.');
      fetchUsers(page);
      setTimeout(() => setActionMsg(''), 2500);
    } catch (err) {
      setActionOk(false);
      setActionMsg(err.response?.data?.message || 'Failed to approve user.');
      setTimeout(() => setActionMsg(''), 3500);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">User Management</h1>
          <p className="text-sm text-on-surface-variant">{total} user{total !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowBankerModal(true); setBankerMsg(''); setBankerCreated(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition"
          >
            <span className="material-icons-outlined text-base">account_balance</span>
            Add Banker
          </button>
          <button
            onClick={() => { setShowCreate(true); setForm({ ...EMPTY_FORM }); setFormMsg(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition"
          >
            <span className="material-icons-outlined text-base">person_add</span>
            Create User
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className={`p-3 rounded-xl text-sm font-semibold ${actionOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{actionMsg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
        >
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[140px]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Location', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate max-w-[140px]">{u.name}</p>
                          {u.company && (
                            <p className="text-xs text-slate-400 truncate max-w-[140px]">{u.company}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize w-fit ${ROLE_COLOR[u.role] || 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                        {u.role === 'broker' && u.brokerTier === 'master' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-violet-100 text-violet-700 w-fit">Master</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLOR[u.status] || 'bg-slate-100 text-slate-600'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {[u.city, u.area].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} title="Edit user"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition">
                          <span className="material-icons-outlined text-base">edit</span>
                        </button>
                        {u.status === 'pending' && (
                          <button onClick={() => handleApprove(u)} title="Approve user"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition">
                            <span className="material-icons-outlined text-base">check_circle</span>
                          </button>
                        )}
                        <button
                          onClick={() => toggleSuspend(u)}
                          title={u.status === 'suspended' ? 'Activate user' : 'Suspend user'}
                          className={`p-1.5 rounded-lg transition ${
                            u.status === 'suspended'
                              ? 'hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600'
                              : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'
                          }`}
                        >
                          <span className="material-icons-outlined text-base">
                            {u.status === 'suspended' ? 'lock_open' : 'block'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pages}
          totalItems={total}
          itemsPerPage={LIMIT}
          onPageChange={p => fetchUsers(p)}
        />
      )}

      {/* ── Create User Modal ───────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-montserrat font-bold text-lg text-slate-800">Create User</h2>
              <button onClick={() => setShowCreate(false)}>
                <span className="material-icons-outlined text-slate-400">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${formMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {formMsg}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Full Name *</label>
                  <input name="name" required value={form.name} onChange={handleChange} placeholder="Rahul Sharma" className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email *</label>
                  <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="user@example.com" className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Password *</label>
                  <input name="password" type="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="Min 6 characters" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Role *</label>
                  <select name="role" value={form.role} onChange={handleChange} className={inp}>
                    {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Company</label>
                  <input name="company" value={form.company} onChange={handleChange} placeholder="Company name" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City</label>
                  <input name="city" value={form.city} onChange={handleChange} placeholder="Pune" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pincode</label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="411045" className={inp} />
                </div>
              </div>
              <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
                User will be created as <strong>Active</strong> with email pre-verified — they can log in immediately.
              </p>
              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60">
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Banker Modal ─────────────────────────── */}
      {showBankerModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowBankerModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-amber-500">account_balance</span>
                <h2 className="font-montserrat font-bold text-lg text-slate-800">Add Banker / Bank</h2>
              </div>
              <button onClick={() => setShowBankerModal(false)}>
                <span className="material-icons-outlined text-slate-400">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {bankerMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${bankerMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {bankerMsg}
                </div>
              )}

              {bankerCreated ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-2">
                    <p className="font-bold text-amber-800">Account Created — Share these credentials</p>
                    <p><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-800">{bankerCreated.user.name}</span></p>
                    <p><span className="text-slate-500">Email:</span> <span className="font-semibold text-slate-800">{bankerCreated.user.email}</span></p>
                    <p><span className="text-slate-500">Temp Password:</span>
                      <code className="ml-2 px-2 py-0.5 bg-white border border-amber-200 rounded text-amber-800 font-bold text-base">
                        {bankerCreated.tempPassword}
                      </code>
                    </p>
                    <p className="text-xs text-amber-600">An email with these credentials has been sent to the banker. They should change their password after first login.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setBankerCreated(null); setBankerMsg(''); }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                      Add Another
                    </button>
                    <button onClick={() => setShowBankerModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-container">
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateBanker} className="space-y-4">
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
                    A temporary password will be auto-generated and emailed to the banker. They can add Mortgage properties once logged in.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Full Name *</label>
                    <input required value={bankerForm.name} onChange={e => setBankerForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Rajesh Mehta" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email *</label>
                    <input required type="email" value={bankerForm.email} onChange={e => setBankerForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="rajesh@hdfc.com" className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Phone</label>
                      <input value={bankerForm.phone} onChange={e => setBankerForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="9876543210" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bank Name</label>
                      <input value={bankerForm.company} onChange={e => setBankerForm(f => ({ ...f, company: e.target.value }))}
                        placeholder="HDFC Bank" className={inp} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City</label>
                      <input value={bankerForm.city} onChange={e => setBankerForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="Jaipur" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pincode</label>
                      <input value={bankerForm.pincode} onChange={e => setBankerForm(f => ({ ...f, pincode: e.target.value }))}
                        placeholder="302001" className={inp} />
                    </div>
                  </div>
                  <button type="submit" disabled={bankerSaving}
                    className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition disabled:opacity-60">
                    {bankerSaving ? 'Creating…' : 'Create Banker Account'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ─────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-montserrat font-bold text-lg text-slate-800">Edit User</h2>
                <p className="text-xs text-slate-400 mt-0.5">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)}>
                <span className="material-icons-outlined text-slate-400">close</span>
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              {editMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${editMsg === 'Saved.' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {editMsg}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Full Name</label>
                  <input required value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Role</label>
                  <select value={editForm.role || ''} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className={inp}>
                    {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Phone</label>
                  <input value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91…" className={inp} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Company</label>
                  <input value={editForm.company || ''} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City</label>
                  <input value={editForm.city || ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area</label>
                  <input value={editForm.area || ''} onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pincode</label>
                  <input value={editForm.pincode || ''} onChange={e => setEditForm(f => ({ ...f, pincode: e.target.value }))} className={inp} />
                </div>
              </div>

              {/* ── Master Broker Settings (broker role only) ── */}
              {(editForm.role === 'broker' || editUser?.role === 'broker') && (
                <div className="border border-violet-100 rounded-2xl p-4 space-y-3 bg-violet-50/30">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">Master Broker Settings</p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Broker Tier</label>
                    <select
                      value={editForm.brokerTier || 'standard'}
                      onChange={e => setEditForm(f => ({ ...f, brokerTier: e.target.value }))}
                      className={inp}
                    >
                      <option value="standard">Standard Broker</option>
                      <option value="master">Master Broker</option>
                    </select>
                  </div>

                  {editForm.brokerTier === 'master' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Coverage Areas</label>
                        <button
                          type="button"
                          onClick={() => setEditForm(f => ({ ...f, coverageAreas: [...(f.coverageAreas || []), { city: '', area: '', pincode: '' }] }))}
                          className="text-xs px-2 py-1 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 font-semibold transition"
                        >+ Add Area</button>
                      </div>
                      {(editForm.coverageAreas || []).length === 0 && (
                        <p className="text-xs text-slate-400 italic">No coverage areas added yet.</p>
                      )}
                      {(editForm.coverageAreas || []).map((ca, i) => (
                        <div key={i} className="grid grid-cols-3 gap-2 items-center">
                          <input
                            placeholder="City"
                            value={ca.city || ''}
                            onChange={e => setEditForm(f => {
                              const arr = [...(f.coverageAreas || [])];
                              arr[i] = { ...arr[i], city: e.target.value };
                              return { ...f, coverageAreas: arr };
                            })}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                          />
                          <input
                            placeholder="Area / Locality"
                            value={ca.area || ''}
                            onChange={e => setEditForm(f => {
                              const arr = [...(f.coverageAreas || [])];
                              arr[i] = { ...arr[i], area: e.target.value };
                              return { ...f, coverageAreas: arr };
                            })}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                          />
                          <div className="flex gap-1">
                            <input
                              placeholder="Pincode"
                              value={ca.pincode || ''}
                              onChange={e => setEditForm(f => {
                                const arr = [...(f.coverageAreas || [])];
                                arr[i] = { ...arr[i], pincode: e.target.value };
                                return { ...f, coverageAreas: arr };
                              })}
                              className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                            />
                            <button
                              type="button"
                              onClick={() => setEditForm(f => {
                                const arr = (f.coverageAreas || []).filter((_, j) => j !== i);
                                return { ...f, coverageAreas: arr };
                              })}
                              className="p-1 rounded-lg text-rose-400 hover:bg-rose-50 transition"
                            >
                              <span className="material-icons-outlined text-sm">remove_circle</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={editSaving}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60">
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
