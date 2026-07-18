import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { searchLocations } from '../../data/indiaLocations';

const PROPERTY_TYPES = [
  { value: 'all',        label: 'All Types' },
  { value: 'tower',      label: 'Apartment' },
  { value: 'villa',      label: 'Villa' },
  { value: 'plot',       label: 'Plot' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'township',   label: 'Township' },
  { value: 'rowhouse',   label: 'Row House' },
  { value: 'duplex',     label: 'Duplex' },
  { value: 'penthouse',  label: 'Penthouse' },
  { value: 'land',       label: 'Land' },
  { value: 'warehouse',  label: 'Warehouse' },
];

const TYPE_ICON = {
  tower:      'apartment',
  building:   'business',
  villa:      'home',
  commercial: 'storefront',
  plot:       'crop_square',
  rowhouse:   'holiday_village',
  duplex:     'layers',
  penthouse:  'roofing',
  township:   'location_city',
  mixed_use:  'domain',
  land:       'grass',
  farmland:   'agriculture',
  warehouse:  'warehouse',
  other:      'real_estate_agent',
};

function fmt(n) {
  if (!n) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function PropertyCard({ property, type, onSignIn }) {
  const isMortgage = type === 'mortgage';
  const icon = isMortgage ? 'gavel' : (TYPE_ICON[property.propertyType] || 'home');
  const reraNumber = property.reraNumber || property.reraNumberNew || property.rera || '';

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden group"
      role="article"
      aria-label={`${property.title}, ${[property.area, property.city].filter(Boolean).join(', ')}`}
    >
      {/* Image / placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt={property.title} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="material-icons-outlined text-5xl text-slate-300">{icon}</span>
        )}
        {property.isFeatured && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-amber-400 text-white text-[10px] font-bold uppercase tracking-wide">
            Featured
          </span>
        )}
        {isMortgage && property.auctionDate && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
            Auction
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-on-surface text-sm leading-tight line-clamp-2 flex-1">
            {property.title}
          </h3>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary whitespace-nowrap flex-shrink-0">
            {isMortgage ? (property.type || 'Property') : (property.propertyType?.replace('_', ' ') || 'Property')}
          </span>
        </div>

        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
          <span className="material-icons-outlined text-xs">location_on</span>
          {[property.area, property.city].filter(Boolean).join(', ')}
          {property.pincode && <span className="text-slate-400">· {property.pincode}</span>}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
          {!isMortgage && property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-xs">bed</span>
              {property.bedrooms} BHK
            </span>
          )}
          {(property.areaSqft || property.area_sqft) && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-xs">straighten</span>
              {(property.areaSqft || property.area_sqft).toLocaleString()} sqft
            </span>
          )}
          {isMortgage && property.bankName && (
            <span className="flex items-center gap-1">
              <span className="material-icons-outlined text-xs">account_balance</span>
              {property.bankName}
            </span>
          )}
          {!isMortgage && property.investmentPlan?.enabled && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="material-icons-outlined text-xs">trending_up</span>
              {property.investmentPlan.returnRatePct}% p.a.
            </span>
          )}
        </div>

        {/* RERA badge */}
        {reraNumber && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="material-icons-outlined text-[10px]">verified</span>
              RERA: {reraNumber}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="font-bold text-primary text-base">{fmt(property.price)}</p>
          <button onClick={onSignIn} aria-label={`Sign in to view ${property.title}`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 min-h-[44px]">
            View Details
            <span className="material-icons-outlined text-xs">arrow_forward</span>
          </button>
        </div>

        {/* Blurred contact teaser */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="material-icons-outlined text-xs text-slate-400">person</span>
            </div>
            <div className="select-none">
              <p className="text-[10px] text-slate-400">Contact</p>
              <p className="text-xs text-slate-500 blur-[3px] font-medium">+91 ██████████</p>
            </div>
          </div>
          <button onClick={onSignIn} aria-label="Sign in to unlock contact"
            className="text-[10px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-lg transition min-h-[36px]">
            Sign in to unlock
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicPropertyExplorer() {
  const navigate  = useNavigate();
  const [tab, setTab]           = useState('unit');
  const [city, setCity]         = useState('');
  const [cityInput, setCityInput] = useState('');
  const [citySugs, setCitySugs] = useState([]);
  const [type, setType]         = useState('all');
  const [props, setProps]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(false);
  const sugRef                  = useRef(null);
  const debounceRef             = useRef(null);

  const fetchProps = useCallback(async (pg = 1, c = city, t = type, tb = tab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 8 });
      if (c) params.set('city', c);
      if (t && t !== 'all') params.set('type', t);
      const endpoint = tb === 'unit'
        ? `/unit-properties/public?${params}`
        : `/mortgage-properties/public?${params}`;
      const { data } = await api.get(endpoint);
      setProps(data.properties || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch {
      setProps([]);
    }
    setLoading(false);
  }, [city, type, tab]);

  useEffect(() => { fetchProps(1, '', 'all', tab); setCity(''); setCityInput(''); setType('all'); setPage(1); }, [tab, fetchProps]);

  function handleCityInput(e) {
    const v = e.target.value;
    setCityInput(v);
    setCitySugs(searchLocations(v).slice(0, 8));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCity(v);
      setPage(1);
      fetchProps(1, v, type, tab);
    }, 400);
  }

  function pickCity(loc) {
    setCityInput(loc.label);
    setCity(loc.label);
    setCitySugs([]);
    setPage(1);
    fetchProps(1, loc.label, type, tab);
  }

  function handleTypeChange(t) {
    setType(t);
    setPage(1);
    fetchProps(1, city, t, tab);
  }

  function goPage(pg) {
    setPage(pg);
    fetchProps(pg, city, type, tab);
    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleSignIn() {
    navigate('/login');
  }

  useEffect(() => {
    function close(e) {
      if (sugRef.current && !sugRef.current.contains(e.target)) setCitySugs([]);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <section id="explore-section" className="max-w-6xl mx-auto w-full px-4 py-16" aria-label="Explore property listings">
      {/* Header */}
      <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Explore Listings</p>
      <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-on-surface text-center mb-3">
        Find Your Perfect Property
      </h2>
      <p className="text-slate-500 text-sm text-center mb-8">
        Browse live listings — sign in to unlock contact details and book visits.
      </p>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-slate-100 rounded-xl p-1 w-fit mx-auto" role="tablist" aria-label="Property type">
        <button onClick={() => setTab('unit')} role="tab" aria-selected={tab === 'unit'}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition min-h-[44px] ${tab === 'unit' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="material-icons-outlined text-sm mr-1 align-middle">apartment</span>
          Unit Properties
        </button>
        <button onClick={() => setTab('mortgage')} role="tab" aria-selected={tab === 'mortgage'}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition min-h-[44px] ${tab === 'mortgage' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="material-icons-outlined text-sm mr-1 align-middle">gavel</span>
          Mortgage / Auction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* City search */}
        <div ref={sugRef} className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons-outlined text-slate-400 text-sm">search</span>
          <input
            value={cityInput}
            onChange={handleCityInput}
            autoComplete="off"
            placeholder="Search city, area or pincode…"
            aria-label="Search location"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
          {citySugs.length > 0 && cityInput && (
            <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden" role="listbox">
              {citySugs.map((s, i) => (
                <li key={i} role="option">
                  <button type="button" onMouseDown={() => pickCity(s)}
                    className="w-full text-left px-3 py-2 hover:bg-primary/5 text-sm flex justify-between items-center min-h-[44px]">
                    <span className="flex items-center gap-2">
                      <span className="material-icons-outlined text-xs text-slate-400">location_on</span>
                      {s.label}
                    </span>
                    <span className="text-slate-400 text-xs">{s.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Type filter — only for unit properties */}
        {tab === 'unit' && (
          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Property type filter">
            {PROPERTY_TYPES.slice(0, 6).map(t => (
              <button key={t.value} onClick={() => handleTypeChange(t.value)}
                aria-pressed={type === t.value}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition min-h-[40px] ${
                  type === t.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {total > 0 && (
        <p className="text-xs text-slate-400 mb-4" aria-live="polite">
          Showing {props.length} of {total} {tab === 'unit' ? 'properties' : 'mortgage / auction properties'}
          {city ? ` in "${city}"` : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-label="Loading properties">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-100 h-72 animate-pulse" aria-hidden="true" />
          ))}
        </div>
      ) : props.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {props.map(p => (
            <PropertyCard key={p._id} property={p} type={tab} onSignIn={handleSignIn} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="material-icons-outlined text-5xl text-slate-200 block mb-3">search_off</span>
          <p className="text-slate-400 text-sm">
            {city ? `No properties found in "${city}".` : 'No properties available right now.'}
          </p>
          {city && (
            <button onClick={() => { setCityInput(''); setCity(''); setPage(1); fetchProps(1, '', type, tab); }}
              className="mt-3 text-xs text-primary hover:underline min-h-[44px] px-4">
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
          <button onClick={() => goPage(page - 1)} disabled={page <= 1} aria-label="Previous page"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition min-h-[44px] min-w-[44px]">
            <span className="material-icons-outlined text-sm">chevron_left</span>
          </button>
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const pg = pages <= 7 ? i + 1 : (page <= 4 ? i + 1 : page - 3 + i);
            if (pg < 1 || pg > pages) return null;
            return (
              <button key={pg} onClick={() => goPage(pg)} aria-label={`Page ${pg}`} aria-current={pg === page ? 'page' : undefined}
                className={`w-9 h-9 rounded-xl text-sm font-semibold border transition min-h-[44px] min-w-[44px] ${
                  pg === page
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                {pg}
              </button>
            );
          })}
          <button onClick={() => goPage(page + 1)} disabled={page >= pages} aria-label="Next page"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition min-h-[44px] min-w-[44px]">
            <span className="material-icons-outlined text-sm">chevron_right</span>
          </button>
        </nav>
      )}

      {/* Sign-in CTA */}
      <div className="mt-10 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-on-surface text-sm mb-1">Want to see contact details, book visits, & more?</p>
          <p className="text-slate-500 text-xs">Create a free account to unlock full property info, connect with sellers, and track your shortlist.</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition min-h-[44px]">
            Sign In
          </button>
          <button onClick={() => navigate('/signup')}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition min-h-[44px]">
            Join Free
          </button>
        </div>
      </div>
    </section>
  );
}
