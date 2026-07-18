import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import AutoScrollRow from './AutoScrollRow';
import PropertyCard from './PropertyCard';
import ImageSlider from './ImageSlider';
import MobileBottomNav from './MobileBottomNav';
import SubscriptionPlans from './SubscriptionPlans';
import useSubscribe from '../../hooks/useSubscribe';
import { useAuth } from '../../context/AuthContext';
import { searchLocations } from '../../data/indiaLocations';
import { HOW_IT_WORKS_ART } from '../../data/howItWorksArt';
import api from '../../api/axios';

const ROLES = [
  {
    id: 'buyer',
    label: 'Buyer',
    icon: 'home',
    color: 'bg-primary/10 text-primary',
    description: 'Browse properties, apply for mortgages, attend auctions.',
  },
  {
    id: 'broker',
    label: 'Broker',
    icon: 'handshake',
    color: 'bg-secondary/10 text-secondary',
    description: 'Access exclusive listings and manage high-value leads.',
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: 'apartment',
    color: 'bg-primary-container/10 text-primary-container',
    description: 'List projects, manage inventory, and track partnerships.',
  },
  {
    id: 'bank',
    label: 'Bank',
    icon: 'account_balance',
    color: 'bg-secondary-container/10 text-secondary-container',
    description: 'List mortgage & auction properties and manage bank repo listings.',
  },
];

const JOIN_FAQS = [
  {
    id: 'buyer',
    question: 'Why should I join as a Buyer?',
    icon: 'home',
    benefits: 'Browse RERA-verified listings, and on Property Deals get bank-repo/auction properties at 30–40% below market price — all in one place. Apply for mortgages, schedule site visits, and buy directly from developers or brokers — every listing is verified before it goes live.',
    howToStart: 'Sign up and verify your email with a one-time OTP (about 60 seconds) — you get instant access, no approval wait. Start browsing listings, applying for mortgages, and scheduling visits right away.',
  },
  {
    id: 'broker',
    question: 'Why should I join as a Broker?',
    icon: 'handshake',
    benefits: 'Get exclusive leads and listings auto-routed to your pincode — no cold outreach needed. Manage every enquiry and site visit from one dashboard, and get promoted to Master Broker as you grow to start earning territory-wide override commissions.',
    howToStart: 'Sign up and verify your email with a one-time OTP — you get instant access, no approval wait, with leads routed to your pincode immediately.',
  },
  {
    id: 'master_broker',
    question: 'What is a Master Broker and how do they benefit from pincodes?',
    icon: 'verified',
    benefits: 'Master Brokers are assigned a set of pincodes as their territory. Every property listed in that territory — mortgage or unit — automatically routes through them: they earn an override commission on every deal closed there, even ones handled by a regular broker, on top of full commission on deals they close directly themselves.',
    howToStart: 'Start as a Broker, then request a Master Broker upgrade with your desired pincode coverage. Admin reviews and approves your territory before override commissions begin.',
  },
  {
    id: 'developer',
    question: 'Why should I join as a Developer?',
    icon: 'apartment',
    benefits: "List your projects to a verified buyer and broker network, manage unit-level inventory (pricing, floor-wise availability) in real time, and track partnership performance — admin-approved onboarding keeps the platform's listings trustworthy.",
    howToStart: 'Sign up and verify your email with a one-time OTP, then your account goes through a quick admin review before you can list projects and manage inventory.',
  },
  {
    id: 'bank',
    question: 'Why should I join as a Banker?',
    icon: 'account_balance',
    benefits: 'Access a pipeline of pre-verified mortgage leads, manage loan approvals and disbursements from a single dashboard, and list bank-owned auction properties directly to thousands of active buyers — all within a compliant, audit-ready platform.',
    howToStart: 'Sign up with your official bank email and submit your credentials. Your account goes through an admin verification step, and once approved you can immediately start managing mortgage leads and listing auction properties.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01', icon: 'person_add', title: 'Create Your Account',
    desc: 'Sign up as a buyer, broker, developer, or banker in under 2 minutes.',
    images: HOW_IT_WORKS_ART.createAccount,
  },
  {
    step: '02', icon: 'search', title: 'Discover Opportunities',
    desc: 'Browse verified listings, mortgage properties, and investment projects near you.',
    images: HOW_IT_WORKS_ART.discover,
  },
  {
    step: '03', icon: 'handshake', title: 'Close the Deal',
    desc: 'Connect directly with sellers, brokers, and developers — all on one platform.',
    images: HOW_IT_WORKS_ART.closeDeal,
  },
];

