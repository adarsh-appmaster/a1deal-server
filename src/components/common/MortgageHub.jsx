import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import EnquiryModal from './EnquiryModal';

const ROLE_COLORS = {
  buyer:     'bg-violet-100 text-violet-700',
  broker:    'bg-rose-100 text-rose-600',
  developer: 'bg-sky-100 text-sky-700',
  investor:  'bg-emerald-100 text-emerald-700',
};

function areaKey(a) {
  return [a.city, a.area, a.pincode].filter(Boolean).join('|').toLowerCase();
}

function areaLabel(a) {
  const parts = [a.city, a.area, a.pincode].filter(Boolean);
  return parts.join(' · ') || 'Unknown area';
}

function propertyMatchesArea(prop, area) {
  const pc = (prop.pincode || '').toLowerCase();
  const pa = (prop.area   || '').toLowerCase();
  const pci = (prop.city  || '').toLowerCase();
  if (area.pincode && pc === area.pincode.toLowerCase()) return true;
  if (area.area    && pa.includes(area.area.toLowerCase())) return true;
  if (area.city    && pci.includes(area.city.toLowerCase())) return true;
  return false;
}

export default function MortgageHub({ portalColor = '#4900e5', showRoleBadges = false }) {
  const { user } = useAuth();
  const [myAreas, setMyAreas]           = useState({ homeArea: null, additionalAreas: [] });
  const [localProps, setLocalProps]     = useState([]);
  const [searchProps, setSearchProps]   = useState(null); // null = not in search mode
  const [loading, setLoading]           = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set(['__all__']));
  const [search, setSearch]             = useState('');
  const [inputVal, setInputVal]         = useState('');
  const [enquireProperty, setEnquireProperty] = useState(null);

  const properties = searchProps !== null ? searchProps : localProps;
  const isSearchMode = searchProps !== null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [areasRes, propsRes] = await Promise.all([
          api.get('/mortgage-properties/my-areas'),
          api.get('/mortgage-properties'),
        ]);
        setMyAreas(areasRes.data);
        setLocalProps(propsRes.data.properties || []);
      } catch { /* empty */ }
      setLoading(false);
    }
    load();
  }, []);

  // Debounced server-side search
  useEffect(() => {
    if (!search.trim()) {
      setSearchProps(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const r = await api.get(`/mortgage-properties?search=${encodeURIComponent(search.trim())}`);
        setSearchProps(r.data.properties || []);
      } catch { /* empty */ }
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch(inputVal);
  }

  function clearSearch() {
    setInputVal('');
    setSearch('');
    setSearchProps(null);
  }

  // Build chip list: All + home + additional
  const chips = useMemo(() => {
    const list = [{ key: '__all__', label: 'All Areas', isHome: false, isAll: true }];
    if (myAreas.homeArea) {
      list.push({
        key: areaKey(myAreas.homeArea),
        label: areaLabel(myAreas.homeArea) + ' (My Area)',
        area: myAreas.homeArea,
        isHome: true,
      });
    }
    for (const a of myAreas.additionalAreas) {
      list.push({
        key: areaKey(a),
        label: a.label ? `${a.label} (${areaLabel(a)})` : areaLabel(a),
        area: a,
        isHome: false,
      });
    }
    return list;
  }, [myAreas]);

  function toggleChip(key) {
    if (key === '__all__') {
      setSelectedKeys(new Set(['__all__']));
      return;
    }
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.delete('__all__');
      if (next.has(key)) {
        next.delete(key);
        if (next.size === 0) return new Set(['__all__']);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  // Filter by area chips (only when not in search mode)
  const filtered = useMemo(() => {
    let list = properties;
    if (!isSearchMode && !selectedKeys.has('__all__')) {
      const selectedAreas = chips.filter(c => !c.isAll && selectedKeys.has(c.key)).map(c => c.area);
      list = list.filter(p => selectedAreas.some(a => propertyMatchesArea(p, a)));
    }
    return list;
  }, [properties, selectedKeys, chips, isSearchMode]);

  // Group filtered properties by city for display
  const byCity = useMemo(() => {
    const groups = {};
    for (const p of filtered) {
      const city = p.city || 'Other';
      if (!groups[city]) groups[city] = [];
      groups[city].push(p);
    }
    return groups;
  }, [filtered]);

  const hasMultipleAreas = chips.length > 2; // All + at least 2 real areas

  if (loading || searchLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="material-icons-outlined text-3xl animate-spin" style={{ color: portalColor }}>progress_activity</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Area selector — only show if user has additional areas */}
      {hasMultipleAreas && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-outlined text-sm" style={{ color: portalColor }}>location_on</span>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Area</p>
            {!selectedKeys.has('__all__') && (
              <button onClick={() => setSelectedKeys(new Set(['__all__']))}
                className="ml-auto text-xs text-slate-400 hover:text-slate-700 underline">
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map(chip => {
              const active = selectedKeys.has(chip.key);
              return (
                <button key={chip.key} onClick={() => toggleChip(chip.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                    ${active
                      ? 'text-white border-transparent'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                  style={active ? { background: portalColor, borderColor: portalColor } : {}}>
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
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
          <input
            type="text"
            placeholder="Search by city, area, pincode, bank, title…"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white"
            style={{ '--tw-ring-color': portalColor + '40' }}
          />
        </div>
        <button type="submit"
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
          style={{ background: portalColor }}>
          Search
        </button>
        {isSearchMode && (
          <button type="button" onClick={clearSearch}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm transition">
            <span className="material-icons-outlined text-sm">close</span>
          </button>
        )}
      </form>

      {/* Search mode banner */}
      {isSearchMode && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm"
          style={{ background: portalColor + '0d', borderColor: portalColor + '33' }}>
          <span className="material-icons-outlined text-sm" style={{ color: portalColor }}>travel_explore</span>
          <span className="text-slate-700">
            Searching all cities for <span className="font-semibold" style={{ color: portalColor }}>"{search}"</span>
            {searchLoading ? ' — searching…' : ` — ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
          </span>
          <button onClick={clearSearch} className="ml-auto text-xs text-slate-400 hover:text-slate-700 underline">
            Show my area
          </button>
        </div>
      )}

      {/* Results summary (non-search mode) */}
      {!isSearchMode && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {filtered.length} {filtered.length === 1 ? 'property' : 'properties'}
            {!selectedKeys.has('__all__') ? ` in selected areas` : ` across all your areas`}
          </p>
          {myAreas.homeArea && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">home</span>
              Registered: {areaLabel(myAreas.homeArea) || '—'}
            </p>
          )}
        </div>
      )}

      {/* Properties grouped by city */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">home_work</span>
          <p className="text-slate-400 mt-3 text-sm">No mortgage properties found</p>
          {!myAreas.homeArea && (
            <p className="text-xs text-slate-400 mt-1">Update your city/area in your profile to see nearby properties.</p>
          )}
        </div>
      ) : (
        Object.entries(byCity).map(([city, props]) => (
          <div key={city}>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-outlined text-sm" style={{ color: portalColor }}>location_city</span>
              <h3 className="font-montserrat font-bold text-sm text-slate-700">{city}</h3>
              <span className="text-xs text-slate-400">· {props.length} listing{props.length > 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {props.map(p => (
                <PropertyCard key={p._id} prop={p} portalColor={portalColor} showRoleBadges={showRoleBadges}
                  canScheduleVisit={!user || user.role === 'buyer'} onEnquire={() => setEnquireProperty(p)} />
              ))}
            </div>
          </div>
        ))
      )}

      {enquireProperty && (
        <EnquiryModal
          property={{ ...enquireProperty, _model: 'MortgageProperty' }}
          onClose={() => setEnquireProperty(null)}
        />
      )}
    </div>
  );
}

function PropertyCard({ prop: p, portalColor, showRoleBadges, canScheduleVisit, onEnquire }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-40 bg-slate-100 flex items-center justify-center">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
          : <span className="material-icons-outlined text-slate-300 text-4xl">home_work</span>}
      </div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ background: `${portalColor}08` }}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
            style={{ background: `${portalColor}18`, color: portalColor }}>
            {p.type}
          </span>
          {p.auctionDate && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Auction {new Date(p.auctionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <p className="font-montserrat font-bold text-sm text-slate-800 leading-tight">{p.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{p.bankName || 'Bank Listed'}</p>
      </div>

      {/* Details */}
      <div className="px-4 pt-3 pb-4 space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="material-icons-outlined text-xs text-slate-400">location_on</span>
          {[p.area, p.city, p.pincode].filter(Boolean).join(', ')}
        </p>
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <span className="material-icons-outlined text-xs text-slate-400">currency_rupee</span>
          {Number(p.price).toLocaleString('en-IN')}
        </p>
        {p.bedrooms > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-icons-outlined text-xs text-slate-400">bed</span>
            {p.bedrooms} BHK
            {p.area_sqft ? ` · ${p.area_sqft.toLocaleString('en-IN')} sq ft` : ''}
          </p>
        )}
      </div>

      {/* Role badges — shown to admin */}
      {showRoleBadges && p.visibleTo?.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {p.visibleTo.map(role => (
            <span key={role} className={`text-xs px-1.5 py-0.5 rounded-full font-semibold capitalize ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-600'}`}>
              {role}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={onEnquire}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition hover:opacity-80"
          style={{ background: `${portalColor}18`, color: portalColor }}>
          Enquire
        </button>
        {canScheduleVisit && (
          <button
            onClick={() => navigate(`/buyer/visit/${p._id}`, {
              state: { propertyTitle: p.title, city: p.city, area: p.area, propertyModel: 'MortgageProperty' },
            })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition hover:opacity-80"
            style={{ borderColor: portalColor, color: portalColor }}>
            <span className="material-icons-outlined text-sm">event</span>
            Schedule Visit
          </button>
        )}
      </div>
    </div>
  );
}
