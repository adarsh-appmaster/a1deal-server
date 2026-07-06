import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WhatsAppGroupCard from '../../../components/common/WhatsAppGroupCard';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { MORTGAGE_TYPES, mortgageTypeLabel } from '../../../utils/mortgagePropertyTypes';

const STATUS_COLOR = {
  'available':          'bg-emerald-100 text-emerald-800',
  'under_negotiation':  'bg-amber-100 text-amber-800',
  'under_auction':      'bg-amber-100 text-amber-800',
  'sold':               'bg-slate-100 text-slate-500',
  'withdrawn':          'bg-slate-100 text-slate-500',
};
const STATUS_LABEL = {
  'available':         'Available',
  'under_negotiation': 'Under Offer',
  'under_auction':     'Under Auction',
  'sold':              'Sold',
  'withdrawn':          'Withdrawn',
};

// UnitProperty type enum values
const UNIT_PROPERTY_TYPES = [
  { value: 'all',        label: 'All Types' },
  { value: 'tower',      label: 'Apartment / Tower' },
  { value: 'villa',      label: 'Villa / Bungalow' },
  { value: 'penthouse',  label: 'Penthouse' },
  { value: 'rowhouse',   label: 'Row House' },
  { value: 'plot',       label: 'Plot' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'duplex',     label: 'Duplex' },
  { value: 'farmland',   label: 'Farm Land' },
  { value: 'warehouse',  label: 'Warehouse' },
];

const MORTGAGE_TYPE_OPTS = [
  { value: 'all', label: 'All Types' },
  ...MORTGAGE_TYPES.map(t => ({ value: t, label: mortgageTypeLabel({ type: t }) })),
];

const TABS = [
  { key: 'all',      label: 'All Properties' },
  { key: 'unit',     label: 'Property Partners' },
  { key: 'mortgage', label: 'Property Deals' },
];

function formatPrice(n) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function locationLine(p) {
  return [p.area, p.city, p.pincode].filter(Boolean).join(', ');
}

