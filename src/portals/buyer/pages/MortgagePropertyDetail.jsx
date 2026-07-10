import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import EnquiryModal from '../../../components/common/EnquiryModal';
import ShareWhatsappButton from '../../../components/common/ShareWhatsappButton';
import ImageSlider from '../../../components/common/ImageSlider';

const STATUS_COLOR = {
  available:     'bg-emerald-100 text-emerald-800',
  under_process: 'bg-amber-100 text-amber-800',
  sold:          'bg-slate-100 text-slate-600',
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

function typeLabel(p) {
  if (!p?.type) return '';
  return p.type === 'other' ? (p.customType || 'Other') : p.type.replace(/_/g, ' ');
}

function LockedField({ placeholder, onUnlock }) {
  return (
    <button type="button" onClick={onUnlock}
      className="relative inline-flex items-center gap-1 group">
      <span className="blur-sm select-none text-slate-700 text-sm font-medium pointer-events-none">
        {placeholder || '••••••••'}
      </span>
      <span className="absolute inset-0 flex items-center justify-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition bg-white/60 rounded px-1">
        <span className="material-icons-outlined text-sm">lock_open</span>
        Login
      </span>
      <span className="material-icons-outlined text-sm text-slate-400 group-hover:text-primary transition">lock</span>
    </button>
  );
}

function LoginPrompt({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-icons-outlined text-primary text-2xl">lock</span>
        </div>
        <h3 className="font-montserrat font-bold text-lg text-slate-800 mb-2">Sign in to unlock full details</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Create a free account to view pincode, auction schedule, and contact the bank directly.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/signup')}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition">
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
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => {
    setLoading(true);
    setShowAllPhotos(false);
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
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">
          Back to Property Deals
        </button>
      </div>
    );
  }

  const location = [property.area, property.city].filter(Boolean).join(', ');

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 pb-24 sm:pb-8">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
          <span className="material-icons-outlined text-sm">arrow_back</span>Back
        </button>

        {isGuest && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">
            <span className="material-icons-outlined text-amber-600 text-base">info</span>
            <span className="text-amber-800 flex-1">Some details are hidden. <strong>Sign in to see full property information.</strong></span>
            <button onClick={() => setShowLogin(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container transition">
              Sign In
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media gallery — every photo and the video shown at once, no slider */}
            <div className="rounded-2xl border border-slate-100 bg-white p-3 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[property.status] || 'bg-slate-100 text-slate-600'}`}>
                  {STATUS_LABEL[property.status] || property.status}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 capitalize">
                  {typeLabel(property) || 'Bank Repo'}
                </span>
              </div>
              {(property.images?.length || property.video) ? (() => {
                const images = property.images || [];
                const VISIBLE_LIMIT = 4;
                const visibleImages = showAllPhotos ? images : images.slice(0, VISIBLE_LIMIT);
                const remaining = images.length - VISIBLE_LIMIT;
                return (
                  <>
                    {/* Mobile: swipeable slider (video appended as last slide) */}
                    <div className="sm:hidden -mx-3 -mb-3">
                      <ImageSlider
                        images={images}
                        video={property.video}
                        alt={property.title}
                        className="h-72"
                        imgClassName={isGuest ? 'blur-lg scale-110' : ''}
                        overlay={isGuest ? (
                          <button type="button" onClick={() => setShowLogin(true)}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 hover:bg-black/40 transition z-10">
                            <span className="material-icons-outlined text-white text-4xl drop-shadow">lock</span>
                            <span className="text-white text-sm font-semibold drop-shadow">Sign in to view photos & video</span>
                          </button>
                        ) : null}
                      />
                    </div>

                    {/* Tablet/desktop: full grid gallery, everything visible at once */}
                    <div className="relative hidden sm:block">
                      <div className={`grid grid-cols-2 gap-3 ${isGuest ? 'blur-lg scale-105' : ''}`}>
                        {property.video && (
                          <video src={property.video} controls={!isGuest} className="w-full h-80 lg:h-[28rem] object-cover rounded-xl bg-black col-span-2" />
                        )}
                        {visibleImages.map((img, i) => {
                          const isLastVisible = !showAllPhotos && remaining > 0 && i === visibleImages.length - 1;
                          return (
                            <div key={i} className="relative">
                              <img src={img} alt={`${property.title} photo ${i + 1}`} className="w-full h-80 lg:h-[28rem] object-cover rounded-xl" />
                              {isLastVisible && !isGuest && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllPhotos(true)}
                                  className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 hover:bg-black/60 transition rounded-xl text-white font-bold text-lg"
                                >
                                  +{remaining} more
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {!isGuest && showAllPhotos && images.length > VISIBLE_LIMIT && (
                        <button
                          type="button"
                          onClick={() => setShowAllPhotos(false)}
                          className="mt-3 w-full py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                          Show fewer photos
                        </button>
                      )}
                      {isGuest && (
                        <button type="button" onClick={() => setShowLogin(true)}
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 hover:bg-black/40 transition z-10 rounded-xl">
                          <span className="material-icons-outlined text-white text-4xl drop-shadow">lock</span>
                          <span className="text-white text-sm font-semibold drop-shadow">Sign in to view photos & video</span>
                        </button>
                      )}
                    </div>
                  </>
                );
              })() : (
                <div className="h-64 sm:h-80 lg:h-[28rem] flex items-center justify-center bg-surface-container-high rounded-xl">
                  <span className="material-icons-outlined text-6xl text-on-surface-variant/20">account_balance</span>
                </div>
              )}
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

              {/* Extra expected prices by locality/area */}
              {property.localityPrices?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Expected Prices by Locality</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {property.localityPrices.map((lp, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                        <span className="text-sm text-slate-600">
                          {[lp.area, lp.pincode].filter(Boolean).join(' · ') || 'Other locality'}
                        </span>
                        <span className="font-montserrat font-bold text-sm text-slate-800">{formatPrice(lp.expectedPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 bg-slate-50 rounded-xl">
                {[
                  property.bedrooms  > 0 && { icon: 'bed',         label: 'Bedrooms', val: `${property.bedrooms} BHK` },
                  property.area_sqft > 0 && { icon: 'square_foot', label: 'Area',     val: `${property.area_sqft.toLocaleString()} sqft` },
                  property.bankName       && { icon: 'account_balance', label: 'Bank', val: property.bankName },
                  property.type           && { icon: 'home_work',   label: 'Type',     val: typeLabel(property) },
                ].filter(Boolean).map(d => (
                  <div key={d.label} className="text-center">
                    <span className="material-icons-outlined text-primary text-xl">{d.icon}</span>
                    <p className="font-semibold text-slate-800 text-sm capitalize mt-0.5">{d.val}</p>
                    <p className="text-xs text-slate-400">{d.label}</p>
                  </div>
                ))}
              </div>

              {property.description && (
                <>
                  <h2 className="font-montserrat font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wide">About This Property</h2>
                   <p className="text-on-surface-variant text-sm leading-relaxed">{property.description}</p>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* CTA */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
              <button
                onClick={() => setShowEnquiry(true)}
                className="w-full py-3 px-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">contact_support</span>
                Enquire About This Property
              </button>
              <button
                onClick={() => isGuest ? setShowLogin(true) : navigate(`/buyer/visit/${property._id}`, {
                  state: { propertyTitle: property.title, city: property.city, area: property.area, propertyModel: 'MortgageProperty' },
                })}
                className="w-full py-2.5 px-4 rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">event</span>
                Schedule Site Visit
              </button>
              <ShareWhatsappButton property={property} path={`/buyer/mortgage/${property._id}`} className="w-full" />
              <p className="text-xs text-slate-400 text-center">Our team will reach out with auction details and bidding support.</p>
            </div>

            {/* Property info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-montserrat font-semibold text-slate-800 mb-3 text-sm">Property Info</h3>
              {[
                property.type        && { label: 'Type',      value: typeLabel(property), locked: false },
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

      {/* Sticky mobile CTA bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-3 py-2.5 flex items-center gap-2">
        <ShareWhatsappButton property={property} path={`/buyer/mortgage/${property._id}`} iconOnly className="flex-shrink-0" />
        <button
          onClick={() => setShowEnquiry(true)}
          className="flex-1 py-2.5 rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition">
          Enquire
        </button>
        <button
          onClick={() => isGuest ? setShowLogin(true) : navigate(`/buyer/visit/${property._id}`, {
            state: { propertyTitle: property.title, city: property.city, area: property.area, propertyModel: 'MortgageProperty' },
          })}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition flex items-center justify-center gap-1.5">
          {isGuest && <span className="material-icons-outlined text-sm">lock</span>}
          Schedule Visit
        </button>
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
