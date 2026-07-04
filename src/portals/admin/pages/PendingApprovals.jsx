import { useState, useMemo } from 'react';
import { SearchFilter } from '../../../components/common/SearchFilter';
import { Pagination } from '../../../components/common/Pagination';

const PENDING = [
  { id: 1, name: 'Prestige Group', email: 'contact@prestige.in', role: 'developer', company: 'Prestige Estates Pvt. Ltd.', phone: '+91 98765 43210', submitted: '2026-06-27', docs: 3 },
  { id: 2, name: 'Ravi Mehta', email: 'ravi.mehta@gmail.com', role: 'investor', company: 'Mehta Capital Partners', phone: '+91 91234 56789', submitted: '2026-06-27', docs: 0 },
  { id: 3, name: 'Sobha Realtors', email: 'bd@sobha.com', role: 'developer', company: 'Sobha Ltd.', phone: '+91 80123 45678', submitted: '2026-06-26', docs: 5 },
  { id: 4, name: 'Ananya Singh', email: 'ananya@realtyfund.in', role: 'investor', company: 'RealtyFund India', phone: '+91 99887 65432', submitted: '2026-06-26', docs: 2 },
  { id: 5, name: 'Phoenix Mills', email: 'info@phoenix.in', role: 'developer', company: 'Phoenix Mills Ltd.', phone: '+91 22 6121 6000', submitted: '2026-06-25', docs: 7 },
  { id: 6, name: 'Mahindra Lifespaces', email: 'contact@mahindralife.com', role: 'developer', company: 'Mahindra Lifespaces Developers Ltd.', phone: '+91 22 6747 8600', submitted: '2026-06-24', docs: 4 },
  { id: 7, name: 'Vikram Patel', email: 'vikram@capstone.in', role: 'investor', company: 'Capstone Capital', phone: '+91 79 4002 9000', submitted: '2026-06-24', docs: 1 },
  { id: 8, name: 'Godrej Properties', email: 'biz@godrejprop.com', role: 'developer', company: 'Godrej Properties Ltd.', phone: '+91 22 6634 9999', submitted: '2026-06-23', docs: 6 },
  { id: 9, name: 'Priya Sharma', email: 'priya@vertexfund.in', role: 'investor', company: 'Vertex Fund', phone: '+91 11 4150 6000', submitted: '2026-06-23', docs: 3 },
  { id: 10, name: 'Tata Housing', email: 'contact@tatahousing.com', role: 'developer', company: 'Tata Housing Development Co.', phone: '+91 22 6661 5555', submitted: '2026-06-22', docs: 8 },
  { id: 11, name: 'Rahul Agarwal', email: 'rahul@alpha.capital', role: 'investor', company: 'Alpha Capital', phone: '+91 80 4250 7000', submitted: '2026-06-22', docs: 2 },
  { id: 12, name: 'Brigade Group', email: 'info@brigadegroup.com', role: 'developer', company: 'Brigade Enterprises Ltd.', phone: '+91 80 4080 1000', submitted: '2026-06-21', docs: 5 },
];

const ROLE_COLOR = {
  developer: 'bg-sky-100 text-sky-700',
  investor: 'bg-emerald-100 text-emerald-700',
};

const ITEMS_PER_PAGE = 10;

export default function PendingApprovals() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState(PENDING);
  const [actioned, setActioned] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = items;
    
    if (tab !== 'all') {
      result = result.filter(i => i.role === tab);
    }
    if (roleFilter) {
      result = result.filter(i => i.role === roleFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(term) ||
        i.email.toLowerCase().includes(term) ||
        i.company.toLowerCase().includes(term) ||
        i.phone.includes(term)
      );
    }
    
    return result.filter(i => !actioned[i.id]);
  }, [items, tab, roleFilter, searchTerm, actioned]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handle = (id, action) => {
    setActioned(p => ({ ...p, [id]: action }));
    setCurrentPage(1);
  };

  const counts = {
    all: items.filter(i => !actioned[i.id]).length,
    developer: items.filter(i => i.role === 'developer' && !actioned[i.id]).length,
    investor: items.filter(i => i.role === 'investor' && !actioned[i.id]).length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Pending Approvals</h1>
          <p className="text-on-surface-variant text-sm mt-1">Review and approve new developer & investor registrations</p>
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
          ]}
        ]}
        filterValue={{ role: roleFilter }}
        onFilterChange={(key, value) => { if (key === 'role') { setRoleFilter(value); setCurrentPage(1); } }}
      />

      {paginatedItems.length === 0 ? (
        <div className="card text-center py-16">
          <span className="material-icons-outlined text-4xl text-on-surface-variant/40 mb-3">check_circle</span>
          <p className="text-on-surface-variant font-medium">
            {searchTerm || roleFilter ? 'No matching approvals found' : 'All caught up! No pending approvals.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedItems.map(item => {
              const action = actioned[item.id];
              if (action) return (
                <div key={item.id} className={`card p-4 flex items-center gap-3 opacity-60 ${action === 'approved' ? 'border-emerald-200' : 'border-rose-200'}`}>
                  <span className={`material-icons-outlined ${action === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {action === 'approved' ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    <strong>{item.name}</strong> — {action === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                </div>
              );

              return (
                <div key={item.id} className="card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                      {item.name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-montserrat font-bold text-on-surface">{item.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLOR[item.role]}`}>
                          {item.role}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant">{item.email} · {item.phone}</p>
                      {item.company && (
                        <p className="text-sm text-on-surface-variant mt-0.5">
                          <span className="material-icons-outlined text-sm align-middle mr-1">business</span>
                          {item.company}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-icons-outlined text-sm">schedule</span>
                          Submitted {item.submitted}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-icons-outlined text-sm">attach_file</span>
                          {item.docs} document{item.docs !== 1 ? 's' : ''} uploaded
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handle(item.id, 'rejected')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition"
                      >
                        <span className="material-icons-outlined text-base">close</span>
                        Reject
                      </button>
                      <button
                        onClick={() => handle(item.id, 'approved')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition"
                      >
                        <span className="material-icons-outlined text-base">check</span>
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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