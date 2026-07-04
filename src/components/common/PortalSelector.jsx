import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { searchLocations } from '../../data/indiaLocations';
import api from '../../api/axios';

const ROLES = [
  {
    id: 'buyer',
    label: 'Buyer',
    icon: 'home',
    color: 'bg-[#4900e5]/10 text-[#4900e5]',
    description: 'Browse properties, apply for mortgages, attend auctions.',
  },
  {
    id: 'broker',
    label: 'Broker',
    icon: 'handshake',
    color: 'bg-rose-100 text-rose-600',
    description: 'Access exclusive listings and manage high-value leads.',
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: 'apartment',
    color: 'bg-sky-100 text-sky-700',
    description: 'List projects, manage inventory, and track partnerships.',
    badge: 'Admin Approval',
  },
  {
    id: 'investor',
    label: 'Investor',
    icon: 'trending_up',
    color: 'bg-emerald-100 text-emerald-700',
    description: 'Track portfolio ROI and discover high-yield opportunities.',
    badge: 'Admin Approval',
  },
];

const STATS = [
  { value: '12,400+', label: 'Active Listings' },
  { value: '42',      label: 'Cities Covered' },
  { value: '320+',    label: 'Verified Developers' },
  { value: '₹2,000 Cr+', label: 'Transactions Closed' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: 'person_add', title: 'Create Your Account', desc: 'Sign up as a buyer, broker, developer, or investor in under 2 minutes.' },
  { step: '02', icon: 'search',     title: 'Discover Opportunities', desc: 'Browse verified listings, mortgage properties, and investment projects near you.' },
  { step: '03', icon: 'handshake',  title: 'Close the Deal', desc: 'Connect directly with sellers, brokers, and developers — all on one platform.' },
];

const FEATURES = [
  { icon: 'verified',        title: 'RERA Verified Listings',    desc: 'Every project is RERA-verified before going live on the platform.' },
  { icon: 'home_work',       title: 'Mortgage & Auction Hub',    desc: 'Access bank repo properties and live auctions in your city.' },
  { icon: 'groups',          title: 'Master Broker Network',     desc: 'Structured broker hierarchy with dedicated area master brokers.' },
  { icon: 'savings',         title: 'Investor Returns',          desc: 'Invest by city/project and track per annum returns transparently.' },
  { icon: 'speed',           title: 'Instant OTP Onboarding',   desc: 'Register and verify your email in 60 seconds — no paperwork.' },
  { icon: 'support_agent',   title: '360° Admin Support',        desc: 'Dedicated visit team reviews and admin oversight on every deal.' },
];

const INTERNAL = [
  { label: 'Admin', path: '/admin/login', icon: 'admin_panel_settings' },
  { label: 'Team / Sales CRM', path: '/team/login', icon: 'groups' },
  { label: 'Bank', path: '/bank/login', icon: 'account_balance' },
];