const FEATURES = [
  { icon: 'verified',        title: 'RERA Verified Listings',    desc: 'Every project is RERA-verified before going live on the platform.' },
  { icon: 'home_work',       title: 'Mortgage & Auction Hub',    desc: 'Access bank repo properties and live auctions in your city.' },
  { icon: 'groups',          title: 'Master Broker Network',     desc: 'Structured broker hierarchy with dedicated area master brokers.' },
  { icon: 'savings',         title: 'Investor Returns',          desc: 'Invest by city/project and track per annum returns transparently.' },
  { icon: 'speed',           title: 'Instant OTP Onboarding',   desc: 'Register and verify your email in 60 seconds — no paperwork.' },
  { icon: 'support_agent',   title: '360° Admin Support',        desc: 'Dedicated visit team reviews and admin oversight on every deal.' },
];

// ── Public property fetching ──────────────────────────────────────────────────
function usePublicProperties() {
  const [units,        setUnits]        = useState([]);
  const [mortgages,    setMortgages]    = useState([]);
  const [auctionUnits, setAuctionUnits] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/unit-properties/public?limit=6'),
      api.get('/mortgage-properties/public?limit=6'),
      api.get('/auction-unit-properties/public?limit=6'),
    ]).then(([u, m, a]) => {
      setUnits(u.data.properties        || []);
      setMortgages(m.data.properties    || []);
      setAuctionUnits(a.data.properties || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { units, mortgages, auctionUnits, loading };
}

function PropertySection({ title, tagline, icon, items, model, loading, navigate }) {
  if (!loading && items.length === 0) return null;
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-2xl text-primary">{icon}</span>
            <h3 className="font-montserrat font-bold text-2xl text-on-surface">{title}</h3>
          </div>
          {tagline && (
            <p className="animate-blink font-semibold text-secondary text-base mt-1.5 ml-9 flex items-center gap-1.5">
              <span className="material-icons-outlined animate-sparkle inline-block text-amber-400 text-lg" style={{ animationDelay: '0ms' }}>auto_awesome</span>
              {tagline}
              <span className="material-icons-outlined animate-sparkle inline-block text-amber-400 text-lg" style={{ animationDelay: '400ms' }}>auto_awesome</span>
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/signup')}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
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
        <AutoScrollRow
          items={items.slice(0, 6)}
          cardWidth="w-[85vw] max-w-[26rem] sm:w-[26rem]"
          gap="gap-4 sm:gap-6"
          renderItem={p => (
            <PropertyCard property={p} model={model} showShare />
          )}
        />
      )}
    </div>
  );
}

// ── Join FAQ accordion ─────────────────────────────────────────────────────────
function JoinFaqAccordion() {
  const [openId, setOpenId] = useState('buyer');

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {JOIN_FAQS.map(f => {
        const isOpen = openId === f.id;
        return (
          <div key={f.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : f.id)}
              className="w-full flex items-center gap-3 p-5 text-left"
            >
              <span className="material-icons-outlined text-primary flex-shrink-0">{f.icon}</span>
              <span className="flex-1 font-montserrat font-semibold text-on-surface">{f.question}</span>
              <span className={`material-icons-outlined text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 -mt-1 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">{f.benefits}</p>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">How to get started</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.howToStart}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
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
    <div ref={wrapRef} className="relative max-w-xl mx-auto mb-2">
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
          className="flex-1 px-4 py-3 text-sm text-slate-700 focus:outline-none placeholder-slate-400"
        />
        <button type="submit"
          className="m-1.5 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition">
          Search
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button type="button" onMouseDown={() => pick(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-primary/5 flex items-center gap-3 text-sm">
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
  const { user } = useAuth();
  const { subscribe, subscribingId, notice: subNotice, setNotice: setSubNotice } = useSubscribe();
  const { units, mortgages, auctionUnits, loading } = usePublicProperties();

  function handleSearch(city) {
    navigate(`/buyer/search?q=${encodeURIComponent(city)}`);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 md:px-10 py-6 bg-white/90 backdrop-blur border-b border-slate-100">
        <Logo variant="full" size="md" />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-on-surface-variant">
          <a href="#properties" className="hover:text-primary transition-colors">Properties</a>
          {(!user || ['buyer', 'broker', 'master_broker'].includes(user.role)) && (
            <a href="#plans" className="hover:text-primary transition-colors">Plans</a>
          )}
          <a href="#portals" className="hover:text-primary transition-colors">Portals</a>
          <button onClick={() => navigate('/buyer/articles')} className="hover:text-primary transition-colors">Articles</button>
        </nav>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {user ? (
            <button onClick={() => navigate('/buyer')}
              className="px-4 md:px-5 py-2 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-container transition shadow-md shadow-primary/20 whitespace-nowrap">
              My Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')}
                className="px-4 md:px-5 py-2 rounded-full border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition whitespace-nowrap">
                Sign In
              </button>
              <button onClick={() => navigate('/signup')}
                className="px-4 md:px-5 py-2 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-container transition shadow-md shadow-primary/20 whitespace-nowrap">
                <span className="hidden sm:inline">Sign Up Free</span>
                <span className="sm:hidden">Sign Up</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] pt-16 md:pt-24 pb-6 md:pb-8 px-4 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
          India's Premier Real Estate Ecosystem
        </span>
        <h1 className="font-montserrat font-bold text-4xl md:text-6xl text-on-surface mb-5 leading-tight">
          One Platform.<br />
          <span className="text-primary">Every Deal.</span>
        </h1>
        <p className="text-slate-500 text-base md:text-xl max-w-xl mx-auto mb-10">
          Buy, sell, invest, or broker — <span className="text-secondary font-semibold">A1 Deal</span> connects every player in India's real estate market.
        </p>

        <CitySearchBar onSearch={handleSearch} />

        <div className="mt-6 flex items-center justify-center gap-3">
          <a href="#plans" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-container transition shadow-md shadow-primary/20">
            <span className="material-icons-outlined text-base">workspace_premium</span>
            Buy a Package
          </a>
          <button onClick={() => navigate('/signup')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition">
            Sign Up Free
          </button>
        </div>
      </section>

      {/* ── Property Listings ── */}
      {(loading || units.length > 0 || mortgages.length > 0 || auctionUnits.length > 0) && (
        <section id="properties" className="max-w-6xl mx-auto w-full px-4 pt-4 pb-16">
          <p className="text-center text-xs font-bold text-[#484456] uppercase tracking-widest mb-3">Live on the Platform</p>
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-on-surface text-center mb-12">
            Featured Properties
          </h2>
          <PropertySection
            title="Property Partners"
            tagline="Be a Partner in Premium Properties"
            icon="apartment"
            model="UnitProperty"
            items={units}
            loading={loading}
            navigate={navigate}
          />
          <PropertySection
            title="Property Deals"
            tagline="Save 30–40% Compared to Market Prices"
            icon="account_balance"
            model="MortgageProperty"
            items={mortgages}
            loading={loading}
            navigate={navigate}
          />
          <PropertySection
            title="Auction Unit Properties"
            tagline="Bank-Linked Auction Inventory"
            icon="gavel"
            model="AuctionUnitProperty"
            items={auctionUnits}
            loading={loading}
            navigate={navigate}
          />
        </section>
      )}

      {/* ── Who are you? ── */}
      <section id="portals" className="max-w-5xl mx-auto w-full px-4 py-16">
        <p className="text-center text-xs font-bold text-[#484456] uppercase tracking-widest mb-3">Join as</p>
        <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#484456] text-center mb-10">
          What best describes you?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => navigate(`/signup?role=${r.id}`)}
              className="group text-left bg-white rounded-2xl p-7 border border-slate-100 hover:border-secondary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary">
              <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-4 ${r.color}`}>
                <span className="material-icons-outlined text-4xl">{r.icon}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-montserrat font-bold text-xl text-on-surface">{r.label}</h3>
                {r.badge && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700">{r.badge}</span>
                )}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{r.description}</p>
              <div className="mt-4 flex items-center gap-1 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition">
                Get started <span className="material-icons-outlined text-base">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Why Join FAQ ── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-16">
        <p className="text-center text-xs font-bold text-[#484456] uppercase tracking-widest mb-3">Frequently Asked</p>
        <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#484456] text-center mb-12">
          Why Join A1 Deal?
        </h2>
        <JoinFaqAccordion />
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-bold text-[#484456] uppercase tracking-widest mb-3">Simple Process</p>
        <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#484456] text-center mb-12">
          How A1 Deal Works
        </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(h => (
              <div key={h.step} className="bg-white rounded-2xl border border-slate-100 overflow-hidden text-center shadow-sm">
                <ImageSlider
                  images={h.images}
                  alt={h.title}
                  className="h-40"
                  interval={2500}
                  placeholderIcon={h.icon}
                />
                <div className="p-5">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 -mt-10 relative z-10 border-4 border-white">
                    <span className="material-icons-outlined text-xl text-primary">{h.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-primary tracking-widest">{h.step}</span>
                  <h3 className="font-montserrat font-bold text-base text-on-surface mt-1 mb-2">{h.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-16">
        <p className="text-center text-xs font-bold text-[#484456] uppercase tracking-widest mb-3">Why A1 Deal</p>
        <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#484456] text-center mb-12">
          Everything You Need, In One Place
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-5 p-6 rounded-2xl border border-slate-100 bg-white hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-outlined text-4xl text-primary">{f.icon}</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface text-base mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subscription Plans ── */}
      <section id="plans" className="bg-surface py-16 px-4">
        <div className="text-center mb-10">
          <h2 className="font-montserrat font-bold text-2xl md:text-4xl text-slate-900 mb-3">Choose Your Plan</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Start free as a buyer, upgrade to broker for leads and listings, or go Master Broker to own your territory.
          </p>
        </div>
        {subNotice && (
          <div className={`max-w-2xl mx-auto mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-3 ${
            subNotice.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}>
            <span>{subNotice.msg}</span>
            <button onClick={() => setSubNotice(null)}><span className="material-icons-outlined text-base">close</span></button>
          </div>
        )}
        <SubscriptionPlans onSubscribe={subscribe} subscribingId={subscribingId} user={user} />
        <p className="text-center text-xs text-slate-400 mt-8">Secure payments by Razorpay · GST may apply · Cancel anytime.</p>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-on-surface py-16 px-4 text-center">
        <h2 className="font-montserrat font-bold text-2xl md:text-4xl text-white mb-4">
          Ready to find your next deal?
        </h2>
        <p className="text-white/60 text-base mb-8 max-w-md mx-auto">
          Join 50,000+ buyers, brokers, and developers already using A1 Deal.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={() => navigate('/signup')}
            className="px-8 py-3.5 rounded-full bg-primary text-white font-bold hover:bg-primary-container transition shadow-lg shadow-primary/40">
            Create Free Account
          </button>
          <button onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-full border border-white/30 text-white font-bold hover:border-white transition">
            Sign In
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-on-surface border-t border-white/10 pt-10 pb-24 md:pb-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm md:text-xs text-white/50">
            <button onClick={() => navigate('/signup')} className="py-1 hover:text-white transition">Buy Property</button>
            <button onClick={() => navigate('/signup?role=broker')} className="py-1 hover:text-white transition">Become a Broker</button>
            <button onClick={() => navigate('/signup?role=developer')} className="py-1 hover:text-white transition">List Your Project</button>
            <button onClick={() => navigate('/signup?role=bank')} className="py-1 hover:text-white transition">Bank Partner</button>
            <button onClick={() => navigate('/buyer/articles')} className="py-1 hover:text-white transition">Articles</button>
          </div>

        </div>
        <p className="text-center text-white/20 text-xs mt-8">© 2026 A1 Deal · Enterprise Real Estate Ecosystem</p>
      </footer>

      {/* Sticky bottom nav (mobile) — guest / public landing */}
      <MobileBottomNav
        breakpoint="md"
        items={[
          { path: '/', icon: 'home', label: 'Home', end: true },
          { path: '/buyer/search', icon: 'search', label: 'Search' },
          { path: '/buyer/mortgage', icon: 'gavel', label: 'Deals' },
          { path: '/buyer/unit-properties', icon: 'apartment', label: 'Partners' },
          { path: '/login', icon: 'login', label: 'Sign In' },
        ]}
      />

    </div>
  );
}