export default function PropertySearch() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user }  = useAuth();
  const isGuest   = !user;

  const [inputVal, setInputVal] = useState(params.get('q') || '');
  const [query, setQuery]       = useState(params.get('q') || '');
  const [tab, setTab]           = useState('all');
  const [filters, setFilters]   = useState({ type: 'all', beds: 'any', maxPrice: '' });
  const [view, setView]         = useState('grid');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [total, setTotal]       = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const typeOptions = tab === 'mortgage' ? MORTGAGE_TYPE_OPTS : UNIT_PROPERTY_TYPES;

  const fetchResults = useCallback(async (q, f, currentTab) => {
    setLoading(true);
    try {
      const fetchUnits = currentTab !== 'mortgage';
      const fetchMortgages = currentTab !== 'unit';

      const unitParams = new URLSearchParams();
      if (q) unitParams.set('search', q);
      if (currentTab !== 'mortgage' && f.type !== 'all') unitParams.set('type', f.type);
      if (f.beds !== 'any') unitParams.set('beds', f.beds);
      if (f.maxPrice) unitParams.set('maxPrice', f.maxPrice);
      unitParams.set('limit', currentTab === 'unit' ? '20' : '10');

      const mortgageParams = new URLSearchParams();
      if (q) mortgageParams.set('search', q);
      mortgageParams.set('limit', currentTab === 'mortgage' ? '20' : '10');

      const [unitRes, mortgageRes] = await Promise.all([
        fetchUnits ? api.get(`/unit-properties/public?${unitParams}`) : Promise.resolve(null),
        fetchMortgages ? api.get(`/mortgage-properties/public?${mortgageParams}`) : Promise.resolve(null),
      ]);

      const units = (unitRes?.data.properties || []).map(p => ({ ...p, _model: 'UnitProperty' }));
      let mortgages = (mortgageRes?.data.properties || []).map(p => ({ ...p, _model: 'MortgageProperty' }));

      // Mortgage type/bedroom/price filters aren't supported server-side — apply client-side
      if (fetchMortgages) {
        if (currentTab === 'mortgage' && f.type !== 'all') mortgages = mortgages.filter(p => p.type === f.type);
        if (f.beds !== 'any') mortgages = mortgages.filter(p => (p.bedrooms || 0) >= Number(f.beds));
        if (f.maxPrice) mortgages = mortgages.filter(p => (p.price || 0) <= Number(f.maxPrice));
      }

      const combined = [...units, ...mortgages];
      setResults(combined);
      setTotal(combined.length);
    } catch {
      setResults([]);
      setTotal(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchResults(query, filters, tab); }, [query, filters, tab, fetchResults]);

  function handleSearch(e) {
    e.preventDefault();
    setQuery(inputVal.trim());
  }

  function handleTabChange(key) {
    setTab(key);
    setFilters(f => ({ ...f, type: 'all' }));
  }

  function clearFilters() {
    setFilters({ type: 'all', beds: 'any', maxPrice: '' });
    setInputVal('');
    setQuery('');
  }

  function goToProperty(p) {
    navigate(p._model === 'MortgageProperty' ? `/buyer/mortgage/${p._id}` : `/buyer/property/${p._id}`);
  }

  const hasFilters = query || filters.type !== 'all' || filters.beds !== 'any' || filters.maxPrice;

  const FilterPanel = (
    <div className="card p-4 space-y-4">
      <h3 className="font-montserrat font-semibold text-on-surface">Filters</h3>

      <div>
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Property Type</label>
        {typeOptions.map(t => (
          <label key={t.value} className="flex items-center gap-2 py-1.5 cursor-pointer">
            <input type="radio" name="type" value={t.value}
              checked={filters.type === t.value}
              onChange={() => setFilters(f => ({ ...f, type: t.value }))}
              className="w-4 h-4 accent-primary" />
            <span className="text-sm text-on-surface capitalize">{t.label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Min Bedrooms</label>
        <select value={filters.beds}
          onChange={e => setFilters(f => ({ ...f, beds: e.target.value }))}
          className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="any">Any</option>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+ BHK</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Max Price</label>
        <select value={filters.maxPrice}
          onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
          className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Any</option>
          <option value="5000000">Up to ₹50 L</option>
          <option value="10000000">Up to ₹1 Cr</option>
          <option value="25000000">Up to ₹2.5 Cr</option>
          <option value="50000000">Up to ₹5 Cr</option>
          <option value="100000000">Up to ₹10 Cr</option>
        </select>
      </div>

      {hasFilters && (
        <button onClick={clearFilters}
          className="w-full text-sm text-primary font-semibold hover:underline text-left">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search by city, area, locality or pincode…"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button type="submit"
          className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition">
          Search
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <button type="button" onClick={() => setView('grid')}
            className={`p-2 rounded-lg ${view === 'grid' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            <span className="material-icons-outlined text-xl">grid_view</span>
          </button>
          <button type="button" onClick={() => setView('list')}
            className={`p-2 rounded-lg ${view === 'list' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            <span className="material-icons-outlined text-xl">view_list</span>
          </button>
        </div>
      </form>

      {/* Property type tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition
              ${tab === t.key ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Mobile filter trigger */}
      <button type="button" onClick={() => setShowMobileFilters(true)}
        className="md:hidden mb-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold">
        <span className="material-icons-outlined text-base">tune</span>
        Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
      </button>

      <div className="flex gap-6">
        {/* Filters sidebar — desktop only */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          {FilterPanel}
        </aside>

        {/* Mobile filter drawer */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:hidden" onClick={() => setShowMobileFilters(false)}>
            <div className="bg-surface w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-montserrat font-bold text-on-surface">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)}>
                  <span className="material-icons-outlined text-on-surface-variant">close</span>
                </button>
              </div>
              {FilterPanel}
              <button onClick={() => setShowMobileFilters(false)}
                className="w-full mt-4 py-3 rounded-xl bg-primary text-white font-bold text-sm">
                Show {total} {total === 1 ? 'Result' : 'Results'}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className={`bg-slate-100 ${view === 'list' ? 'w-48 h-32' : 'h-44'}`} />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card p-16 flex flex-col items-center justify-center text-center">
              <span className="material-icons-outlined text-5xl text-slate-200 mb-3">search_off</span>
              <p className="font-semibold text-on-surface mb-1">No properties found</p>
              <p className="text-sm text-on-surface-variant mb-4">
                {hasFilters
                  ? 'Try a different city, area or pincode, or clear the filters'
                  : 'No properties are listed yet — check back soon'}
              </p>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant mb-4">
                {total} {total === 1 ? 'property' : 'properties'} found
              </p>
              <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {results.map(p => (
                  <div
                    key={p._id}
                    onClick={() => goToProperty(p)}
                    className={`card overflow-hidden cursor-pointer hover:shadow-level-3 transition-all ${view === 'list' ? 'flex' : ''}`}
                  >
                    <div className={`relative bg-surface-container-high flex items-center justify-center flex-shrink-0 overflow-hidden ${view === 'list' ? 'w-44 h-full min-h-[7rem]' : 'h-44'}`}>
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title}
                          className={`w-full h-full object-cover ${isGuest ? 'blur-md scale-110' : ''}`} />
                      ) : (
                        <span className="material-icons-outlined text-5xl text-on-surface-variant/30">apartment</span>
                      )}
                      {isGuest && p.images?.[0] && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/25">
                          <span className="material-icons-outlined text-white text-2xl drop-shadow">lock</span>
                          <span className="text-white text-[11px] font-semibold drop-shadow">Login to view photos</span>
                        </div>
                      )}
                      <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10
                        ${p._model === 'MortgageProperty' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                        {p._model === 'MortgageProperty' ? 'Property Deal' : 'Property Partner'}
                      </span>
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs text-on-surface-variant truncate capitalize">
                          {p._model === 'MortgageProperty' ? mortgageTypeLabel(p) : p.propertyType?.replace(/_/g, ' ')} · {locationLine(p) || '—'}
                        </p>
                        {p.status && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[p.status] || 'bg-slate-100 text-slate-500'}`}>
                            {STATUS_LABEL[p.status] || p.status}
                          </span>
                        )}
                      </div>
                      <h3 className="font-montserrat font-bold text-on-surface mb-1 truncate">{p.title}</h3>
                      <p className="text-primary font-bold mb-2">{formatPrice(p.price)}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant">
                        {p.bedrooms  > 0 && <span>{p.bedrooms} BHK</span>}
                        {p.bathrooms > 0 && <><span>·</span><span>{p.bathrooms} Bath</span></>}
                        {(p.areaSqft || p.area_sqft) > 0 && <><span>·</span><span>{(p.areaSqft || p.area_sqft).toLocaleString()} sqft</span></>}
                        {p.isFeatured && (
                          <span className="ml-auto text-amber-600 font-semibold flex items-center gap-1">
                            <span className="material-icons-outlined text-sm">star</span>Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        <WhatsAppGroupCard type="unit" />
      </div>
    </div>
  );
}
