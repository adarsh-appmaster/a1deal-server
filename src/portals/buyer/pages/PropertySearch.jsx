import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WhatsAppGroupCard from '../../../components/common/WhatsAppGroupCard';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

const STATUS_COLOR = {
  'available':          'bg-emerald-100 text-emerald-800',
  'under_negotiation':  'bg-amber-100 text-amber-800',
  'sold':               'bg-slate-100 text-slate-500',
};
const STATUS_LABEL = {
  'available':         'Available',
  'under_negotiation': 'Under Offer',
  'sold':              'Sold',
};

// UnitProperty type enum values
const PROPERTY_TYPES = [
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
  const [filters, setFilters]   = useState({ type: 'all', beds: 'any', maxPrice: '' });
  const [view, setView]         = useState('grid');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [total, setTotal]       = useState(0);

  const fetch = useCallback(async (q, f) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (q)                sp.set('search', q);
      if (f.type !== 'all') sp.set('type', f.type);
      if (f.beds !== 'any') sp.set('beds', f.beds);
      if (f.maxPrice)       sp.set('maxPrice', f.maxPrice);
      sp.set('limit', '20');

      const { data } = await api.get(`/unit-properties/public?${sp.toString()}`);
      setResults(data.properties || []);
      setTotal(data.total || 0);
    } catch {
      setResults([]);
      setTotal(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(query, filters); }, [query, filters, fetch]);

  function handleSearch(e) {
    e.preventDefault();
    setQuery(inputVal.trim());
  }

  function clearFilters() {
    setFilters({ type: 'all', beds: 'any', maxPrice: '' });
    setInputVal('');
    setQuery('');
  }

  const hasFilters = query || filters.type !== 'all' || filters.beds !== 'any' || filters.maxPrice;

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
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
        <div className="flex items-center gap-2">
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

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="w-56 flex-shrink-0 hidden md:block">
          <div className="card p-4 space-y-4">
            <h3 className="font-montserrat font-semibold text-on-surface">Filters</h3>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Property Type</label>
              {PROPERTY_TYPES.map(t => (
                <label key={t.value} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input type="radio" name="type" value={t.value}
                    checked={filters.type === t.value}
                    onChange={() => setFilters(f => ({ ...f, type: t.value }))}
                    className="accent-primary" />
                  <span className="text-sm text-on-surface">{t.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Min Bedrooms</label>
              <select value={filters.beds}
                onChange={e => setFilters(f => ({ ...f, beds: e.target.value }))}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="any">Any</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+ BHK</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Max Price</label>
              <select value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
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
        </aside>

        {/* Results */}
        <div className="flex-1">
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
                    onClick={() => navigate(`/buyer/property/${p._id}`)}
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
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs text-on-surface-variant truncate">
                          {p.propertyType?.replace(/_/g, ' ')} · {locationLine(p) || '—'}
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
                        {p.areaSqft  > 0 && <><span>·</span><span>{p.areaSqft.toLocaleString()} sqft</span></>}
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
