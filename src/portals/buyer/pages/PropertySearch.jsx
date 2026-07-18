import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WhatsAppGroupCard from '../../../components/common/WhatsAppGroupCard';
import PropertyCard from '../../../components/common/PropertyCard';
import { PropertyCardSkeleton } from '../../../components/common/Skeleton';
import EmptyState from '../../../components/common/EmptyState';
import BackButton from '../../../components/common/BackButton';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { MORTGAGE_TYPES, mortgageTypeLabel } from '../../../utils/mortgagePropertyTypes';

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

export default function PropertySearch() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user }  = useAuth();
  const isGuest   = !user;

  const [inputVal, setInputVal] = useState(params.get('q') || '');
  const [query, setQuery]       = useState(params.get('q') || '');
  const [tab, setTab]           = useState('all');
  const [filters, setFilters]   = useState({ type: 'all', beds: 'any', maxPrice: '' });
  const [view]                  = useState('grid'); // always grid — list view removed
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

  // Keep the search bar in sync with the URL's ?q= — e.g. when the City switcher
  // navigates here (or changes the city) while this page is already mounted.
  const urlQuery = params.get('q') || '';
  useEffect(() => {
    setInputVal(urlQuery);
    setQuery(urlQuery);
  }, [urlQuery]);

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
      <BackButton fallback="/buyer" label="Back" className="mb-4" />
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
          className="px-4 sm:px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition flex items-center justify-center">
          <span className="material-icons-outlined sm:hidden text-xl">search</span>
          <span className="hidden sm:inline">Search</span>
        </button>
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
        <aside className="w-56 flex-shrink-0 hidden md:block space-y-4">
          {FilterPanel}
          {/* Deal Desk shortcut */}
          <button onClick={() => navigate('/buyer/deal-desk')}
            className="card p-4 w-full text-left hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-icons-outlined text-primary">storefront</span>
              <span className="font-montserrat font-bold text-on-surface">Deal Desk</span>
            </div>
            <p className="text-xs text-on-surface-variant">Properties listed directly by brokers — no platform commission.</p>
          </button>
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
              {[1, 2, 3, 4].map(i => <PropertyCardSkeleton key={i} variant={view} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="search_off"
                label="No properties found"
                hint={hasFilters
                  ? 'Try a different city, area or pincode, or clear the filters'
                  : 'No properties are listed yet — check back soon'}
                actionLabel={hasFilters ? 'Clear Filters' : ''}
                onAction={hasFilters ? clearFilters : null}
              />
            </div>
          ) : (
            <>
              <p className="text-sm text-on-surface-variant mb-4">
                {total} {total === 1 ? 'property' : 'properties'} found
              </p>
              <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {results.map(p => (
                  <PropertyCard
                    key={p._id}
                    property={p}
                    model={p._model}
                    variant={view}
                    showStatus
                    blurImages={isGuest}
                    onClick={goToProperty}
                  />
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
