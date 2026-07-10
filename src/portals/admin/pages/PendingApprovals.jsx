import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../../api/axios';
import { SearchFilter } from '../../../components/common/SearchFilter';
import { Pagination } from '../../../components/common/Pagination';
import { useConfirm } from '../../../hooks/useConfirm';

const ROLE_LABELS = {
  developer: 'Developer',
  investor: 'Investor',
  bank: 'Bank',
};

const ROLE_COLOR = {
  developer: 'bg-sky-100 text-sky-700',
  investor: 'bg-emerald-100 text-emerald-700',
  bank: 'bg-indigo-100 text-indigo-700',
};

const ITEMS_PER_PAGE = 10;

export default function PendingApprovals() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMsg, setActionMsg]   = useState('');
  const [workingId, setWorkingId]   = useState(null);
  const { confirm, dialog } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/pending');
      setItems(data || []);
    } catch {
      setActionMsg('Failed to load pending approvals.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let result = items;

    if (tab !== 'all') result = result.filter(i => i.role === tab);
    if (roleFilter)    result = result.filter(i => i.role === roleFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i =>
        i.name?.toLowerCase().includes(term) ||
        i.email?.toLowerCase().includes(term) ||
        i.company?.toLowerCase().includes(term) ||
        i.phone?.includes(term)
      );
    }

    return result;
  }, [items, tab, roleFilter, searchTerm]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  async function handleApprove(item) {
    setWorkingId(item._id);
    setActionMsg('');
    try {
      await api.patch(`/users/${item._id}/approve`);
      setItems(prev => prev.filter(i => i._id !== item._id));
      setActionMsg(`${item.name} approved.`);
    } catch (ex) {
      setActionMsg(ex.response?.data?.message || 'Approval failed.');
    }
    setWorkingId(null);
  }

  async function handleReject(item) {
    if (!(await confirm(`Reject and permanently remove ${item.name}'s registration? This cannot be undone.`, { danger: true, confirmLabel: 'Reject' }))) return;
    setWorkingId(item._id);
    setActionMsg('');
    try {
      await api.delete(`/users/${item._id}/reject`);
      setItems(prev => prev.filter(i => i._id !== item._id));
      setActionMsg(`${item.name}'s registration rejected and removed.`);
    } catch (ex) {
      setActionMsg(ex.response?.data?.message || 'Rejection failed.');
    }
    setWorkingId(null);
  }

  const counts = {
    all: items.length,
    developer: items.filter(i => i.role === 'developer').length,
    investor: items.filter(i => i.role === 'investor').length,
    bank: items.filter(i => i.role === 'bank').length,
  };

  return (
    <div>
      {dialog}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Pending Approvals</h1>
          <p className="text-on-surface-variant text-sm mt-1">Review and approve new developer, investor & bank registrations</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2 rounded-xl">
          <span className="material-icons-outlined text-base">pending</span>
          {counts.all} awaiting review
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all', label: 'All Pending' },
          { key: 'developer', label: 'Developers' },
          { key: 'investor', label: 'Investors' },
          { key: 'bank', label: 'Banks' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
              tab === t.key ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={v => { setSearchTerm(v); setCurrentPage(1); }}
        placeholder="Search name, email, company, phone..."
        filters={[
          { key: 'role', allLabel: 'All Roles', options: [
            { value: 'developer', label: 'Developers' },
            { value: 'investor', label: 'Investors' },
            { value: 'bank', label: 'Banks' },
          ]}
        ]}
        filterValue={{ role: roleFilter }}
        onFilterChange={(key, value) => { if (key === 'role') { setRoleFilter(value); setCurrentPage(1); } }}
      />

      {actionMsg && (
        <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm">
          <span className="material-icons-outlined text-base">info</span>
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <span className="material-icons-outlined animate-spin mr-2">refresh</span> Loading…
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="card text-center py-16">
          <span className="material-icons-outlined text-4xl text-on-surface-variant/40 mb-3">check_circle</span>
          <p className="text-on-surface-variant font-medium">
            {searchTerm || roleFilter ? 'No matching approvals found' : 'All caught up! No pending approvals.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mt-4">
            {paginatedItems.map(item => (
              <div key={item._id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                    {item.name?.[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-montserrat font-bold text-on-surface">{item.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLOR[item.role] || 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABELS[item.role] || item.role}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{item.email}{item.phone ? ` · ${item.phone}` : ''}</p>
                    {item.company && (
                      <p className="text-sm text-on-surface-variant mt-0.5">
                        <span className="material-icons-outlined text-sm align-middle mr-1">business</span>
                        {item.company}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">schedule</span>
                        Submitted {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {!item.emailVerified && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <span className="material-icons-outlined text-sm">mail</span>
                          Email not yet verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReject(item)}
                      disabled={workingId === item._id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-50 transition disabled:opacity-50"
                    >
                      <span className="material-icons-outlined text-base">close</span>
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(item)}
                      disabled={workingId === item._id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50"
                    >
                      <span className="material-icons-outlined text-base">check</span>
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </div>
  );
}
