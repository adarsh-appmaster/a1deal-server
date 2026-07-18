import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import ImageSlider from '../../../components/common/ImageSlider';
import BackButton from '../../../components/common/BackButton';

function formatPrice(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'Flat', label: 'Flat' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Independent House', label: 'Independent House' },
  { value: 'Plot', label: 'Plot' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Penthouse', label: 'Penthouse' },
  { value: 'Shop/Office', label: 'Shop/Office' },
];

export default function DealDeskListing() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchListings = useCallback(async (search, type) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (type && type !== 'all') params.set('type', type);
      const r = await api.get(`/broker/listings/public?${params}`);
      setListings(r.data.listings || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchListings(searchQuery, typeFilter); }, [searchQuery, typeFilter, fetchListings]);

  function handleSearch(e) {
    e.preventDefault();
    setSearchQuery(inputVal.trim());
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <BackButton fallback="/buyer" label="Back" />
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-slate-800">🏬 Deal Desk</h1>
        <p className="text-slate-500 text-sm mt-1">
          Properties listed directly by brokers — contact them without any platform commission.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-0">
          <input value={inputVal} onChange={e => setInputVal(e.target.value)}
            placeholder="Search by title, city, area, pincode…"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">Search</button>
        </form>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No broker listings found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(p => (
            <div key={p._id} onClick={() => navigate(`/buyer/deal-desk/${p._id}`)}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <ImageSlider
                images={p.images || []}
                alt={p.title}
                className="h-56"
                interval={2500}
                placeholderIcon="home_work"
                overlay={
                  <span className="absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-white capitalize">
                    {p.listingType === 'lease' ? 'For Lease' : 'For Sale'}
                  </span>
                }
              />
              <div className="p-5 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {[p.propertyType, p.city, p.pincode].filter(Boolean).join(' · ')}
                </p>
                <h3 className="font-montserrat font-bold text-slate-800 text-lg">{p.title}</h3>
                <p className="text-primary font-bold text-xl">{formatPrice(p.price)}</p>
                <p className="text-xs text-slate-500">
                  {[p.beds > 0 && `${p.beds} BHK`, p.baths > 0 && `${p.baths} Bath`, p.sqft > 0 && `${Number(p.sqft).toLocaleString('en-IN')} sqft`].filter(Boolean).join(' · ')}
                </p>
                {p.broker?.name && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="material-icons-outlined text-xs text-slate-400">person</span>
                    Listed by {p.broker.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
