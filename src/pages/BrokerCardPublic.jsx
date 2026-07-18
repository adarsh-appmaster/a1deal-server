import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/common/PropertyCard';
import EnquiryModal from '../components/common/EnquiryModal';

/* ─── helpers ────────────────────────────────────────────────────────────── */
function fmtPrice(n) {
  if (!n) return '—';
  const l = Number(n);
  return l >= 10000000 ? `₹${(l / 10000000).toFixed(2)} Cr` : l >= 100000 ? `₹${(l / 100000).toFixed(1)} L` : `₹${l.toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── skeleton loader ────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-52 bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-100 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-5 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className="bg-gradient-to-br from-primary to-primary-container animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-24 rounded-2xl bg-white/15" />
          <div className="flex-1 space-y-3">
            <div className="h-7 bg-white/15 rounded w-48" />
            <div className="h-4 bg-white/10 rounded w-32" />
            <div className="h-3 bg-white/10 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── section wrapper ────────────────────────────────────────────────────── */
function Section({ title, subtitle, children, count, icon }) {
  if (!count) return null;
  return (
    <section className="fade-in-up">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="material-icons-outlined text-primary text-lg">{icon}</span>}
        <h3 className="font-montserrat font-bold text-lg text-slate-800">{title}</h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{count}</span>
      </div>
      {subtitle && <p className="text-xs text-slate-400 mb-3">{subtitle}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">{children}</div>
    </section>
  );
}

/* ─── trust stat pill ────────────────────────────────────────────────────── */
function StatPill({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/15">
      <span className="material-icons-outlined text-white/80 text-base">{icon}</span>
      <div>
        <p className="font-montserrat font-bold text-white text-sm leading-tight">{value}</p>
        <p className="text-white/60 text-[10px] leading-tight">{label}</p>
      </div>
    </div>
  );
}

/* ─── property category tabs ─────────────────────────────────────────────── */
const PROPERTY_TABS = [
  { key: 'mortgage',   label: 'Deals',       icon: 'gavel',        emptyMsg: 'No bank deals in this area yet.' },
  { key: 'auction',    label: 'Auctions',     icon: 'gavel',        emptyMsg: 'No auction properties in this area yet.' },
  { key: 'featured',   label: 'Featured',     icon: 'star',         emptyMsg: 'No featured properties selected yet.' },
  { key: 'listings',   label: 'Listings',     icon: 'storefront',   emptyMsg: 'No direct listings from this broker yet.' },
  { key: 'area',       label: 'Area',         icon: 'location_on',  emptyMsg: 'No area properties in this pincode yet.' },
];

/* ─── main component ─────────────────────────────────────────────────────── */
export default function BrokerCardPublic() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notFoundMsg, setNotFoundMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquireProperty, setEnquireProperty] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterBhk, setFilterBhk] = useState('');
  const [filterSort, setFilterSort] = useState('');
  const [showQuickEnquiry, setShowQuickEnquiry] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: '', phone: '', message: '' });
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickDone, setQuickDone] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sectionRefs = useRef({});
  const navRefs = useRef({}); // top-level page sections for the navbar/scroll-spy

  /* ─── SEO meta tags ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!data?.card) return;
    const c = data.card;
    const title = `${c.businessName || c.brokerName} — Property Broker in ${c.city || 'India'} | A1 Deal`;
    const desc = c.tagline || c.about || `Connect with ${c.brokerName}, a verified property broker${c.city ? ` in ${c.city}` : ''}. Browse deals, auction properties, and featured listings.`;
    document.title = title;

    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('description', desc);
    setMeta('og:title', title);
    setMeta('og:description', desc);
    setMeta('og:type', 'profile');
    setMeta('og:url', window.location.href);
    if (c.photo) setMeta('og:image', c.photo);
    setMeta('og:site_name', 'A1 Deal');

    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { const l = document.createElement('link'); l.rel = 'canonical'; l.href = window.location.href; document.head.appendChild(l); }
    else canonical.href = window.location.href;

    // Structured data
    const existingLd = document.getElementById('broker-ld-json');
    if (existingLd) existingLd.remove();
    const ld = document.createElement('script');
    ld.id = 'broker-ld-json';
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      name: c.businessName || c.brokerName,
      description: desc,
      url: window.location.href,
      image: c.photo || undefined,
      telephone: c.phone || undefined,
      email: c.email || undefined,
      identifier: c.reraNumber || undefined,
      address: c.city ? { '@type': 'PostalAddress', addressLocality: c.city } : undefined,
      brand: { '@type': 'Organization', name: 'A1 Deal' },
    });
    document.head.appendChild(ld);

    return () => { document.getElementById('broker-ld-json')?.remove(); };
  }, [data]);

  /* ─── back-to-top button ─────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ─── fetch data ─────────────────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    api.get(`/broker-card/public/${slug}`)
      .then((r) => {
        setData(r.data);
        if (r.data?.card?.brokerId) sessionStorage.setItem('refBroker', r.data.card.brokerId);
        // Auto-select first non-empty tab
        const d = r.data;
        const first = PROPERTY_TABS.find(t => {
          if (t.key === 'mortgage') return d.mortgageProperties?.length;
          if (t.key === 'auction') return d.auctionProperties?.length;
          if (t.key === 'featured') return d.unitProperties?.length;
          if (t.key === 'listings') return d.brokerListings?.length;
          if (t.key === 'area') return d.pincodeUnitProperties?.length;
          return false;
        });
        if (first) setActiveTab(first.key);
      })
      .catch((err) => { setNotFound(true); setNotFoundMsg(err.response?.data?.message || ''); })
      .finally(() => setLoading(false));
  }, [slug]);

  /* ─── scroll to section ──────────────────────────────────────────────── */
  const scrollToSection = useCallback((key) => {
    setActiveTab(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* ─── navbar: scroll to a top-level page section + update the URL hash ── */
  const scrollToNav = useCallback((id) => {
    setActiveNav(id);
    setMobileNavOpen(false);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      navRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    }
  }, []);

  /* ─── scroll-spy (highlight active nav) + jump to hash on load ────────── */
  useEffect(() => {
    if (!data) return;
    const hash = window.location.hash.replace('#', '');
    if (hash && navRefs.current[hash]) {
      setTimeout(() => navRefs.current[hash]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting && e.target.dataset.nav) setActiveNav(e.target.dataset.nav); }),
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    ['home', 'about', 'properties', 'blog', 'contact'].forEach((id) => {
      const el = navRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [data]);

  /* ─── filtered + sorted properties ───────────────────────────────────── */
  const filteredProps = useMemo(() => {
    if (!data) return {};
    const filterAndSort = (props) => {
      let list = [...(props || [])];
      if (filterBhk) list = list.filter(p => String(p.bedrooms) === filterBhk);
      if (filterSort === 'price_low') list.sort((a, b) => (a.price || 0) - (b.price || 0));
      if (filterSort === 'price_high') list.sort((a, b) => (b.price || 0) - (a.price || 0));
      if (filterSort === 'newest') list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return list;
    };
    return {
      mortgage: filterAndSort(data.mortgageProperties),
      auction: filterAndSort(data.auctionProperties),
      featured: filterAndSort(data.unitProperties),
      listings: filterAndSort(data.brokerListings),
      area: filterAndSort(data.pincodeUnitProperties),
    };
  }, [data, filterBhk, filterSort]);

  /* ─── tab counts ─────────────────────────────────────────────────────── */
  const tabCounts = useMemo(() => {
    if (!data) return {};
    return {
      mortgage: data.mortgageProperties?.length || 0,
      auction: data.auctionProperties?.length || 0,
      featured: data.unitProperties?.length || 0,
      listings: data.brokerListings?.length || 0,
      area: data.pincodeUnitProperties?.length || 0,
    };
  }, [data]);

  const totalProperties = Object.values(tabCounts).reduce((s, n) => s + n, 0);

  /* ─── loading state ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SkeletonHero />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 h-32 animate-pulse" />
            <div className="bg-white rounded-2xl border border-slate-100 p-5 h-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  /* ─── not found ──────────────────────────────────────────────────────── */
  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-slate-50">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
          <span className="material-icons-outlined text-5xl text-slate-300">badge</span>
        </div>
        <h1 className="font-montserrat font-bold text-xl text-slate-700">{notFoundMsg || 'Card not found'}</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xs">This broker card may have been removed or is not yet published.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">
          Go to A1 Deal
        </button>
      </div>
    );
  }

  const { card, unitProperties = [], brokerListings = [], partnerBranding, blogPosts = [] } = data;
  const cardUrl = window.location.href;
  const hasStats = card.stats && (card.stats.experienceYears > 0 || card.stats.dealsClosed > 0 || card.stats.happyClients > 0);
  const NAV_LINKS = [
    { id: 'home', label: 'Home', show: true },
    { id: 'about', label: 'About', show: !!card.about || hasStats },
    { id: 'properties', label: 'Properties', show: totalProperties > 0 },
    { id: 'blog', label: 'Blog', show: blogPosts.length > 0 },
    { id: 'contact', label: 'Contact', show: true },
  ].filter((l) => l.show);
  const SOCIAL = [
    { key: 'website', label: 'Website', icon: 'language' },
    { key: 'instagram', label: 'Instagram', icon: 'photo_camera' },
    { key: 'facebook', label: 'Facebook', icon: 'thumb_up' },
    { key: 'youtube', label: 'YouTube', icon: 'smart_display' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'work' },
    { key: 'twitter', label: 'X', icon: 'tag' },
  ].filter((s) => card.social?.[s.key]);
  const waNum = String(card.whatsapp || '').replace(/[^\d]/g, '');
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl)}`;

  /* ─── actions ────────────────────────────────────────────────────────── */
  function copyLink() {
    navigator.clipboard?.writeText(cardUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function saveVCard() {
    const vcf = [
      'BEGIN:VCARD', 'VERSION:3.0',
      `FN:${card.brokerName || card.businessName}`,
      card.businessName ? `ORG:${card.businessName}` : '',
      'TITLE:Property Broker',
      card.phone ? `TEL;TYPE=CELL:${card.phone}` : '',
      card.email ? `EMAIL:${card.email}` : '',
      card.tagline ? `NOTE:${card.tagline}` : '',
      `URL:${cardUrl}`,
      'END:VCARD',
    ].filter(Boolean).join('\n');
    const blob = new Blob([vcf], { type: 'text/vcard' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(card.brokerName || 'broker').replace(/\s+/g, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function shareWhatsAppCatalog() {
    const lines = [`🏠 *Property Listings from ${card.businessName || card.brokerName}*`, ''];
    const allProps = [
      ...(brokerListings || []).map(p => ({ ...p, cat: 'Listing' })),
      ...(unitProperties || []).map(p => ({ ...p, cat: 'Featured' })),
    ];
    allProps.slice(0, 8).forEach((p, i) => {
      lines.push(`*${i + 1}. ${p.title}*`);
      lines.push(`📍 ${[p.area, p.city].filter(Boolean).join(', ')}`);
      if (p.price) lines.push(`💰 ${fmtPrice(p.price)}`);
      lines.push('');
    });
    lines.push(`📋 View all ${totalProperties} properties:`);
    lines.push(cardUrl);
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  function requestAction(action) {
    if (user) runAction(action);
    else setPendingAction(action);
  }

  function runAction(action) {
    setPendingAction(null);
    if (action.type === 'enquire') {
      if (action.property) setEnquireProperty(action.property);
      else setShowEnquiry(true);
    } else if (action.type === 'visit') {
      doScheduleVisit(action.property, action.model);
    }
  }

  function doScheduleVisit(property, model) {
    if (model === 'BrokerListing') { navigate(`/buyer/deal-desk/${property._id}`); return; }
    const state = {
      propertyTitle: property.title,
      city: property.city || card.city,
      area: property.area,
      propertyModel: model,
      refBroker: card.brokerId,
      pincode: card.pincodes?.[0] || '',
    };
    if (user?.role === 'buyer') navigate(`/buyer/visit/${property._id}`, { state });
    else navigate(`/visit/${property._id}`, { state });
  }

  function goSignup() {
    const params = new URLSearchParams({ ref: card.brokerId });
    if (card.city) params.set('city', card.city);
    if (card.pincodes?.[0]) params.set('pincode', card.pincodes[0]);
    navigate(`/signup?${params.toString()}`);
  }

  async function submitQuickEnquiry(e) {
    e.preventDefault();
    if (!quickForm.name.trim() || !quickForm.phone.trim()) return;
    setQuickSubmitting(true);
    try {
      await api.post('/enquiry', {
        name: quickForm.name.trim(),
        phone: quickForm.phone.trim(),
        message: quickForm.message.trim(),
        city: card.city || '',
        pincode: card.pincodes?.[0] || '',
        refBroker: card.brokerId,
      });
      setQuickDone(true);
    } catch { /* silent */ }
    setQuickSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 sm:pb-0">
      {/* ═══ STICKY NAVBAR ═══ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button onClick={() => scrollToNav('home')} className="flex items-center gap-2 min-w-0">
            {card.logo || card.photo ? (
              <img src={card.logo || card.photo} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">{(card.businessName || card.brokerName || 'B')[0]}</span>
            )}
            <span className="font-montserrat font-bold text-slate-800 text-sm truncate max-w-[40vw]">{card.businessName || card.brokerName}</span>
          </button>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <button key={l.id} onClick={() => scrollToNav(l.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeNav === l.id ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-primary hover:bg-slate-50'}`}>
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            {card.phone && (
              <a href={`tel:${card.phone}`} aria-label="Call" className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition">
                <span className="material-icons-outlined text-lg">call</span>
              </a>
            )}
            {waNum && (
              <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition">
                <span className="material-icons-outlined text-lg">chat</span>
              </a>
            )}
            <button onClick={() => setMobileNavOpen((v) => !v)} aria-label="Menu" className="md:hidden w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center">
              <span className="material-icons-outlined text-xl">{mobileNavOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-2 space-y-0.5">
            {NAV_LINKS.map((l) => (
              <button key={l.id} onClick={() => scrollToNav(l.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition ${activeNav === l.id ? 'text-primary bg-primary/10' : 'text-slate-600 hover:bg-slate-50'}`}>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ═══ HERO HEADER (home) ═══ */}
      <div ref={(el) => { navRefs.current.home = el; }} data-nav="home"
        className="bg-gradient-to-br from-primary via-primary-container to-secondary text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 fade-in-up fade-in-up-delay-1">
            {/* Profile photo — larger, rounded */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white/15 border-2 border-white/25 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg">
              {card.photo || card.logo ? (
                <img src={card.photo || card.logo} alt={card.brokerName} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="material-icons-outlined text-5xl text-white/60">person</span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h1 className="font-montserrat font-extrabold text-2xl sm:text-3xl drop-shadow-sm">{card.businessName || card.brokerName}</h1>
                {card.isMaster && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
                    <span className="material-icons-outlined text-xs">verified</span>MASTER BROKER
                  </span>
                )}
                {card.reraNumber && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20" title="RERA registered">
                    <span className="material-icons-outlined text-xs">verified_user</span>RERA: {card.reraNumber}
                  </span>
                )}
              </div>
              {card.businessName && card.businessName !== card.brokerName && (
                <p className="text-white/80 text-sm mt-0.5">{card.brokerName}</p>
              )}
              {card.tagline && <p className="text-white/90 text-sm mt-1 font-medium italic">"{card.tagline}"</p>}
              {card.city && (
                <p className="text-white/60 text-xs mt-1.5 flex items-center gap-1 justify-center sm:justify-start">
                  <span className="material-icons-outlined text-xs">location_on</span>
                  {card.city}{card.pincodes?.length ? ` · ${card.pincodes.length} pincode${card.pincodes.length > 1 ? 's' : ''}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Trust stats row */}
          <div className="flex flex-wrap gap-2 mt-5 justify-center sm:justify-start fade-in-up fade-in-up-delay-2">
            {card.stats?.experienceYears > 0 && <StatPill icon="workspace_premium" value={`${card.stats.experienceYears}+`} label="Years" />}
            {card.stats?.dealsClosed > 0 && <StatPill icon="handshake" value={`${card.stats.dealsClosed}+`} label="Deals" />}
            {card.stats?.happyClients > 0 && <StatPill icon="groups" value={`${card.stats.happyClients}+`} label="Clients" />}
            {totalProperties > 0 && <StatPill icon="apartment" value={totalProperties} label="Properties" />}
            {card.pincodes?.length > 0 && <StatPill icon="map" value={card.pincodes.length} label="Pincodes" />}
            {card.isMaster && <StatPill icon="verified" value="Master" label="Broker" />}
            <StatPill icon="handshake" value="A1 Deal" label="Verified" />
          </div>

          {/* Contact actions */}
          <div className="flex flex-wrap gap-2 mt-5 justify-center sm:justify-start fade-in-up fade-in-up-delay-3">
            {card.phone && (
              <a href={`tel:${card.phone}`} aria-label="Call broker"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-primary text-sm font-semibold hover:bg-white/90 active:scale-95 transition min-h-[44px]">
                <span className="material-icons-outlined text-base">call</span>Call
              </a>
            )}
            {waNum && (
              <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer" aria-label="WhatsApp broker"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 active:scale-95 transition min-h-[44px] shadow-lg shadow-emerald-500/25">
                <span className="material-icons-outlined text-base">chat</span>WhatsApp
              </a>
            )}
            <button onClick={() => requestAction({ type: 'enquire' })} aria-label="Send enquiry"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-primary text-sm font-semibold hover:bg-white/90 active:scale-95 transition min-h-[44px]">
              <span className="material-icons-outlined text-base">mail</span>Enquire
            </button>
            {card.email && (
              <a href={`mailto:${card.email}`} aria-label="Send email"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/15 border border-white/30 text-white text-sm font-semibold hover:bg-white/25 active:scale-95 transition min-h-[44px]">
                <span className="material-icons-outlined text-base">email</span>Email
              </a>
            )}
            <button onClick={saveVCard} aria-label="Download vCard"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/15 border border-white/30 text-white text-sm font-semibold hover:bg-white/25 active:scale-95 transition min-h-[44px]">
              <span className="material-icons-outlined text-base">download</span>Save Contact
            </button>
            <button onClick={copyLink} aria-label="Share card link"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/15 border border-white/30 text-white text-sm font-semibold hover:bg-white/25 active:scale-95 transition min-h-[44px]">
              <span className="material-icons-outlined text-base">{copied ? 'check' : 'share'}</span>{copied ? 'Copied!' : 'Share'}
            </button>
          </div>

          {/* Social links */}
          {SOCIAL.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start fade-in-up fade-in-up-delay-4">
              {SOCIAL.map((s) => (
                <a key={s.key} href={card.social[s.key]} target="_blank" rel="noreferrer" aria-label={s.label}
                  className="w-10 h-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center hover:bg-white/25 active:scale-95 transition min-h-[44px] min-w-[44px]">
                  <span className="material-icons-outlined text-base text-white">{s.icon}</span>
                </a>
              ))}
            </div>
          )}

          {/* Partner branding — "In partnership with" strip */}
          {partnerBranding && (
            <div className="mt-4 pt-4 border-t border-white/15 flex items-center gap-3 fade-in-up fade-in-up-delay-4">
              {partnerBranding.logo ? (
                <img src={partnerBranding.logo} alt={partnerBranding.businessName} className="w-7 h-7 rounded-lg flex-shrink-0 object-cover opacity-90" loading="lazy" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-white/70 text-sm">{partnerBranding.isMaster ? 'verified' : 'storefront'}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-white/50 uppercase tracking-wide font-semibold leading-tight">
                  {partnerBranding.isMaster ? 'In partnership with Master Broker' : 'In partnership with'}
                </p>
                <p className="text-white/90 text-xs font-semibold truncate leading-tight">{partnerBranding.businessName}</p>
              </div>
              {partnerBranding.slug && (
                <a href={`/b/${partnerBranding.slug}`} target="_blank" rel="noreferrer"
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-white/15 text-white/80 text-[10px] font-semibold hover:bg-white/25 transition ml-auto min-h-[32px] flex items-center">
                  View Card
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ═══ ABOUT + QR + SHARE CATALOG ═══ */}
        <div ref={(el) => { navRefs.current.about = el; }} data-nav="about" id="about"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-in-up scroll-mt-16">
          {card.about && (
            <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-montserrat font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <span className="material-icons-outlined text-primary text-lg">info</span>About
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{card.about}</p>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center justify-center gap-3 shadow-sm">
            <img src={qrSrc} alt="Scan to share this card" className="w-36 h-36 rounded-lg" loading="lazy" />
            <p className="text-xs text-slate-400 text-center">Scan to share this card</p>
            <p className="text-[10px] text-slate-300 font-mono text-center break-all max-w-[200px]">{cardUrl}</p>
            <button onClick={saveVCard}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline min-h-[44px]">
              <span className="material-icons-outlined text-sm">download</span>Download vCard
            </button>
          </div>
        </div>

        {/* ═══ QUICK ENQUIRY BAR ═══ */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-4 sm:p-5 border border-primary/10 fade-in-up">
          {quickDone ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="material-icons-outlined text-emerald-600 text-xl">check_circle</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Enquiry sent!</p>
                <p className="text-xs text-slate-500">{card.brokerName} will get back to you shortly.</p>
              </div>
            </div>
          ) : showQuickEnquiry ? (
            <form onSubmit={submitQuickEnquiry} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <span className="material-icons-outlined text-primary text-lg">quickreply</span>Quick Enquiry
                </p>
                <button type="button" onClick={() => setShowQuickEnquiry(false)} className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <span className="material-icons-outlined text-lg">close</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required placeholder="Your name" value={quickForm.name}
                  onChange={e => setQuickForm(f => ({ ...f, name: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white min-h-[44px]" />
                <input required placeholder="Phone number" type="tel" value={quickForm.phone}
                  onChange={e => setQuickForm(f => ({ ...f, phone: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white min-h-[44px]" />
              </div>
              <input placeholder="Message (optional)" value={quickForm.message}
                onChange={e => setQuickForm(f => ({ ...f, message: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white min-h-[44px]" />
              <div className="flex gap-2">
                <button type="submit" disabled={quickSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60 min-h-[44px]">
                  {quickSubmitting ? 'Sending…' : 'Send Enquiry'}
                </button>
                {waNum && (
                  <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Hi ${card.brokerName}, I'm interested in your properties.`)}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition min-h-[44px]">
                    <span className="material-icons-outlined text-base">chat</span>WhatsApp
                  </a>
                )}
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 text-center sm:text-left">
                <p className="font-semibold text-slate-800 text-sm">Interested in properties here?</p>
                <p className="text-xs text-slate-500 mt-0.5">Send a quick enquiry or message on WhatsApp — no login needed.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowQuickEnquiry(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition min-h-[44px]">
                  <span className="material-icons-outlined text-base">quickreply</span>Quick Enquiry
                </button>
                {waNum && (
                  <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Hi ${card.brokerName}, I'm interested in your properties.`)}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition min-h-[44px] shadow-lg shadow-emerald-500/20">
                    <span className="material-icons-outlined text-base">chat</span>WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ PROPERTY TABS ═══ */}
        {totalProperties > 0 && (
          <div ref={(el) => { navRefs.current.properties = el; }} data-nav="properties" id="properties" className="fade-in-up scroll-mt-16">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-outlined text-primary text-lg">apartment</span>
              <h2 className="font-montserrat font-bold text-lg text-slate-800">Properties</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
              {PROPERTY_TABS.map(t => {
                const count = tabCounts[t.key] || 0;
                if (!count) return null;
                return (
                  <button key={t.key} onClick={() => scrollToSection(t.key)}
                    aria-pressed={activeTab === t.key}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition min-h-[44px] border
                      ${activeTab === t.key
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'}`}>
                    <span className="material-icons-outlined text-base">{t.icon}</span>
                    {t.label}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === t.key ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Filters bar */}
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => setShowFilters(f => !f)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:border-primary/40 transition min-h-[44px]">
                <span className="material-icons-outlined text-sm">tune</span>Filters
                {(filterBhk || filterSort) && <span className="w-2 h-2 rounded-full bg-primary" />}
              </button>
              {(filterBhk || filterSort) && (
                <button onClick={() => { setFilterBhk(''); setFilterSort(''); }}
                  className="text-xs text-primary font-semibold hover:underline min-h-[44px] px-2">
                  Clear filters
                </button>
              )}
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-white rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">BHK:</span>
                  {['1', '2', '3', '4'].map(b => (
                    <button key={b} onClick={() => setFilterBhk(filterBhk === b ? '' : b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition min-h-[36px]
                        ${filterBhk === b ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}>
                      {b}BHK
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-slate-400 font-semibold">Sort:</span>
                  <select value={filterSort} onChange={e => setFilterSort(e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[36px]">
                    <option value="">Default</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PROPERTY SECTIONS ═══ */}
        <div ref={el => { sectionRefs.current.mortgage = el; }}>
          <Section title="Property Deals" subtitle="Bank & mortgage properties in the broker's pincodes" count={filteredProps.mortgage?.length} icon="local_offer">
            {filteredProps.mortgage?.map((p) => (
              <PropertyCard key={p._id} property={p} model="MortgageProperty" showShare badge={{ label: 'Deal', cls: 'bg-category-deal text-white' }}
                onEnquire={(prop) => requestAction({ type: 'enquire', property: { ...prop, _model: 'MortgageProperty' } })}
                onScheduleVisit={(prop) => requestAction({ type: 'visit', property: prop, model: 'MortgageProperty' })} />
            ))}
          </Section>
        </div>

        <div ref={el => { sectionRefs.current.auction = el; }}>
          <Section title="Auction Properties" subtitle="Auction unit properties in the broker's pincodes" count={filteredProps.auction?.length} icon="gavel">
            {filteredProps.auction?.map((p) => (
              <PropertyCard key={p._id} property={p} model="AuctionUnitProperty" showShare badge={{ label: 'Auction', cls: 'bg-amber-500 text-white' }}
                onEnquire={(prop) => requestAction({ type: 'enquire', property: { ...prop, _model: 'AuctionUnitProperty' } })}
                onScheduleVisit={(prop) => requestAction({ type: 'visit', property: prop, model: 'AuctionUnitProperty' })} />
            ))}
          </Section>
        </div>

        <div ref={el => { sectionRefs.current.featured = el; }}>
          <Section title="Featured Properties" subtitle="Hand-picked by the broker" count={filteredProps.featured?.length} icon="star">
            {filteredProps.featured?.map((p) => (
              <PropertyCard key={p._id} property={p} model="UnitProperty" showShare badge={{ label: 'Featured', cls: 'bg-primary text-white' }}
                onEnquire={(prop) => requestAction({ type: 'enquire', property: { ...prop, _model: 'UnitProperty' } })}
                onScheduleVisit={(prop) => requestAction({ type: 'visit', property: prop, model: 'UnitProperty' })} />
            ))}
          </Section>
        </div>

        <div ref={el => { sectionRefs.current.listings = el; }}>
          <Section title="Direct from this broker" subtitle="Properties listed by the broker" count={filteredProps.listings?.length} icon="storefront">
            {filteredProps.listings?.map((p) => (
              <PropertyCard key={p._id} property={{ ...p, _model: 'BrokerListing' }} model="BrokerListing" showShare
                badge={{ label: p.listingType === 'lease' ? 'For Lease' : 'For Sale', cls: 'bg-primary text-white' }}
                onEnquire={(prop) => requestAction({ type: 'enquire', property: { ...prop, _model: 'BrokerListing' } })}
                onScheduleVisit={(prop) => requestAction({ type: 'visit', property: prop, model: 'BrokerListing' })} />
            ))}
          </Section>
        </div>

        <div ref={el => { sectionRefs.current.area = el; }}>
          <Section title="Properties in this area" subtitle="Platform listings in the broker's pincodes" count={filteredProps.area?.length} icon="location_on">
            {filteredProps.area?.map((p) => (
              <PropertyCard key={p._id} property={p} model="UnitProperty" showShare badge={{ label: 'Area', cls: 'bg-emerald-500 text-white' }}
                onEnquire={(prop) => requestAction({ type: 'enquire', property: { ...prop, _model: 'UnitProperty' } })}
                onScheduleVisit={(prop) => requestAction({ type: 'visit', property: prop, model: 'UnitProperty' })} />
            ))}
          </Section>
        </div>

        {/* Empty state */}
        {totalProperties === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <span className="material-icons-outlined text-5xl text-slate-200 block mb-3">apartment</span>
            <p className="text-slate-500 text-sm font-medium">No properties to show yet.</p>
            <p className="text-slate-400 text-xs mt-1">Check back soon or contact the broker directly.</p>
          </div>
        )}

        {/* Share all properties CTA */}
        {totalProperties > 0 && (
          <div className="text-center fade-in-up">
            <button onClick={shareWhatsAppCatalog}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition border border-emerald-200 min-h-[44px]">
              <span className="material-icons-outlined text-lg">share</span>
              Share All Properties on WhatsApp
            </button>
          </div>
        )}

        {/* ═══ BLOG ═══ */}
        {blogPosts.length > 0 && (
          <section ref={(el) => { navRefs.current.blog = el; }} data-nav="blog" id="blog" className="fade-in-up scroll-mt-16">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons-outlined text-primary text-lg">article</span>
              <h2 className="font-montserrat font-bold text-lg text-slate-800">Blog</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogPosts.map((p) => (
                <a key={p._id} href={`/blog/${p.slug}`} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition group">
                  <div className="h-40 bg-slate-100 overflow-hidden">
                    {p.featuredImage
                      ? <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="material-icons-outlined text-4xl text-slate-200">article</span></div>}
                  </div>
                  <div className="p-4">
                    {p.category && <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{p.category}</span>}
                    <h3 className="font-montserrat font-semibold text-slate-800 text-sm mt-1 line-clamp-2">{p.title}</h3>
                    {(p.excerpt || p.shortDescription) && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.excerpt || p.shortDescription}</p>}
                    <p className="text-[10px] text-slate-400 mt-2">{fmtDate(p.publishedAt || p.createdAt)}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ═══ CONTACT ═══ */}
        <section ref={(el) => { navRefs.current.contact = el; }} data-nav="contact" id="contact" className="fade-in-up scroll-mt-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-icons-outlined text-primary text-lg">contact_page</span>
            <h2 className="font-montserrat font-bold text-lg text-slate-800">Contact</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              {card.phone && <a href={`tel:${card.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition"><span className="material-icons-outlined text-primary text-lg">call</span>{card.phone}</a>}
              {waNum && <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition"><span className="material-icons-outlined text-emerald-500 text-lg">chat</span>WhatsApp</a>}
              {card.email && <a href={`mailto:${card.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition"><span className="material-icons-outlined text-primary text-lg">mail</span>{card.email}</a>}
              {card.city && <p className="flex items-center gap-2 text-sm text-slate-600"><span className="material-icons-outlined text-primary text-lg">location_on</span>{card.city}</p>}
            </div>
            <div className="flex flex-col justify-center gap-2">
              <button onClick={() => requestAction({ type: 'enquire' })}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition">Send an Enquiry</button>
              {waNum && (
                <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Hi ${card.brokerName}, I'm interested in your properties.`)}`} target="_blank" rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm text-center hover:bg-emerald-600 transition flex items-center justify-center gap-1.5">
                  <span className="material-icons-outlined text-base">chat</span>Message on WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="pt-6 mt-2 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
            <div className="flex items-center gap-2">
              {(card.logo || card.photo) && <img src={card.logo || card.photo} alt="" className="w-8 h-8 rounded-lg object-cover" />}
              <span className="font-montserrat font-bold text-slate-700 text-sm">{card.businessName || card.brokerName}</span>
            </div>
            <nav className="flex items-center gap-1 flex-wrap justify-center">
              {NAV_LINKS.filter((l) => l.id !== 'home').map((l) => (
                <button key={l.id} onClick={() => scrollToNav(l.id)} className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-primary transition">{l.label}</button>
              ))}
            </nav>
            {SOCIAL.length > 0 && (
              <div className="flex items-center gap-1.5">
                {SOCIAL.map((s) => (
                  <a key={s.key} href={card.social[s.key]} target="_blank" rel="noreferrer" aria-label={s.label}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition">
                    <span className="material-icons-outlined text-sm">{s.icon}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="text-center pb-8 space-y-1">
            <p className="text-xs text-slate-300">Powered by A1 Deal</p>
            {data.card?.lastUpdated && (
              <p className="text-[10px] text-slate-300">Last updated: {fmtDate(data.card.lastUpdated)}</p>
            )}
          </div>
        </footer>
      </div>

      {/* ═══ STICKY MOBILE CTA BAR ═══ */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden z-50 bg-white border-t border-slate-200 shadow-lg safe-area-pb">
        <div className="flex items-center gap-2 px-3 py-2">
          {card.phone && (
            <a href={`tel:${card.phone}`} aria-label="Call"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-white text-sm font-bold min-h-[48px] active:scale-95 transition">
              <span className="material-icons-outlined text-base">call</span>Call
            </a>
          )}
          {waNum && (
            <a href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold min-h-[48px] active:scale-95 transition shadow-lg shadow-emerald-500/25">
              <span className="material-icons-outlined text-base">chat</span>WhatsApp
            </a>
          )}
          <button onClick={() => requestAction({ type: 'enquire' })} aria-label="Enquire"
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border-2 border-primary text-primary text-sm font-bold min-h-[48px] min-w-[48px] active:scale-95 transition">
            <span className="material-icons-outlined text-base">mail</span>
          </button>
        </div>
      </div>

      {/* ═══ BACK TO TOP ═══ */}
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"
          className="fixed bottom-24 sm:bottom-8 right-4 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary-container active:scale-90 transition min-h-[48px] min-w-[48px]">
          <span className="material-icons-outlined text-xl">keyboard_arrow_up</span>
        </button>
      )}

      {/* ═══ ENQUIRY MODALS ═══ */}
      {showEnquiry && <EnquiryModal refBroker={card.brokerId} onClose={() => { setShowEnquiry(false); setEnquireProperty(null); }} />}
      {enquireProperty && <EnquiryModal property={enquireProperty} refBroker={card.brokerId} onClose={() => setEnquireProperty(null)} />}

      {/* ═══ GUEST ACCESS-CHOICE SHEET ═══ */}
      {pendingAction && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setPendingAction(null)} role="dialog" aria-modal="true">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="material-icons-outlined text-primary text-2xl">
                  {pendingAction.type === 'visit' ? 'event' : 'contact_support'}
                </span>
              </div>
              <h3 className="font-montserrat font-bold text-lg text-slate-800">
                {pendingAction.type === 'visit' ? 'Schedule a Visit' : 'Send an Enquiry'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Create an account to track it in your portal, or continue as a guest.
              </p>
            </div>
            <div className="px-6 pb-6 space-y-2.5">
              <button onClick={goSignup}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition flex items-center justify-center gap-2 min-h-[48px]">
                <span className="material-icons-outlined text-base">person_add</span>Sign up
              </button>
              <button onClick={() => runAction(pendingAction)}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition min-h-[48px]">
                Continue as guest
              </button>
              <button onClick={() => navigate('/login')}
                className="w-full py-2.5 text-primary font-semibold text-sm hover:underline min-h-[44px]">
                Already have an account? Log in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
