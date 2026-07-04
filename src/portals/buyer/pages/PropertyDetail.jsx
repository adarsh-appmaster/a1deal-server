import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import EnquiryModal from '../../../components/common/EnquiryModal';

const STATUS_COLOR = {
  available:         'bg-emerald-100 text-emerald-800',
  under_negotiation: 'bg-amber-100 text-amber-800',
  booked:            'bg-violet-100 text-violet-700',
  sold:              'bg-slate-100 text-slate-500',
};
const STATUS_LABEL = {
  available:         'Available',
  under_negotiation: 'Under Offer',
  booked:            'Booked',
  sold:              'Sold',
};

function formatPrice(n) {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const UNIT_STATUS = {
  available:         { label: 'Available',    cls: 'bg-emerald-100 text-emerald-700' },
  under_negotiation: { label: 'Under Offer',  cls: 'bg-amber-100 text-amber-700'    },
  booked:            { label: 'Booked',        cls: 'bg-violet-100 text-violet-700'  },
  sold:              { label: 'Sold',          cls: 'bg-slate-100 text-slate-400'    },
};

const FACING_ICON = { North: '↑', South: '↓', East: '→', West: '←', 'North-East': '↗', 'North-West': '↖', 'South-East': '↘', 'South-West': '↙' };

function UnitCard({ unit, onEnquire }) {
  const st = UNIT_STATUS[unit.status] || UNIT_STATUS.available;
  const isUnavailable = unit.status === 'sold' || unit.status === 'booked';
  return (
    <div className={`rounded-2xl border p-4 transition ${isUnavailable ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-[#4900e5]/30 hover:shadow-sm'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Unit {unit.unitNumber}</p>
          <p className="font-semibold text-slate-800 text-sm mt-0.5">{unit.unitType || 'Unit'}</p>
          {unit.floor != null && (
            <p className="text-xs text-slate-400 mt-0.5">Floor {unit.floor}</p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>
          {st.label}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {unit.areaSqft > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-icons-outlined text-sm text-slate-400">square_foot</span>
            {unit.areaSqft.toLocaleString()} sqft
          </div>
        )}
        {unit.facing && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-icons-outlined text-sm text-slate-400">explore</span>
            {FACING_ICON[unit.facing] || ''} {unit.facing}-facing
          </div>
        )}
        {unit.parking && unit.parking !== 'none' && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-icons-outlined text-sm text-slate-400">local_parking</span>
            {unit.parking.replace('_', ' ')} parking
          </div>
        )}
        {unit.furnishing && unit.furnishing !== 'unfurnished' && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="material-icons-outlined text-sm text-slate-400">weekend</span>
            {unit.furnishing.replace('_', ' ')}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100">
        {unit.price > 0
          ? <p className="font-montserrat font-bold text-[#4900e5]">{formatPrice(unit.price)}</p>
          : <p className="text-xs text-slate-400 italic">Price on request</p>
        }
      </div>

      {unit.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {unit.amenities.slice(0, 3).map(a => (
            <span key={a} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{a}</span>
          ))}
          {unit.amenities.length > 3 && (
            <span className="text-[10px] text-slate-400">+{unit.amenities.length - 3} more</span>
          )}
        </div>
      )}

      {!isUnavailable && onEnquire && (
        <button type="button" onClick={() => onEnquire(unit)}
          className="mt-3 w-full py-1.5 rounded-lg bg-[#4900e5]/8 text-[#4900e5] text-xs font-semibold hover:bg-[#4900e5]/15 transition border border-[#4900e5]/20">
          Enquire for this unit
        </button>
      )}
    </div>
  );
}

function UnitPricingSection({ units, splitMode, onEnquire }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');

  const unitTypes = [...new Set(units.map(u => u.unitType).filter(Boolean))];
  const filtered  = units.filter(u => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (typeFilter   !== 'all' && u.unitType !== typeFilter)   return false;
    return true;
  });

  const available   = units.filter(u => u.status === 'available').length;
  const negotiating = units.filter(u => u.status === 'under_negotiation').length;
  const booked      = units.filter(u => u.status === 'booked').length;
  const sold        = units.filter(u => u.status === 'sold').length;

  // For floor-wise: group by floor
  const floors = splitMode === 'floor_wise'
    ? [...new Set(filtered.map(u => u.floor).filter(f => f != null))].sort((a, b) => a - b)
    : null;

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="font-montserrat font-semibold text-on-surface">Available Units & Pricing</h2>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{available} available</span>
            {negotiating > 0 && <span className="text-amber-600 font-semibold">{negotiating} under offer</span>}
            {booked > 0 && <span className="text-violet-600 font-semibold">{booked} booked</span>}
            {sold > 0 && <span className="text-slate-400">{sold} sold</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'available', 'under_negotiation', 'booked', 'sold'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition
                ${statusFilter === s ? 'bg-[#4900e5] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {s === 'all' ? 'All' : s === 'under_negotiation' ? 'Under Offer' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter pills */}
      {unitTypes.length > 1 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <span className="text-xs text-slate-400 mr-1">Type:</span>
          {['all', ...unitTypes].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition
                ${typeFilter === t ? 'bg-[#4900e5]/10 border-[#4900e5]/30 text-[#4900e5]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">No units match the current filter.</div>
      ) : floors ? (
        // Floor-wise grouped
        <div className="space-y-5">
          {floors.map(floor => {
            const floorUnits = filtered.filter(u => u.floor === floor);
            return (
              <div key={floor}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4900e5]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#4900e5]">{floor}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Floor {floor}</span>
                  <span className="text-xs text-slate-400">· {floorUnits.filter(u => u.status === 'available').length} available</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {floorUnits.map((u, i) => <UnitCard key={u._id || i} unit={u} onEnquire={onEnquire} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // BHK-wise flat grid
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((u, i) => <UnitCard key={u._id || i} unit={u} onEnquire={onEnquire} />)}
        </div>
      )}
    </div>
  );
}

/* ── Login prompt modal ────────────────────────────────────────────────── */
function LoginPrompt({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center"
        onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 rounded-full bg-[#4900e5]/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-icons-outlined text-[#4900e5] text-2xl">lock</span>
        </div>
        <h3 className="font-montserrat font-bold text-lg text-slate-800 mb-2">
          Sign in to unlock full details
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Create a free account to view contact info, schedule site visits and send enquiries directly to the seller.
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
        <button onClick={onClose}
          className="mt-3 text-xs text-slate-400 hover:text-slate-600">
          Continue browsing
        </button>
      </div>
    </div>
  );
}

/* ── Blurred locked field ─────────────────────────────────────────────── */
function LockedField({ value, placeholder, onUnlock, className = '' }) {
  return (
    <button type="button" onClick={onUnlock}
      className={`relative inline-flex items-center gap-1 group ${className}`}>
      <span className="blur-sm select-none text-slate-700 text-sm font-medium pointer-events-none">
        {placeholder || value || '••••••••••'}
      </span>
      <span className="absolute inset-0 flex items-center justify-center gap-1 text-xs font-semibold text-[#4900e5] opacity-0 group-hover:opacity-100 transition bg-white/60 rounded px-1">
        <span className="material-icons-outlined text-sm">lock_open</span>
        Login to view
      </span>
      <span className="material-icons-outlined text-sm text-slate-400 group-hover:text-[#4900e5] transition">lock</span>
    </button>
  );
}

export default function PropertyDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isGuest   = !user;

  const [property, setProperty]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [showEnquiry, setShowEnquiry]   = useState(false);
  const [enquiryUnit, setEnquiryUnit]   = useState(null);
  const [showLogin, setShowLogin]       = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/unit-properties/public/${id}`)
      .then(r => setProperty(r.data.property))
      .catch(err => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]);

  function gatedAction(action) {
    if (isGuest) { setShowLogin(true); return; }
    action();
  }

  if (loading) {
    return (
      <div className="max-w-container mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-6 w-28 bg-slate-100 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-72 bg-slate-100 rounded-2xl" />
            <div className="card p-6 space-y-3">
              <div className="h-5 bg-slate-100 rounded w-3/4" />
              <div className="h-8 bg-slate-100 rounded w-1/2" />
              <div className="h-4 bg-slate-100 rounded w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="card h-48" />
            <div className="card h-36" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="max-w-container mx-auto px-6 py-16 flex flex-col items-center text-center">
        <span className="material-icons-outlined text-6xl text-slate-200 mb-4">home_work</span>
        <h2 className="font-montserrat font-bold text-xl text-slate-700 mb-2">Property not found</h2>
        <p className="text-slate-500 mb-6">This listing may have been removed or is no longer available.</p>
        <button onClick={() => navigate('/buyer/search')}
          className="px-5 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition">
          Back to Search
        </button>
      </div>
    );
  }

  const location = [property.area, property.city].filter(Boolean).join(', ');

  return (
    <>
      <div className="max-w-container mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors">
          <span className="material-icons-outlined text-sm">arrow_back</span>Back to Search
        </button>

        {/* Guest banner */}
        {isGuest && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#4900e5]/8 border border-[#4900e5]/20 text-sm">
            <span className="material-icons-outlined text-[#4900e5] text-base">info</span>
            <span className="text-[#4900e5] flex-1">
              You're browsing as a guest. <strong>Contact details and actions are locked.</strong>
            </span>
            <button onClick={() => setShowLogin(true)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#4900e5] text-white text-xs font-semibold hover:bg-[#6236ff] transition">
              Sign In / Sign Up
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="card overflow-hidden">
              <div className="relative h-72 bg-surface-container-high flex items-center justify-center overflow-hidden">
                {property.images?.[0] ? (
                  <img src={property.images[0]} alt={property.title}
                    className={`w-full h-full object-cover ${isGuest ? 'blur-lg scale-110' : ''}`} />
                ) : (
                  <span className="material-icons-outlined text-8xl text-on-surface-variant/20">apartment</span>
                )}
                {isGuest && property.images?.[0] && (
                  <button type="button" onClick={() => setShowLogin(true)}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 hover:bg-black/40 transition">
                    <span className="material-icons-outlined text-white text-4xl drop-shadow">lock</span>
                    <span className="text-white text-sm font-semibold drop-shadow">Sign in to view photos</span>
                  </button>
                )}
              </div>
              {property.images?.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {property.images.slice(1).map((img, i) => (
                    <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={img} alt="" className={`w-full h-full object-cover ${isGuest ? 'blur-sm' : ''}`} />
                      {isGuest && (
                        <button type="button" onClick={() => setShowLogin(true)}
                          className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="material-icons-outlined text-white text-sm">lock</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  {property.status && (
                    <span className={`portal-badge text-xs mb-2 inline-block ${STATUS_COLOR[property.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABEL[property.status] || property.status}
                    </span>
                  )}
                  <h1 className="font-montserrat font-bold text-2xl text-on-surface">{property.title}</h1>
                  <p className="text-on-surface-variant flex items-center gap-1 mt-1 text-sm">
                    <span className="material-icons-outlined text-sm">location_on</span>
                    {location || '—'}
                    {/* Pincode is locked for guests */}
                    {property.pincode && (
                      isGuest
                        ? <LockedField placeholder="— ——" onUnlock={() => setShowLogin(true)} className="ml-1" />
                        : <span className="ml-1">– {property.pincode}</span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-montserrat font-bold text-3xl text-primary">{formatPrice(property.price)}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 capitalize">
                    {property.listingType?.replace(/_/g, ' ') || 'For Sale'}
                  </p>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 bg-surface-container rounded-xl">
                {[
                  property.bedrooms  > 0 && { icon: 'bed',         label: 'Bedrooms',  val: `${property.bedrooms} BHK` },
                  property.bathrooms > 0 && { icon: 'bathroom',    label: 'Bathrooms', val: property.bathrooms },
                  property.areaSqft  > 0 && { icon: 'square_foot', label: 'Area',      val: `${property.areaSqft.toLocaleString()} sqft` },
                  property.propertyType  && { icon: 'apartment',   label: 'Type',      val: property.propertyType.replace(/_/g, ' ') },
                ].filter(Boolean).map(d => (
                  <div key={d.label} className="text-center">
                    <span className="material-icons-outlined text-primary text-2xl">{d.icon}</span>
                    <p className="font-semibold text-on-surface text-sm capitalize">{d.val}</p>
                    <p className="text-xs text-on-surface-variant">{d.label}</p>
                  </div>
                ))}
              </div>

              {property.description && (
                <>
                  <h2 className="font-montserrat font-semibold text-on-surface mb-2">About This Property</h2>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6">{property.description}</p>
                </>
              )}

              {property.amenities?.length > 0 && (
                <>
                  <h2 className="font-montserrat font-semibold text-on-surface mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map(a => (
                      <span key={a} className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
                        <span className="material-icons-outlined text-primary text-sm">check_circle</span>{a}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Unit Pricing Table ── */}
            {property.unitSplit?.enabled && property.unitSplit.units?.length > 0 && (
              <UnitPricingSection
                units={property.unitSplit.units}
                splitMode={property.unitSplit.splitMode}
                onEnquire={unit => { setEnquiryUnit(unit); setShowEnquiry(true); }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Property info */}
            <div className="card p-5">
              <h3 className="font-montserrat font-semibold text-on-surface mb-4">Property Info</h3>
              {[
                property.ownerType   && { label: 'Owner Type',   value: property.ownerType,   locked: false },
                property.reraNumber  && { label: 'RERA No.',     value: property.reraNumber,  locked: false },
                property.totalUnits  && { label: 'Total Units',  value: property.totalUnits,  locked: false },
                property.totalFloors && { label: 'Total Floors', value: property.totalFloors, locked: false },
                property.sellerName  && { label: 'Seller',       value: property.sellerName,  locked: isGuest },
                property.status      && { label: 'Status',       value: STATUS_LABEL[property.status] || property.status, locked: false },
              ].filter(Boolean).map(r => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b border-outline-variant last:border-0">
                  <span className="text-xs text-on-surface-variant">{r.label}</span>
                  {r.locked
                    ? <LockedField placeholder="••••••••" onUnlock={() => setShowLogin(true)} />
                    : <span className="text-xs font-semibold text-on-surface capitalize">{r.value}</span>
                  }
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="card p-5 space-y-3">
              <button
                onClick={() => gatedAction(() => navigate(`/buyer/visit/${id}`, {
                  state: { propertyTitle: property.title, city: property.city, area: property.area, propertyModel: 'UnitProperty' },
                }))}
                className="w-full py-2.5 px-4 rounded-xl bg-[#4900e5] text-white font-semibold text-sm hover:bg-[#6236ff] transition flex items-center justify-center gap-2">
                {isGuest && <span className="material-icons-outlined text-sm">lock</span>}
                Schedule Site Visit
              </button>
              <button
                onClick={() => { setEnquiryUnit(null); setShowEnquiry(true); }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#4900e5] text-[#4900e5] font-semibold text-sm hover:bg-[#4900e5]/5 transition flex items-center justify-center gap-2">
                Enquire About This Property
              </button>
              <button onClick={() => navigate('/buyer/mortgage')}
                className="w-full text-center py-2.5 px-4 rounded-xl bg-surface-container text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors">
                Check EMI / Mortgage
              </button>
            </div>

            {/* Contact — locked for guests */}
            <div className="card p-5">
              <h3 className="font-montserrat font-semibold text-on-surface mb-3">Contact Seller</h3>
              {isGuest ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="material-icons-outlined text-slate-300 text-xl">call</span>
                    <LockedField placeholder="+91 •••••  •••••" onUnlock={() => setShowLogin(true)} />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="material-icons-outlined text-slate-300 text-xl">email</span>
                    <LockedField placeholder="••••••@•••••.com" onUnlock={() => setShowLogin(true)} />
                  </div>
                  <button onClick={() => setShowLogin(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#4900e5]/40 text-[#4900e5] text-sm font-semibold hover:bg-[#4900e5]/5 transition flex items-center justify-center gap-2">
                    <span className="material-icons-outlined text-sm">lock_open</span>
                    Login to contact seller
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {property.sellerPhone && (
                    <a href={`tel:${property.sellerPhone}`}
                      className="flex items-center gap-2 text-sm text-[#4900e5] font-semibold hover:underline">
                      <span className="material-icons-outlined text-base">call</span>
                      {property.sellerPhone}
                    </a>
                  )}
                  {property.sellerEmail && (
                    <a href={`mailto:${property.sellerEmail}`}
                      className="flex items-center gap-2 text-sm text-slate-500 hover:underline">
                      <span className="material-icons-outlined text-base">email</span>
                      {property.sellerEmail}
                    </a>
                  )}
                  {!property.sellerPhone && !property.sellerEmail && (
                    <p className="text-xs text-slate-400">Contact details not provided</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}

      {showEnquiry && (
        <EnquiryModal
          onClose={() => { setShowEnquiry(false); setEnquiryUnit(null); }}
          preselectedUnit={enquiryUnit}
          property={{
            _id:   property._id,
            _model: 'UnitProperty',
            title:  property.title,
            city:   property.city,
            area:   property.area,
            units:  property.unitSplit?.units || [],
          }}
        />
      )}
    </>
  );
}
