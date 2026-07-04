import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import EnquiryModal from '../../../components/common/EnquiryModal';

const STATUS_COLOR = {
  available:     'bg-emerald-100 text-emerald-800',
  under_process: 'bg-amber-100 text-amber-800',
  sold:          'bg-slate-100 text-slate-500',
};
const STATUS_LABEL = {
  available:     'Available',
  under_process: 'Under Process',
  sold:          'Sold',
};

function formatPrice(n) {
  if (!n && n !== 0) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function LockedField({ placeholder, onUnlock }) {
  return (
    <button type="button" onClick={onUnlock}
      className="relative inline-flex items-center gap-1 group">
      <span className="blur-sm select-none text-slate-700 text-sm font-medium pointer-events-none">
        {placeholder || '••••••••'}
      </span>
      <span className="absolute inset-0 flex items-center justify-center gap-1 text-xs font-semibold text-[#4900e5] opacity-0 group-hover:opacity-100 transition bg-white/60 rounded px-1">
        <span className="material-icons-outlined text-sm">lock_open</span>
        Login
      </span>
      <span className="material-icons-outlined text-sm text-slate-400 group-hover:text-[#4900e5] transition">lock</span>
    </button>
  );
}

function LoginPrompt({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-[#4900e5]/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-icons-outlined text-[#4900e5] text-2xl">lock</span>
        </div>
        <h3 className="font-montserrat font-bold text-lg text-slate-800 mb-2">Sign in to unlock full details</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Create a free account to view pincode, auction schedule, and contact the bank directly.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/signup')}
            className="flex-1 py-2.5 rounded-xl bg-[#4900e5] text-white font-semibold text-sm hover:bg-[#6236ff] transition">
            Sign Up Free
          </button>
          <button onClick={() => navigate('/login')}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition">
            Sign In
          </button>
        </div>
        <button onClick={onClose} className="mt-3 text-xs text-slate-400 hover:text-slate-600">Continue browsing</button>
      </div>
    </div>
  );
}

export default function MortgagePropertyDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isGuest   = !user;

  const [property, setProperty]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showLogin, setShowLogin]     = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/mortgage-properties/public/${id}`)
      .then(r => setProperty(r.data.property))
      .catch(err => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-4 animate-pulse">
        <div className="h-6 w-28 bg-slate-100 rounded" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-48 bg-slate-100 rounded-2xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <span className="material-icons-outlined text-6xl text-slate-200 mb-4">account_balance</span>
        <h2 className="font-montserrat font-bold text-xl text-slate-700 mb-2">Property not found</h2>
        <p className="text-slate-500 mb-6">This listing may have been removed or is no longer available.</p>
        <button onClick={() => navigate('/buyer/mortgage')}
          className="px-5 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition">
          Back to Mortgage Properties
        </button>
      </div>
    );
  }

  const location = [property.area, property.city].filter(Boolean).join(', ');

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#4900e5] mb-6 transition-colors">
          <span className="material-icons-outlined text-sm">arrow_back</span>Back
        </button>

        {isGuest && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">
            <span className="material-icons-outlined text-amber-600 text-base">info</span>
            <span className="text-amber-800 flex-1">Some details are hidden. <strong>Sign in to see full property information.</strong></span>
            <button onClick={() => setShowLogin(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#4900e5] text-white text-xs font-semibold hover:bg-[#6236ff] transition">
              Sign In
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero */}
            <div className="rounded-2xl overflow-hidden border border-slate-100 bg-gradient-to-br from-amber-50 to-white">
              <div className="relative h-56 flex items-center justify-center bg-gradient-to-br from-amber-100/60 to-white">
                {property.images?.[0]
                  ? <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                  : <span className="material-icons-outlined text-8xl text-amber-300">account_balance</span>}
                <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[property.status] || 'bg-slate-100 text-slate-500'}`}>
                  {STATUS_LABEL[property.status] || property.status}
                </span>
                <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 capitalize">
                  {property.type?.replace(/_/g, ' ') || 'Bank Repo'}
                </span>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h1 className="font-montserrat font-bold text-2xl text-slate-800 mb-1">{property.title}</h1>
              <p className="text-slate-500 text-sm flex items-center gap-1 mb-4">
                <span className="material-icons-outlined text-sm">location_on</span>
                {location || '—'}
                {property.pincode && (
                  isGuest
                    ? <span className="ml-1"><LockedField placeholder="— ——" onUnlock={() => setShowLogin(true)} /></span>
                    : <span className="ml-1">– {property.pincode}</span>
                )}
              </p>

              {/* Price + auction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Reserve Price</p>
                  <p className="font-montserrat font-bold text-2xl text-amber-800">{formatPrice(property.price)}</p>
                </div>
                {property.auctionDate && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Auction Date</p>
                    <p className="font-montserrat font-bold text-lg text-slate-800">
                      {new Date(property.auctionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 bg-slate-50 rounded-xl">
                {[
                  property.bedrooms  > 0 && { icon: 'bed',         label: 'Bedrooms', val: `${property.bedrooms} BHK` },
                  property.area_sqft > 0 && { icon: 'square_foot', label: 'Area',     val: `${property.area_sqft.toLocaleString()} sqft` },
                  property.bankName       && { icon: 'account_balance', label: 'Bank', val: property.bankName },
                  property.type           && { icon: 'home_work',   label: 'Type',     val: property.type?.replace(/_/g, ' ') },
                ].filter(Boolean).map(d => (
                  <div key={d.label} className="text-center">
                    <span className="material-icons-outlined text-[#4900e5] text-xl">{d.icon}</span>
                    <p className="font-semibold text-slate-800 text-sm capitalize mt-0.5">{d.val}</p>
                    <p className="text-xs text-slate-400">{d.label}</p>
                  </div>
                ))}
              </div>

              {property.description && (
                <>
                  <h2 className="font-montserrat font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wide">About This Property</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">{property.description}</p>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Bank info */}
            {property.bankName && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <h3 className="font-montserrat font-semibold text-slate-800 mb-3 text-sm">Bank / Lender</h3>
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="material-icons-outlined text-amber-600 text-xl">account_balance</span>
                  <span className="font-semibold text-slate-800 text-sm">{property.bankName}</span>
                </div>
                {isGuest ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="material-icons-outlined text-slate-300 text-lg">call</span>
                      <LockedField placeholder="+91 •••••  •••••" onUnlock={() => setShowLogin(true)} />
                    </div>
                    <button onClick={() => setShowLogin(true)}
                      className="w-full py-2 rounded-xl border border-dashed border-[#4900e5]/40 text-[#4900e5] text-xs font-semibold hover:bg-[#4900e5]/5 transition flex items-center justify-center gap-1">
                      <span className="material-icons-outlined text-sm">lock_open</span>
                      Login to contact bank
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">Contact your branch for bid registration details.</p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
              <button
                onClick={() => setShowEnquiry(true)}
                className="w-full py-3 px-4 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">contact_support</span>
                Enquire About This Property
              </button>
              <button
                onClick={() => isGuest ? setShowLogin(true) : navigate(`/buyer/visit/${property._id}`, {
                  state: { propertyTitle: property.title, city: property.city, area: property.area, propertyModel: 'MortgageProperty' },
                })}
                className="w-full py-2.5 px-4 rounded-xl border border-[#4900e5] text-[#4900e5] font-semibold text-sm hover:bg-[#4900e5]/5 transition flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">event</span>
                Schedule Site Visit
              </button>
              {isGuest && (
                <button onClick={() => setShowLogin(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#4900e5] text-[#4900e5] font-semibold text-sm hover:bg-[#4900e5]/5 transition">
                  Sign In to Track Auction
                </button>
              )}
              <p className="text-xs text-slate-400 text-center">Our team will reach out with auction details and bidding support.</p>
            </div>

            {/* Property info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-montserrat font-semibold text-slate-800 mb-3 text-sm">Property Info</h3>
              {[
                property.type        && { label: 'Type',      value: property.type?.replace(/_/g, ' '), locked: false },
                property.status      && { label: 'Status',    value: STATUS_LABEL[property.status] || property.status, locked: false },
                property.auctionDate && { label: 'Auction',   value: new Date(property.auctionDate).toLocaleDateString('en-IN'), locked: false },
                property.pincode     && { label: 'Pincode',   value: property.pincode, locked: isGuest },
              ].filter(Boolean).map(r => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400">{r.label}</span>
                  {r.locked
                    ? <LockedField placeholder="••••••" onUnlock={() => setShowLogin(true)} />
                    : <span className="text-xs font-semibold text-slate-800 capitalize">{r.value}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}

      {showEnquiry && (
        <EnquiryModal
          onClose={() => setShowEnquiry(false)}
          property={{ _id: property._id, _model: 'MortgageProperty', title: property.title, city: property.city, area: property.area }}
        />
      )}
    </>
  );
}
