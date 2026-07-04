import { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import LoanTransferMySubmissions from '../../../components/common/LoanTransferMySubmissions';

const STATUS_COLORS = {
  available:     'bg-emerald-100 text-emerald-700',
  under_process: 'bg-amber-100 text-amber-700',
  transferred:   'bg-slate-100 text-slate-500',
};

const TABS = ['Available Properties', 'My Submissions'];

/* ── helpers ─────────────────────────────────────────────────────────────── */
function areaKey(a) {
  return [a.city, a.area, a.pincode].filter(Boolean).join('|').toLowerCase();
}
function areaLabel(a) {
  return [a.city, a.area, a.pincode].filter(Boolean).join(' · ') || 'Unknown area';
}
function propertyMatchesArea(prop, area) {
  const pc  = (prop.pincode || '').toLowerCase();
  const pa  = (prop.area    || '').toLowerCase();
  const pci = (prop.city    || '').toLowerCase();
  if (area.pincode && pc === area.pincode.toLowerCase()) return true;
  if (area.area    && pa.includes(area.area.toLowerCase()))  return true;
  if (area.city    && pci.includes(area.city.toLowerCase())) return true;
  return false;
}
function propertyMatchesSearch(prop, q) {
  const s = q.toLowerCase();
  return [prop.title, prop.city, prop.area, prop.pincode, prop.loanBank, prop.propertyType]
    .some(v => (v || '').toLowerCase().includes(s));
}

export default function BrokerLoanTransfer() {
  const { user }      = useAuth();
  const [tab, setTab] = useState(0);

  // Data
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [myAreas, setMyAreas]       = useState({ homeArea: null, additionalAreas: [] });

  // Filters
  const [selectedKeys, setSelectedKeys] = useState(new Set(['__all__']));
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');

  // Apply flow
  const [selected, setSelected] = useState(null);
  const [applyNote, setApplyNote]   = useState('');
  const [applying, setApplying]     = useState(false);
  const [applied, setApplied]       = useState(new Set());

  useEffect(() => {
    Promise.all([
      api.get('/loan-transfer').catch(() => ({ data: { properties: [] } })),
      api.get('/mortgage-properties/my-areas').catch(() => ({ data: { homeArea: null, additionalAreas: [] } })),
    ]).then(([lt, areas]) => {
      setProperties(lt.data.properties || []);
      setMyAreas(areas.data || { homeArea: null, additionalAreas: [] });
    }).finally(() => setLoading(false));
  }, []);

  // Build area chips
  const chips = useMemo(() => {
    const list = [{ key: '__all__', label: 'All Areas', isAll: true }];
    if (myAreas.homeArea) {
      list.push({
        key: areaKey(myAreas.homeArea),
        label: areaLabel(myAreas.homeArea) + ' (My Area)',
        area: myAreas.homeArea,
        isHome: true,
      });
    }
    for (const a of (myAreas.additionalAreas || [])) {
      list.push({
        key: areaKey(a),
        label: a.label ? `${a.label} (${areaLabel(a)})` : areaLabel(a),
        area: a,
      });
    }
    return list;
  }, [myAreas]);

  function toggleChip(key) {
    if (key === '__all__') { setSelectedKeys(new Set(['__all__'])); return; }
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.delete('__all__');
      if (next.has(key)) { next.delete(key); if (next.size === 0) return new Set(['__all__']); }
      else next.add(key);
      return next;
    });
  }

  // Filtered + searched list
  const filtered = useMemo(() => {
    let list = properties;

    // Area filter
    if (!selectedKeys.has('__all__')) {
      const areas = chips.filter(c => !c.isAll && selectedKeys.has(c.key)).map(c => c.area);
      list = list.filter(p => areas.some(a => propertyMatchesArea(p, a)));
    }

    // Search filter
    if (search.trim()) {
      list = list.filter(p => propertyMatchesSearch(p, search));
    }

    return list;
  }, [properties, selectedKeys, chips, search]);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
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

  const isMaster = user?.brokerTier === 'master';
  const hasMultipleAreas = chips.length > 2;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-montserrat font-bold text-xl text-slate-800">Loan Transfer Properties</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isMaster ? 'Pitch loan transfer opportunities to clients. You can also list your own property.' :
              'Express interest or submit your own property for loan transfer listing.'}
          </p>
        </div>
        {isMaster && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-rose-100 text-rose-700 flex-shrink-0">
            Master Broker
          </span>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-slate-100 pb-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition
              ${tab === i ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Available Properties ── */}
      {tab === 0 && (
        <>
          {/* Area filter chips */}
          {hasMultipleAreas && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-icons-outlined text-sm text-rose-500">location_on</span>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Your Zone</p>
                {!selectedKeys.has('__all__') && (
                  <button onClick={() => setSelectedKeys(new Set(['__all__']))}
                    className="ml-auto text-xs text-slate-400 hover:text-slate-700 underline">Clear</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {chips.map(chip => {
                  const active = selectedKeys.has(chip.key);
                  return (
                    <button key={chip.key} onClick={() => toggleChip(chip.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                        ${active
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600'}`}>
                      {chip.isHome && <span className="material-icons-outlined text-xs">home</span>}
                      {chip.isAll  && <span className="material-icons-outlined text-xs">public</span>}
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
              <input
                type="text"
                placeholder="Search by city, area, pincode, bank, title…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              />
            </div>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition">
              Search
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm transition">
                <span className="material-icons-outlined text-sm">close</span>
              </button>
            )}
          </form>

          {/* Result summary */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {filtered.length} propert{filtered.length !== 1 ? 'ies' : 'y'}
              {!selectedKeys.has('__all__') ? ' in selected zone' : search ? ` matching "${search}"` : ''}
            </span>
            {myAreas.homeArea && (
              <span className="flex items-center gap-1">
                <span className="material-icons-outlined text-xs">home</span>
                Zone: {areaLabel(myAreas.homeArea)}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-icons-outlined text-5xl text-slate-300">account_balance</span>
              <p className="text-slate-400 mt-3">
                {search || !selectedKeys.has('__all__')
                  ? 'No properties match your filter. Try clearing the filter.'
                  : 'No loan transfer properties in your area yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p => (
                <div key={p._id} className="bg-white rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="bg-gradient-to-br from-rose-50 to-white px-4 pt-4 pb-3">
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
                      <p className="font-bold text-rose-600 text-sm">
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
                    <div className="px-4 py-2 flex items-center gap-2 bg-slate-50 text-xs text-slate-600">
                      <span className="material-icons-outlined text-sm text-slate-400">account_balance</span>
                      {p.loanBank}
                      {p.tenureRemainingMonths && <span className="ml-auto text-slate-400">{p.tenureRemainingMonths} mo left</span>}
                    </div>
                  )}

                  <div className="px-4 py-2">
                    <p className="text-xs text-slate-400">
                      <span className="material-icons-outlined text-xs align-middle">description</span>{' '}
                      {p.requiredDocs?.length || 0} docs required from buyer
                    </p>
                  </div>

                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setSelected(p)}
                      disabled={applied.has(p._id) || p.status === 'transferred'}
                      className={`w-full py-2 rounded-xl text-sm font-semibold transition
                        ${applied.has(p._id)
                          ? 'bg-emerald-50 text-emerald-700 cursor-default'
                          : p.status === 'transferred'
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-rose-500 text-white hover:bg-rose-600'}`}>
                      {applied.has(p._id) ? '✓ Interest Expressed' : p.status === 'transferred' ? 'Already Transferred' : 'Express Interest'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── My Submissions ── */}
      {tab === 1 && (
        <div className="space-y-4">
          {/* Zone info for submissions */}
          {myAreas.homeArea && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
              <span className="material-icons-outlined text-base text-rose-400">location_on</span>
              Your zone: <span className="font-semibold">{areaLabel(myAreas.homeArea)}</span>
            </div>
          )}
          <LoanTransferMySubmissions accentColor="#f43f5e" />
        </div>
      )}

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
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Buyer Must Submit</p>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1.5">
                    {selected.requiredDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="material-icons-outlined text-amber-500 text-sm">task_alt</span>
                        {doc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700">
                <span className="font-semibold">Note:</span> Assigned broker details are managed internally by our team.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Your Note (optional)</label>
                <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="I have a client interested in this property…"
                  value={applyNote} onChange={e => setApplyNote(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={() => handleApply(selected)} disabled={applying}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition">
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
