import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import LoanTransferMySubmissions from '../../../components/common/LoanTransferMySubmissions';

const STATUS_COLORS = {
  available:    'bg-emerald-100 text-emerald-700',
  under_process:'bg-amber-100 text-amber-700',
  transferred:  'bg-slate-100 text-slate-500',
};

const TYPES = [
  { value: 'all',        label: 'All Types' },
  { value: 'apartment',  label: 'Apartment' },
  { value: 'villa',      label: 'Villa' },
  { value: 'row_house',  label: 'Row House' },
  { value: 'commercial', label: 'Commercial' },
];

const TABS = ['Available Properties', 'My Submissions'];

export default function BuyerLoanTransfer() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [tab, setTab]             = useState(0);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [applyNote, setApplyNote] = useState('');
  const [applying, setApplying]   = useState(false);
  const [applied, setApplied]     = useState(new Set());

  const [inputVal, setInputVal]   = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');

  const fetchProperties = useCallback(async (search, type) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (type && type !== 'all') params.set('type', type);
      const r = await api.get(`/loan-transfer?${params}`);
      setProperties(r.data.properties || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProperties(searchQuery, typeFilter); }, [searchQuery, typeFilter, fetchProperties]);

  function handleSearch(e) {
    e.preventDefault();
    setSearchQuery(inputVal.trim());
  }

  function clearSearch() {
    setInputVal('');
    setSearchQuery('');
  }

  async function handleApply(prop) {
    setApplying(true);
    try {
      await api.post('/enquiry', {
        name:  user?.name  || '',
        phone: user?.phone || '',
        email: user?.email || '',
        city:  prop.city  || '',
        area:  prop.area  || '',
        message: applyNote,
        propertyId:    prop._id,
        propertyModel: 'LoanTransferProperty',
        propertyTitle: prop.title || '',
      });
      setApplied(s => new Set([...s, prop._id]));
      setSelected(null);
      setApplyNote('');
    } catch { /* empty */ }
    setApplying(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-slate-800">Loan Transfer Properties</h1>
        <p className="text-slate-500 text-sm mt-1">
          Take over an existing home loan — lower processing fees and faster approvals.
          You can also submit your own property for loan transfer listing.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-slate-100 pb-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition
              ${tab === i ? 'bg-[#4900e5] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Available Properties ── */}
      {tab === 0 && (
        <>
          {/* Search + filters */}
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
                <input
                  type="text"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  placeholder="Search by city, area, pincode, bank…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 bg-white"
                />
              </div>
              <button type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition">
                Search
              </button>
              {searchQuery && (
                <button type="button" onClick={clearSearch}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm transition">
                  <span className="material-icons-outlined text-sm">close</span>
                </button>
              )}
            </form>

            {/* Type filter chips */}
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button key={t.value} onClick={() => setTypeFilter(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                    ${typeFilter === t.value
                      ? 'bg-[#4900e5] text-white border-transparent'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active search banner */}
          {searchQuery && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#4900e5]/5 border border-[#4900e5]/20 rounded-xl text-sm">
              <span className="material-icons-outlined text-[#4900e5] text-sm">travel_explore</span>
              <span className="text-slate-700">
                Searching all cities for <span className="font-semibold text-[#4900e5]">"{searchQuery}"</span>
                {' '}— {properties.length} result{properties.length !== 1 ? 's' : ''} found
              </span>
              <button onClick={clearSearch} className="ml-auto text-xs text-slate-400 hover:text-slate-700 underline">
                Show my area
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-slate-400">
              <span className="material-icons-outlined text-3xl animate-spin block mb-2" style={{ color: '#4900e5' }}>progress_activity</span>
              {searchQuery ? `Searching for "${searchQuery}"…` : 'Loading properties near you…'}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-icons-outlined text-5xl text-slate-300">account_balance</span>
              <p className="text-slate-400 mt-3">
                {searchQuery ? `No properties found for "${searchQuery}"` : 'No loan transfer properties in your area yet.'}
              </p>
              {searchQuery && (
                <button onClick={clearSearch} className="mt-3 text-sm text-[#4900e5] underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map(p => (
                <div key={p._id} className="bg-white rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative h-40 bg-slate-100 flex items-center justify-center">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      : <span className="material-icons-outlined text-slate-300 text-4xl">sync_alt</span>}
                  </div>
                  <div className="bg-gradient-to-br from-[#f5f3ff] to-white px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                        {p.status?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">{p.propertyType?.replace('_', ' ')}</span>
                    </div>
                    <h3 className="font-montserrat font-bold text-base text-slate-800 leading-tight">{p.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">location_on</span>
                      {p.area ? `${p.area}, ` : ''}{p.city}{p.pincode ? ` – ${p.pincode}` : ''}
                    </p>
                  </div>

                  <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-slate-50">
                    <div>
                      <p className="text-xs text-slate-400">Asking Price</p>
                      <p className="font-bold text-slate-800 text-sm">
                        {p.askingPrice ? `₹${(p.askingPrice / 100000).toFixed(1)}L` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Outstanding Loan</p>
                      <p className="font-bold text-[#4900e5] text-sm">
                        {p.outstandingLoanAmount ? `₹${(p.outstandingLoanAmount / 100000).toFixed(1)}L` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Monthly EMI</p>
                      <p className="font-semibold text-slate-700 text-sm">
                        {p.monthlyEmi ? `₹${p.monthlyEmi.toLocaleString('en-IN')}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Interest Rate</p>
                      <p className="font-semibold text-slate-700 text-sm">{p.interestRate ? `${p.interestRate}%` : '—'}</p>
                    </div>
                  </div>

                  {p.loanBank && (
                    <div className="px-4 py-2 flex items-center gap-2 bg-slate-50">
                      <span className="material-icons-outlined text-sm text-slate-400">account_balance</span>
                      <p className="text-xs text-slate-600 font-medium">{p.loanBank}</p>
                      {p.tenureRemainingMonths && (
                        <span className="text-xs text-slate-400 ml-auto">{p.tenureRemainingMonths} months left</span>
                      )}
                    </div>
                  )}

                  {p.requiredDocs?.length > 0 && (
                    <div className="px-4 py-2">
                      <p className="text-xs text-slate-400">
                        <span className="material-icons-outlined text-xs align-middle">description</span>{' '}
                        {p.requiredDocs.length} documents required
                      </p>
                    </div>
                  )}

                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setSelected(p)}
                      disabled={applied.has(p._id) || p.status === 'transferred'}
                      className={`w-full py-2 rounded-xl text-sm font-semibold transition
                        ${applied.has(p._id)
                          ? 'bg-emerald-50 text-emerald-700 cursor-default'
                          : p.status === 'transferred'
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-[#4900e5] text-white hover:bg-[#6236ff]'}`}>
                      {applied.has(p._id) ? '✓ Applied' : p.status === 'transferred' ? 'Already Transferred' : 'Express Interest'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── My Submissions ── */}
      {tab === 1 && <LoanTransferMySubmissions accentColor="#4900e5" />}

      {/* Interest Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-montserrat font-bold text-lg text-slate-800">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {selected.images?.[0] && (
                <img src={selected.images[0]} alt={selected.title} className="w-full h-48 object-cover rounded-xl" />
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Asking Price', selected.askingPrice ? `₹${selected.askingPrice.toLocaleString('en-IN')}` : '—'],
                  ['Outstanding Loan', selected.outstandingLoanAmount ? `₹${selected.outstandingLoanAmount.toLocaleString('en-IN')}` : '—'],
                  ['Loan Bank', selected.loanBank || '—'],
                  ['Monthly EMI', selected.monthlyEmi ? `₹${selected.monthlyEmi.toLocaleString('en-IN')}` : '—'],
                  ['Interest Rate', selected.interestRate ? `${selected.interestRate}%` : '—'],
                  ['Tenure Left', selected.tenureRemainingMonths ? `${selected.tenureRemainingMonths} months` : '—'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {selected.requiredDocs?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Documents You'll Need</p>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1.5">
                    {selected.requiredDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="material-icons-outlined text-amber-500 text-sm">task_alt</span>
                        {doc}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Our team will collect these documents after you express interest.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Message (optional)</label>
                <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30"
                  placeholder="Any specific requirements or questions for our team…"
                  value={applyNote} onChange={e => setApplyNote(e.target.value)} />
              </div>

              <button
                onClick={() => navigate(`/buyer/visit/${selected._id}`, {
                  state: { propertyTitle: selected.title, city: selected.city, area: selected.area, propertyModel: 'LoanTransferProperty' },
                })}
                className="w-full py-2.5 rounded-xl border border-[#4900e5] text-[#4900e5] text-sm font-semibold hover:bg-[#4900e5]/5 transition flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">event</span>
                Schedule Site Visit
              </button>

              <div className="flex gap-3">
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={() => handleApply(selected)} disabled={applying}
                  className="flex-1 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] disabled:opacity-50 transition">
                  {applying ? 'Submitting…' : 'Express Interest'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