// ── Public property fetching ──────────────────────────────────────────────────
function usePublicProperties() {
  const [units,     setUnits]     = useState([]);
  const [mortgages, setMortgages] = useState([]);
  const [loans,     setLoans]     = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/unit-properties/public?limit=6'),
      api.get('/mortgage-properties/public?limit=6'),
      api.get('/loan-transfer/public?limit=6'),
    ]).then(([u, m, l]) => {
      setUnits(u.data.properties     || []);
      setMortgages(m.data.properties || []);
      setLoans(l.data.properties     || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { units, mortgages, loans, loading };
}

function formatPrice(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function PropCard({ title, city, price, type, beds, image, tag, tagColor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
    >
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {image
          ? <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center">
              <span className="material-icons-outlined text-5xl text-slate-300">home</span>
            </div>
        }
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
      </div>
      <div className="p-4">
        <p className="font-semibold text-[#0F172A] text-sm leading-snug line-clamp-1">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <span className="material-icons-outlined text-xs">location_on</span>{city || '—'}
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="font-montserrat font-bold text-[#4900e5] text-sm">{formatPrice(price)}</p>
          {beds != null && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">bed</span>{beds} BHK
            </span>
          )}
          {type && !beds && (
            <span className="text-xs text-slate-400 capitalize">{type}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function PropertySection({ title, icon, items, loading, navigate, baseRoute }) {
  if (!loading && items.length === 0) return null;
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="material-icons-outlined text-xl text-[#4900e5]">{icon}</span>
          <h3 className="font-montserrat font-bold text-lg text-[#0F172A]">{title}</h3>
        </div>
        <button
          onClick={() => navigate('/signup')}
          className="text-xs font-semibold text-[#4900e5] hover:underline flex items-center gap-1"
        >
          View all <span className="material-icons-outlined text-xs">arrow_forward</span>
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-100 h-60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.slice(0, 6).map(p => (
            <PropCard key={p._id} {...p} onClick={() => navigate(p.path || '/signup')} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── City search with autocomplete ─────────────────────────────────────────────
function CitySearchBar({ onSearch }) {
  const [query, setQuery]      = useState('');
  const [suggestions, setSugs] = useState([]);
  const [open, setOpen]        = useState(false);
  const wrapRef                = useRef(null);

  function handleChange(e) {
    const v = e.target.value;
    setQuery(v);
    setSugs(searchLocations(v));
    setOpen(true);
  }

  function pick(loc) {
    setQuery(loc.label);
    setOpen(false);
    onSearch(loc.label);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setOpen(false);
    onSearch(query);
  }

  useEffect(() => {
    function close(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={wrapRef} className="relative max-w-xl mx-auto mb-8">
      <form onSubmit={handleSubmit}
        className="flex items-center bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
        <span className="material-icons-outlined text-slate-400 pl-4">location_on</span>
        <input
          type="text"
          placeholder="Search by city, area or pincode…"
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          autoComplete="off"
          className="flex-1 px-4 py-4 text-sm text-slate-700 focus:outline-none placeholder-slate-400"
        />
        <button type="submit"
          className="m-1.5 px-5 py-2.5 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition">
          Search
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button type="button" onMouseDown={() => pick(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-[#4900e5]/5 flex items-center gap-3 text-sm">
                <span className="material-icons-outlined text-sm text-slate-400">location_on</span>
                <span className="text-slate-800 font-medium">{s.label}</span>
                <span className="text-slate-400 text-xs ml-auto">{s.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PortalSelector() {
  const navigate = useNavigate();
  const { units, mortgages, loans, loading } = usePublicProperties();

  const unitItems = units.map(p => ({
    _id: p._id, title: p.title, city: p.city,
    price: p.price, beds: p.bedrooms ?? null,
    image: p.images?.[0] || null,
    tag: p.propertyType || 'Property', tagColor: 'bg-[#4900e5]/10 text-[#4900e5]',
    path: `/buyer/property/${p._id}`,
  }));

  const mortgageItems = mortgages.map(p => ({
    _id: p._id, title: p.title, city: p.city,
    price: p.price, beds: p.bedrooms ?? null,
    image: p.images?.[0] || null,
    tag: p.type || 'Mortgage', tagColor: 'bg-amber-100 text-amber-700',
    type: p.bankName || null,
    path: `/buyer/mortgage/${p._id}`,
  }));

  const loanItems = loans.map(p => ({
    _id: p._id, title: p.title, city: p.city,
    price: p.askingPrice, beds: p.bedrooms ?? null,
    image: p.images?.[0] || null,
    tag: p.propertyType || 'Loan Transfer', tagColor: 'bg-emerald-100 text-emerald-700',
    path: `/buyer/loan-transfer/${p._id}`,
  }));

  function handleSearch(city) {
    navigate(`/buyer/search?q=${encodeURIComponent(city)}`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-white/90 backdrop-blur border-b border-slate-100">
        <Logo variant="full" size="md" />
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-full border border-[#4900e5] text-[#4900e5] font-semibold text-sm hover:bg-[#4900e5]/5 transition">
            Sign In
          </button>
          <button onClick={() => navigate('/signup')}
            className="px-5 py-2 rounded-full bg-[#4900e5] text-white font-semibold text-sm hover:bg-[#6236ff] transition shadow-md shadow-[#4900e5]/20">
            Sign Up Free
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] py-16 md:py-24 px-4 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold tracking-widest uppercase mb-5">
          India's Premier Real Estate Ecosystem
        </span>
        <h1 className="font-montserrat font-bold text-4xl md:text-6xl text-[#0F172A] mb-5 leading-tight">
          One Platform.<br />
          <span className="text-[#4900e5]">Every Deal.</span>
        </h1>
        <p className="text-slate-500 text-base md:text-xl max-w-xl mx-auto mb-10">
          Buy, sell, invest, or broker — A1 Deal connects every player in India's real estate market.
        </p>

        <CitySearchBar onSearch={handleSearch} />

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={() => navigate('/signup')}
            className="px-8 py-3 rounded-full bg-[#4900e5] text-white font-bold text-sm md:text-base hover:bg-[#6236ff] transition shadow-lg shadow-[#4900e5]/30">
            Get Started Free
          </button>
          <button onClick={() => navigate('/login')}
            className="px-8 py-3 rounded-full border-2 border-slate-200 text-slate-700 font-bold text-sm md:text-base hover:border-[#4900e5] hover:text-[#4900e5] transition">
            Sign In
          </button>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-[#4900e5] py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="font-montserrat font-bold text-2xl md:text-3xl">{s.value}</p>
              <p className="text-white/70 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Property Listings ── */}
      {(loading || unitItems.length > 0 || mortgageItems.length > 0 || loanItems.length > 0) && (
        <section className="max-w-6xl mx-auto w-full px-4 py-16">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Live on the Platform</p>
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#0F172A] text-center mb-12">
            Featured Properties
          </h2>
          <PropertySection
            title="Unit Properties"
            icon="apartment"
            items={unitItems}
            loading={loading}
            navigate={navigate}
          />
          <PropertySection
            title="Mortgage / Bank Repo"
            icon="account_balance"
            items={mortgageItems}
            loading={loading}
            navigate={navigate}
          />
          <PropertySection
            title="Loan Transfer Properties"
            icon="swap_horiz"
            items={loanItems}
            loading={loading}
            navigate={navigate}
          />
        </section>
      )}

      {/* ── Who are you? ── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-16">
        <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Join as</p>
        <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#0F172A] text-center mb-10">
          What best describes you?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => navigate(`/signup?role=${r.id}`)}
              className="group text-left bg-white rounded-2xl p-5 border border-slate-100 hover:border-[#4900e5]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4900e5]">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${r.color}`}>
                <span className="material-icons-outlined text-xl">{r.icon}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-montserrat font-bold text-base text-[#0F172A]">{r.label}</h3>
                {r.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{r.badge}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
              <div className="mt-3 flex items-center gap-1 text-[#4900e5] text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                Get started <span className="material-icons-outlined text-sm">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Simple Process</p>
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#0F172A] text-center mb-12">
            How A1 Deal Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={h.step} className="relative text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200 z-0" />
                )}
                <div className="relative z-10 w-16 h-16 mx-auto rounded-2xl bg-[#4900e5]/10 flex items-center justify-center mb-4">
                  <span className="material-icons-outlined text-2xl text-[#4900e5]">{h.icon}</span>
                </div>
                <span className="text-xs font-bold text-[#4900e5] tracking-widest">{h.step}</span>
                <h3 className="font-montserrat font-bold text-base text-[#0F172A] mt-1 mb-2">{h.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-16">
        <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Why A1 Deal</p>
        <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#0F172A] text-center mb-12">
          Everything You Need, In One Place
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-[#4900e5]/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-outlined text-xl text-[#4900e5]">{f.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A] text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-[#0F172A] py-16 px-4 text-center">
        <h2 className="font-montserrat font-bold text-2xl md:text-4xl text-white mb-4">
          Ready to find your next deal?
        </h2>
        <p className="text-white/60 text-base mb-8 max-w-md mx-auto">
          Join 50,000+ buyers, brokers, and developers already using A1 Deal.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={() => navigate('/signup')}
            className="px-8 py-3.5 rounded-full bg-[#4900e5] text-white font-bold hover:bg-[#6236ff] transition shadow-lg shadow-[#4900e5]/40">
            Create Free Account
          </button>
          <button onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-full border border-white/30 text-white font-bold hover:border-white transition">
            Sign In
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0F172A] border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo variant="full" theme="dark" size="sm" />

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/40">
            <button onClick={() => navigate('/signup')} className="hover:text-white transition">Buy Property</button>
            <button onClick={() => navigate('/signup?role=broker')} className="hover:text-white transition">Become a Broker</button>
            <button onClick={() => navigate('/signup?role=developer')} className="hover:text-white transition">List Your Project</button>
            <button onClick={() => navigate('/signup?role=investor')} className="hover:text-white transition">Invest</button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/30">
            <span className="text-white/20">Internal:</span>
            {INTERNAL.map(p => (
              <button key={p.label} onClick={() => navigate(p.path)}
                className="flex items-center gap-1 hover:text-white/70 transition">
                <span className="material-icons-outlined text-xs">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-white/20 text-xs mt-6">© 2026 A1 Deal · Enterprise Real Estate Ecosystem</p>
      </footer>

    </div>
  );
}
