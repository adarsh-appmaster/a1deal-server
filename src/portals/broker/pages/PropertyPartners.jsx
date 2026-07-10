import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import EnquiryModal from '../../../components/common/EnquiryModal';
import ImageSlider from '../../../components/common/ImageSlider';
import ShareWhatsappButton from '../../../components/common/ShareWhatsappButton';
import { getStartingPrice } from '../../../utils/pricing';

function formatPrice(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const STATUS_COLORS = {
  available:          'bg-emerald-100 text-emerald-700',
  under_negotiation:  'bg-amber-100 text-amber-700',
  sold:               'bg-slate-100 text-slate-600',
};

const TYPES = [
  { value: 'all',       label: 'All Types' },
  { value: 'tower',     label: 'Tower' },
  { value: 'villa',     label: 'Villa' },
  { value: 'commercial',label: 'Commercial' },
  { value: 'plot',      label: 'Plot' },
  { value: 'rowhouse',  label: 'Row House' },
  { value: 'penthouse', label: 'Penthouse' },
];

export default function PropertyPartners() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputVal, setInputVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [enquireProperty, setEnquireProperty] = useState(null);

  const fetchProperties = useCallback(async (search, type) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (type && type !== 'all') params.set('type', type);
      const r = await api.get(`/unit-properties?${params}`);
      setProperties(r.data.properties || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProperties(searchQuery, typeFilter); }, [searchQuery, typeFilter, fetchProperties]);

  function handleSearch(e) {
    e.preventDefault();
    setSearchQuery(inputVal.trim());
  }

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="material-icons-outlined text-3xl text-primary">apartment</span>
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Property Partners</h1>
          <p className="text-on-surface-variant text-sm">Browse developer unit listings to pitch to your clients</p>
        </div>
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
        <div className="flex items-center justify-center py-16">
          <span className="material-icons-outlined text-3xl animate-spin text-primary">progress_activity</span>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-5xl text-slate-200">apartment</span>
          <p className="text-slate-400 mt-3 text-sm">No unit properties found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <div key={p._id} onClick={() => navigate(`/buyer/property/${p._id}`)}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <ImageSlider
                images={p.images || []}
                alt={p.title}
                className="h-56"
                interval={2500}
                placeholderIcon="apartment"
                overlay={
                  <>
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>
                      {(p.status || '').replace('_', ' ')}
                    </span>
                    {p.investmentPlan?.enabled && (
                      <span className="absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                        <span className="material-icons-outlined text-xs">trending_up</span> Investment Plan
                      </span>
                    )}
                  </>
                }
              />
              <div className="p-5 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{p.propertyType} · {[p.city, p.area].filter(Boolean).join(', ')}</p>
                <h3 className="font-montserrat font-bold text-slate-800 text-lg">{p.title}</h3>
                <p className="text-primary font-bold text-xl">Units starting {formatPrice(getStartingPrice(p))}</p>
                {p.investmentPlan?.enabled && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1 inline-block">
                    Est. {p.investmentPlan.returnRatePct}% p.a. return over {p.investmentPlan.durationYears} yr
                  </p>
                )}
                {(p.sellerName || p.sellerPhone) && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="material-icons-outlined text-xs text-slate-400">badge</span>
                    {[p.sellerName, p.sellerPhone].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={e => { e.stopPropagation(); setEnquireProperty(p); }}
                    className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition">
                    Enquire
                  </button>
                  <ShareWhatsappButton property={p} path={`/buyer/property/${p._id}`} iconOnly className="flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {enquireProperty && (
        <EnquiryModal
          property={{ ...enquireProperty, _model: 'UnitProperty' }}
          onClose={() => setEnquireProperty(null)}
        />
      )}
    </div>
  );
}
