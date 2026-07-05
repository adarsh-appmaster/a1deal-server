import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import EnquiryModal from '../../../components/common/EnquiryModal';
import ImageSlider from '../../../components/common/ImageSlider';

const STATUS_COLORS = {
  available:          'bg-emerald-100 text-emerald-700',
  under_negotiation:  'bg-amber-100 text-amber-700',
  sold:               'bg-slate-100 text-slate-500',
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

export default function UnitPropertyListing() {
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
      const r = await api.get(`/unit-properties/public?${params}`);
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-slate-800">🤝 Property Partners</h1>
        <p className="text-slate-500 text-sm mt-1">
          Be a Partner in Premium Properties.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[220px] flex gap-2">
          <input value={inputVal} onChange={e => setInputVal(e.target.value)}
            placeholder="Search by title, city, area, pincode…"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30" />
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition">Search</button>
        </form>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No unit properties found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map(p => (
            <div key={p._id} onClick={() => navigate(`/buyer/property/${p._id}`)}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <ImageSlider
                images={p.images || []}
                alt={p.title}
                className="h-40"
                interval={2500}
                placeholderIcon="apartment"
                overlay={
                  <>
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-500'}`}>
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
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{p.propertyType} · {[p.city, p.area].filter(Boolean).join(', ')}</p>
                <h3 className="font-montserrat font-bold text-slate-800">{p.title}</h3>
                <p className="text-[#4900e5] font-bold text-lg">₹{Number(p.price).toLocaleString('en-IN')}</p>
                {p.investmentPlan?.enabled && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1 inline-block">
                    Est. {p.investmentPlan.returnRatePct}% p.a. return over {p.investmentPlan.durationYears} yr
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={e => { e.stopPropagation(); setEnquireProperty(p); }}
                    className="flex-1 py-2 rounded-xl bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold hover:bg-[#4900e5]/20 transition">
                    Enquire
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/buyer/visit/${p._id}`, {
                        state: { propertyTitle: p.title, city: p.city, area: p.area, propertyModel: 'UnitProperty' },
                      });
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-[#4900e5] text-[#4900e5] text-xs font-semibold hover:bg-[#4900e5]/5 transition">
                    <span className="material-icons-outlined text-sm">event</span>
                    Schedule Visit
                  </button>
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
