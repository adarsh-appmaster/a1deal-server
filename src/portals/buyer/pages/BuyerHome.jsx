import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EnquiryModal from '../../../components/common/EnquiryModal';
import AutoScrollRow from '../../../components/common/AutoScrollRow';
import ImageSlider from '../../../components/common/ImageSlider';
import ShareWhatsappButton from '../../../components/common/ShareWhatsappButton';
import { getStartingPrice } from '../../../utils/pricing';
import { searchLocations } from '../../../data/indiaLocations';
import api from '../../../api/axios';

export default function BuyerHome() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquireProperty, setEnquireProperty] = useState(null);

  const [mortgageProps, setMortgageProps] = useState([]);
  const [unitProps, setUnitProps] = useState([]);
  const [featuredProps, setFeaturedProps] = useState([]);

  useEffect(() => {
    api.get('/mortgage-properties/public?limit=3').then(r => setMortgageProps(r.data.properties || [])).catch(() => {});
    api.get('/unit-properties/public?limit=3').then(r => setUnitProps(r.data.properties || [])).catch(() => {});
    api.get('/unit-properties/public?featured=true&limit=6').then(r => setFeaturedProps(r.data.properties || [])).catch(() => {});
  }, []);

  // Autosuggest: fires once 3+ characters are typed, matching city/pincode/project name
  useEffect(() => {
    if (query.trim().length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      const cityMatches = searchLocations(query).slice(0, 4).map(s => ({
        type: 'city', label: s.label, sub: s.state,
      }));
      let projectMatches = [];
      try {
        const [unitsRes, mortgageRes] = await Promise.all([
          api.get(`/unit-properties/public?search=${encodeURIComponent(query.trim())}&limit=4`),
          api.get(`/mortgage-properties/public?search=${encodeURIComponent(query.trim())}&limit=4`),
        ]);
        projectMatches = [
          ...(unitsRes.data.properties || []).map(p => ({
            type: 'project', label: p.title, sub: [p.city, p.area].filter(Boolean).join(', '),
            path: `/buyer/property/${p._id}`,
          })),
          ...(mortgageRes.data.properties || []).map(p => ({
            type: 'project', label: p.title, sub: [p.city, p.area].filter(Boolean).join(', '),
            path: `/buyer/mortgage/${p._id}`,
          })),
        ];
      } catch { /* empty */ }
      setSuggestions([...cityMatches, ...projectMatches]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function close(e) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setShowSuggestions(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    navigate(`/buyer/search?q=${encodeURIComponent(query)}&type=buy`);
  };

  function pickSuggestion(s) {
    setShowSuggestions(false);
    if (s.type === 'project') { navigate(s.path); return; }
    setQuery(s.label);
    navigate(`/buyer/search?q=${encodeURIComponent(s.label)}&type=buy`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1a1d2b] via-[#2d1b69] to-[#4900e5] py-12 md:py-20 px-4 md:px-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block portal-badge bg-white/10 text-white mb-4 text-xs">India's Premier Real Estate Marketplace</span>
          <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-white mb-4 leading-tight">
            Find Your Perfect<br />
            <span className="text-[#ff5a5f]">Property</span>
          </h1>
          <p className="text-white/70 text-lg mb-8">Discover 12,000+ verified properties across 42 cities</p>

          {/* Search Box */}
          <div ref={searchWrapRef} className="glass-card rounded-2xl p-2 max-w-2xl mx-auto relative">
            <form onSubmit={handleSearch} className="flex gap-2 p-1">
              <div className="flex-1 relative">
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
                <input
                  type="text"
                  placeholder="Search by city, pincode, or project..."
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => query.trim().length >= 3 && setShowSuggestions(true)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button type="submit" className="btn-primary rounded-xl px-6">Search</button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 top-full mt-1 left-1 right-1 bg-white border border-outline-variant rounded-xl shadow-xl overflow-hidden text-left">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button type="button" onMouseDown={() => pickSuggestion(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary/5 flex items-center gap-3 text-sm">
                      <span className="material-icons-outlined text-sm text-on-surface-variant flex-shrink-0">
                        {s.type === 'project' ? 'home_work' : 'location_on'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-on-surface font-medium block truncate">{s.label}</span>
                        {s.sub && <span className="text-on-surface-variant text-xs block truncate">{s.sub}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProps.length > 0 && (
        <section className="max-w-container mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-montserrat font-bold text-2xl text-on-surface">Featured Properties</h2>
              <p className="text-on-surface-variant text-sm mt-1">Handpicked premium listings</p>
            </div>
            <button onClick={() => navigate('/buyer/search')} className="btn-ghost text-sm py-2 px-4">
              View All
            </button>
          </div>
          <AutoScrollRow
            items={featuredProps}
            cardWidth="w-80"
            renderItem={p => (
              <div
                onClick={() => navigate(`/buyer/property/${p._id}`)}
                className="card overflow-hidden cursor-pointer hover:shadow-level-3 hover:-translate-y-1 transition-all duration-200"
              >
                <ImageSlider
                  images={p.images || []}
                  alt={p.title}
                  className="h-52"
                  interval={2500}
                  placeholderIcon="apartment"
                  overlay={<ShareWhatsappButton property={p} path={`/buyer/property/${p._id}`} iconOnly className="absolute bottom-3 right-3" />}
                />
                <div className="p-4">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">{p.propertyType} · {[p.city, p.area].filter(Boolean).join(', ')}</p>
                  <h3 className="font-montserrat font-bold text-on-surface mb-2">{p.title}</h3>
                  <p className="text-primary-container font-bold text-lg mb-3">Units starting ₹{Number(getStartingPrice(p)).toLocaleString('en-IN')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setEnquireProperty({ ...p, _model: 'UnitProperty' }); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      Enquire
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/buyer/visit/${p._id}`, {
                          state: { propertyTitle: p.title, city: p.city, area: p.area, propertyModel: 'UnitProperty' },
                        });
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-primary text-primary text-xs font-semibold hover:bg-primary/5 transition"
                    >
                      <span className="material-icons-outlined text-sm">event</span>
                      Schedule Visit
                    </button>
                    <ShareWhatsappButton property={p} path={`/buyer/property/${p._id}`} iconOnly className="flex-shrink-0" />
                  </div>
                </div>
              </div>
            )}
          />
        </section>
      )}

      {/* Unit Properties */}
      {unitProps.length > 0 && (
        <section className="max-w-container mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-montserrat font-bold text-2xl text-on-surface">Property Partners</h2>
              <p className="animate-blink font-semibold text-secondary text-sm mt-1 flex items-center gap-1">
                <span className="material-icons-outlined animate-sparkle inline-block text-amber-400 text-base" style={{ animationDelay: '0ms' }}>auto_awesome</span>
                Be a Partner in Premium Properties
                <span className="material-icons-outlined animate-sparkle inline-block text-amber-400 text-base" style={{ animationDelay: '400ms' }}>auto_awesome</span>
              </p>
            </div>
            <button onClick={() => navigate('/buyer/unit-properties')} className="btn-ghost text-sm py-2 px-4">View All</button>
          </div>
          <AutoScrollRow
            items={unitProps}
            cardWidth="w-80"
            renderItem={p => (
              <div
                onClick={() => navigate(`/buyer/property/${p._id}`)}
                className="card overflow-hidden relative cursor-pointer hover:shadow-level-3 hover:-translate-y-1 transition-all duration-200"
              >
                {p.investmentPlan?.enabled && (
                  <span className="absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white z-10">
                    Investment Plan
                  </span>
                )}
                <ImageSlider
                  images={p.images || []}
                  alt={p.title}
                  className="h-52"
                  interval={2500}
                  placeholderIcon="apartment"
                />
                <div className="p-4">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">{p.propertyType} · {[p.city, p.area].filter(Boolean).join(', ')}</p>
                  <h3 className="font-montserrat font-bold text-on-surface mb-2">{p.title}</h3>
                  <p className="text-primary-container font-bold text-lg mb-1">Units starting ₹{Number(getStartingPrice(p)).toLocaleString('en-IN')}</p>
                  {p.investmentPlan?.enabled && (
                    <p className="text-xs text-emerald-700">{p.investmentPlan.returnRatePct}% p.a. · {p.investmentPlan.durationYears} yr</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={e => { e.stopPropagation(); setEnquireProperty({ ...p, _model: 'UnitProperty' }); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      Enquire
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/buyer/visit/${p._id}`, {
                          state: { propertyTitle: p.title, city: p.city, area: p.area, propertyModel: 'UnitProperty' },
                        });
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-primary text-primary text-xs font-semibold hover:bg-primary/5 transition"
                    >
                      <span className="material-icons-outlined text-sm">event</span>
                      Schedule Visit
                    </button>
                    <ShareWhatsappButton property={p} path={`/buyer/property/${p._id}`} iconOnly className="flex-shrink-0" />
                  </div>
                </div>
              </div>
            )}
          />
        </section>
      )}

      {/* Mortgage Properties */}
      {mortgageProps.length > 0 && (
        <section className="max-w-container mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-montserrat font-bold text-2xl text-on-surface">Property Deals</h2>
              <p className="animate-blink font-semibold text-secondary text-sm mt-1 flex items-center gap-1">
                <span className="material-icons-outlined animate-sparkle inline-block text-amber-400 text-base" style={{ animationDelay: '0ms' }}>auto_awesome</span>
                Save 30–40% Compared to Market Prices
                <span className="material-icons-outlined animate-sparkle inline-block text-amber-400 text-base" style={{ animationDelay: '400ms' }}>auto_awesome</span>
              </p>
            </div>
            <button onClick={() => navigate('/buyer/mortgage')} className="btn-ghost text-sm py-2 px-4">View All</button>
          </div>
          <AutoScrollRow
            items={mortgageProps}
            cardWidth="w-80"
            renderItem={p => (
              <div
                onClick={() => navigate(`/buyer/mortgage/${p._id}`)}
                className="card overflow-hidden cursor-pointer hover:shadow-level-3 hover:-translate-y-1 transition-all duration-200"
              >
                <ImageSlider
                  images={p.images || []}
                  alt={p.title}
                  className="h-52"
                  interval={2500}
                  placeholderIcon="account_balance"
                />
                <div className="p-4">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">{p.type} · {[p.city, p.area].filter(Boolean).join(', ')}</p>
                  <h3 className="font-montserrat font-bold text-on-surface mb-2">{p.title}</h3>
                  <p className="text-primary-container font-bold text-lg mb-1">₹{Number(p.price).toLocaleString('en-IN')}</p>
                  {p.bankName && <p className="text-xs text-on-surface-variant">{p.bankName}</p>}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={e => { e.stopPropagation(); setEnquireProperty({ ...p, _model: 'MortgageProperty' }); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      Enquire
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/buyer/visit/${p._id}`, {
                          state: { propertyTitle: p.title, city: p.city, area: p.area, propertyModel: 'MortgageProperty' },
                        });
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-primary text-primary text-xs font-semibold hover:bg-primary/5 transition"
                    >
                      <span className="material-icons-outlined text-sm">event</span>
                      Schedule Visit
                    </button>
                    <ShareWhatsappButton property={p} path={`/buyer/mortgage/${p._id}`} iconOnly className="flex-shrink-0" />
                  </div>
                </div>
              </div>
            )}
          />
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-primary-container text-white py-14 px-6 text-center">
        <h2 className="font-montserrat font-bold text-3xl mb-3">Ready to Find Your Dream Home?</h2>
        <p className="text-white/80 mb-6">Join 50,000+ buyers who found their perfect property on A1 Deal</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => navigate('/buyer/search')} className="bg-white text-primary font-semibold px-6 py-3 rounded-lg hover:bg-surface-container transition-colors">
            Explore Properties
          </button>
          <button onClick={() => navigate('/buyer/mortgage')} className="bg-white/10 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-colors">
            Get Pre-Approved
          </button>
          <button onClick={() => setShowEnquiry(true)} className="bg-white/10 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-colors">
            Submit Enquiry
          </button>
        </div>
      </section>

      {showEnquiry && <EnquiryModal onClose={() => setShowEnquiry(false)} />}
      {enquireProperty && <EnquiryModal property={enquireProperty} onClose={() => setEnquireProperty(null)} />}
    </div>
  );
}
