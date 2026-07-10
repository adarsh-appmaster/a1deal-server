import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchLocations } from '../../data/indiaLocations';

const STORAGE_KEY = 'a1deal_selected_city';
const RAJASTHAN_CITIES = ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bhilwara'];

export function getSelectedCity() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

// Persistent city picker for the buyer nav — remembers the chosen city
// across visits and jumps straight into city-scoped search results,
// the same pattern as Zomato/99acres-style city switchers.
export default function CitySwitcher({ defaultCity = '', className = '' }) {
  const navigate = useNavigate();
  const [city, setCity]   = useState(() => getSelectedCity() || defaultCity);
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function pick(label) {
    localStorage.setItem(STORAGE_KEY, label);
    setCity(label);
    setOpen(false);
    setQuery('');
    navigate(`/buyer/search?q=${encodeURIComponent(label)}`);
  }

  const suggestions = query.trim() ? searchLocations(query).slice(0, 8) : [];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
      >
        <span className="material-icons-outlined text-base">location_on</span>
        <span className="max-w-[90px] truncate">{city || 'Select City'}</span>
        <span className="material-icons-outlined text-sm">expand_more</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-outline-variant rounded-xl shadow-level-3 p-3 z-50">
          <div className="relative mb-2">
            <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
            <input
              autoFocus
              type="text"
              placeholder="Search city…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {suggestions.length > 0 ? (
            <ul className="space-y-0.5 max-h-48 overflow-y-auto">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button onClick={() => pick(s.label)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-primary/5 text-sm text-on-surface flex items-center justify-between">
                    {s.label}
                    <span className="text-xs text-on-surface-variant">{s.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide px-1 mb-1.5">Cities</p>
              <div className="flex flex-wrap gap-1.5">
                {RAJASTHAN_CITIES.map(c => (
                  <button key={c} onClick={() => pick(c)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                      c === city ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
