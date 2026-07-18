import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import ImageSlider from '../../../components/common/ImageSlider';
import BackButton from '../../../components/common/BackButton';
import { useAuth } from '../../../context/AuthContext';

function formatPrice(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function DealDeskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/broker/listings/public/${id}`)
      .then(r => setListing(r.data.listing))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">Loading…</div>;

  if (notFound || !listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center text-center">
        <span className="material-icons-outlined text-6xl text-slate-200 mb-4">home_work</span>
        <h2 className="font-montserrat font-bold text-xl text-slate-700 mb-2">Listing not found</h2>
        <button onClick={() => navigate('/buyer/deal-desk')}
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">
          Back to Deal Desk
        </button>
      </div>
    );
  }

  const broker = listing.broker || {};
  const isGuest = !user;
  const phone = broker.phone;
  const waNum = String(phone || '').replace(/[^\d]/g, '');
  const waText = encodeURIComponent(`Hi, I'm interested in your listing "${listing.title}" on A1 Deal.`);
  const location = [listing.address, listing.landmark, listing.city, listing.pincode].filter(Boolean).join(', ');

  const stats = [
    listing.beds > 0 && { icon: 'bed', label: 'Bedrooms', val: `${listing.beds} BHK` },
    listing.baths > 0 && { icon: 'bathtub', label: 'Bathrooms', val: listing.baths },
    listing.sqft > 0 && { icon: 'square_foot', label: 'Area', val: `${Number(listing.sqft).toLocaleString('en-IN')} sqft` },
    listing.floor > 0 && { icon: 'stairs', label: 'Floor', val: listing.floor },
    listing.parking > 0 && { icon: 'local_parking', label: 'Parking', val: listing.parking },
  ].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <BackButton fallback="/buyer/deal-desk" label="Back to Deal Desk" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <ImageSlider images={listing.images || []} alt={listing.title} className="h-80 rounded-2xl overflow-hidden" placeholderIcon="home_work" />

          {listing.video && (
            <video src={listing.video} controls className="w-full rounded-2xl bg-black max-h-[28rem]" />
          )}

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary capitalize">
              {listing.propertyType} · {listing.listingType === 'lease' ? 'For Lease' : 'For Sale'}
            </span>
            <h1 className="font-montserrat font-bold text-2xl text-slate-800 mt-3 mb-1">{listing.title}</h1>
            <p className="text-slate-500 text-sm flex items-center gap-1 mb-4">
              <span className="material-icons-outlined text-sm">location_on</span>{location || '—'}
            </p>
            <p className="text-primary font-bold text-3xl mb-6">{formatPrice(listing.price)}</p>

            {stats.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 bg-slate-50 rounded-xl">
                {stats.map(d => (
                  <div key={d.label} className="text-center">
                    <span className="material-icons-outlined text-primary text-xl">{d.icon}</span>
                    <p className="font-semibold text-slate-800 text-sm capitalize mt-0.5">{d.val}</p>
                    <p className="text-xs text-slate-400">{d.label}</p>
                  </div>
                ))}
              </div>
            )}

            {listing.description && (
              <>
                <h2 className="font-montserrat font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wide">Description</h2>
                <p className="text-slate-600 text-sm leading-relaxed">{listing.description}</p>
              </>
            )}
          </div>
        </div>

        {/* Sidebar — contact broker */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <h3 className="font-montserrat font-semibold text-slate-800">Listed by</h3>
            <p className="text-slate-700 font-semibold">{broker.name || 'Broker'}{broker.city ? ` · ${broker.city}` : ''}</p>
            <p className="text-xs text-slate-400">Direct broker listing — no platform commission.</p>

            {isGuest ? (
              <button onClick={() => navigate('/login')}
                className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-sm">lock_open</span>
                Sign in to contact broker
              </button>
            ) : (
              <div className="space-y-2">
                {phone && (
                  <a href={`tel:${phone}`}
                    className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition flex items-center justify-center gap-2">
                    <span className="material-icons-outlined text-sm">call</span>Call {phone}
                  </a>
                )}
                {phone && (
                  <a href={`https://wa.me/${waNum}?text=${waText}`} target="_blank" rel="noreferrer"
                    className="w-full py-2.5 rounded-xl border border-emerald-500 text-emerald-600 font-semibold text-sm hover:bg-emerald-50 transition flex items-center justify-center gap-2">
                    <span className="material-icons-outlined text-sm">chat</span>WhatsApp
                  </a>
                )}
                {broker.email && (
                  <a href={`mailto:${broker.email}`}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2">
                    <span className="material-icons-outlined text-sm">email</span>Email
                  </a>
                )}
                {!phone && !broker.email && (
                  <p className="text-xs text-slate-400">Contact details not provided.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
