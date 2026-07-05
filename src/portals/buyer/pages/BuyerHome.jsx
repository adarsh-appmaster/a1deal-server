import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EnquiryModal from '../../../components/common/EnquiryModal';
import AutoScrollRow from '../../../components/common/AutoScrollRow';
import ImageSlider from '../../../components/common/ImageSlider';
import { getStartingPrice } from '../../../utils/pricing';
import api from '../../../api/axios';

const FEATURED = [
  { id: 1, name: 'Skyline Residences', location: 'Bandra West, Mumbai', price: '₹2.4 Cr', beds: 3, baths: 2, sqft: '1,450', type: 'Apartment', status: 'Ready to Move', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8iJsDAKW6bT3a3lPuS3HhJlk_5v3oXs_lGkfZsZipz3e5g7S9ZW_5KfNm9gR6Z3Mc-csFjy6oKFP2AMvxqCqKyKMlF4fvz7JZ2g=w400' },
  { id: 2, name: 'Green Valley Villas', location: 'Whitefield, Bangalore', price: '₹3.8 Cr', beds: 4, baths: 3, sqft: '2,200', type: 'Villa', status: 'Under Construction', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBNIRHKpJNzv3dJgT_6dYyV3KxRN3ZiQX5b8EhBDTLH9Vd3y5JnRH8jSp6LjXb-jMaKjMKLjSnHq45_hC_lBv7V_M_rMl5kN3lQ=w400' },
  { id: 3, name: 'Horizon Towers', location: 'Powai, Mumbai', price: '₹1.8 Cr', beds: 2, baths: 2, sqft: '1,100', type: 'Apartment', status: 'Ready to Move', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnKXjGJj0GIlbqI4aHY2v_YVzPjdg_VY5n_5V6mfh5_7k_V9kFn5ZhkHTGqAT14kF6fVD_9hhGJBWEtEuqsK7RKYKFe3CYp0t9xA=w400' },
  { id: 4, name: 'Prestige Grand', location: 'Jubilee Hills, Hyderabad', price: '₹5.2 Cr', beds: 5, baths: 4, sqft: '3,500', type: 'Penthouse', status: 'Ready to Move', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf5iCTdqH09Cn_s3B8GYLQM-1pMWkIBJb_M5_j7mFjvhj7d7fvU6yL-p6yLfaA_GQzwNqClv_pPBrDvL_0GfpNZA3yElxJExkpw=w400' },
  { id: 5, name: 'The Palms', location: 'Koregaon Park, Pune', price: '₹1.2 Cr', beds: 2, baths: 1, sqft: '850', type: 'Studio', status: 'New Launch', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKE-9G6h7Vf4dR3kSLzY3L5JfqBiJ0cTVuJbFqMv9qDlBgCJzGbJzSbCuJHHkKKnJcr_5bxHu_h5rrBBpHJLSKnGkTm6WlF-kQ=w400' },
  { id: 6, name: 'Marina Bay Heights', location: 'OMR, Chennai', price: '₹95 L', beds: 2, baths: 2, sqft: '1,050', type: 'Apartment', status: 'Under Construction', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR4Mm9HyXk3d7Tl4LcKuCZi3Yiml2nHSU1TcMdqt7k7TK7WMhZf6BmX_OWKl7jA_OJjqiQBEiW8Z3Wt_3tSy_k3Jl7vHLIVvUA=w400' },
];

const STATS = [
  { label: 'Active Listings', value: '12,400+', icon: 'apartment' },
  { label: 'Cities Covered', value: '42', icon: 'location_city' },
  { label: 'Deals Closed', value: '8,700+', icon: 'handshake' },
  { label: 'Verified Developers', value: '320+', icon: 'verified' },
];

export default function BuyerHome() {
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState('buy');
  const [query, setQuery] = useState('');
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquireProperty, setEnquireProperty] = useState(null);

  const [mortgageProps, setMortgageProps] = useState([]);
  const [unitProps, setUnitProps] = useState([]);

  useEffect(() => {
    api.get('/mortgage-properties/public?limit=3').then(r => setMortgageProps(r.data.properties || [])).catch(() => {});
    api.get('/unit-properties/public?limit=3').then(r => setUnitProps(r.data.properties || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/buyer/search?q=${encodeURIComponent(query)}&type=${searchTab}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1a1d2b] via-[#2d1b69] to-[#4900e5] py-12 md:py-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-block portal-badge bg-white/10 text-white mb-4 text-xs">India's Premier Real Estate Marketplace</span>
          <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-white mb-4 leading-tight">
            Find Your Perfect<br />
            <span className="text-[#ff5a5f]">Property</span>
          </h1>
          <p className="text-white/70 text-lg mb-8">Discover 12,000+ verified properties across 42 cities</p>

          {/* Search Box */}
          <div className="glass-card rounded-2xl p-2 max-w-2xl mx-auto">
            <div className="flex flex-wrap gap-1 mb-3 px-2 pt-2">
              {['Buy','Mortgage'].map(t => (
                <button
                  key={t}
                  onClick={() => setSearchTab(t.toLowerCase())}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${searchTab === t.toLowerCase() ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 p-1">
              <div className="flex-1 relative">
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
                <input
                  type="text"
                  placeholder="Search by city, locality, or project..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button type="submit" className="btn-primary rounded-xl px-6">Search</button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-surface-container-lowest border-b border-outline-variant">
        <div className="max-w-container mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-outlined text-primary text-xl">{s.icon}</span>
              </div>
              <div>
                <p className="font-montserrat font-bold text-xl text-on-surface">{s.value}</p>
                <p className="text-xs text-on-surface-variant">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
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
          items={FEATURED}
          renderItem={p => (
            <div
              onClick={() => navigate(`/buyer/property/${p.id}`)}
              className="card overflow-hidden cursor-pointer hover:shadow-level-3 hover:-translate-y-1 transition-all duration-200"
            >
              <div className="relative h-48 overflow-hidden bg-surface-container">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                <span className={`absolute top-3 right-3 portal-badge text-xs ${p.status === 'Ready to Move' ? 'bg-emerald-100 text-emerald-800' : p.status === 'New Launch' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                  {p.status}
                </span>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">{p.type} · {p.location}</p>
                <h3 className="font-montserrat font-bold text-on-surface mb-2">{p.name}</h3>
                <p className="text-primary-container font-bold text-lg mb-3">{p.price}</p>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">bed</span>{p.beds} Beds</span>
                  <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">bathroom</span>{p.baths} Baths</span>
                  <span className="flex items-center gap-1"><span className="material-icons-outlined text-sm">square_foot</span>{p.sqft} sq.ft</span>
                </div>
              </div>
            </div>
          )}
        />
      </section>

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
                  className="h-40"
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
            renderItem={p => (
              <div
                onClick={() => navigate(`/buyer/mortgage/${p._id}`)}
                className="card overflow-hidden cursor-pointer hover:shadow-level-3 hover:-translate-y-1 transition-all duration-200"
              >
                <ImageSlider
                  images={p.images || []}
                  alt={p.title}
                  className="h-40"
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
