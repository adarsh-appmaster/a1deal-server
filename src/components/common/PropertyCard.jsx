import { useNavigate } from 'react-router-dom';
import ImageSlider from './ImageSlider';
import ShareWhatsappButton from './ShareWhatsappButton';
import { getStartingPrice, formatPrice } from '../../utils/pricing';

// One property card, used everywhere a UnitProperty/MortgageProperty is
// rendered as a tile — buyer home, portal-selector landing, search results.
// Behavior (enquire/schedule-visit buttons, share, guest blur, list vs grid
// layout) is opt-in via props so each caller only pays for what it needs.

const CATEGORY = {
  UnitProperty:     { label: 'Property Partner', cls: 'bg-category-partner/10 text-category-partner' },
  MortgageProperty: { label: 'Property Deal',     cls: 'bg-category-deal/10 text-category-deal' },
};

const STATUS = {
  available:         { label: 'Available',     cls: 'bg-status-available/15 text-status-available' },
  under_negotiation:  { label: 'Under Offer',   cls: 'bg-status-negotiation/15 text-status-negotiation' },
  under_auction:      { label: 'Under Auction', cls: 'bg-status-auction/15 text-status-auction' },
  sold:               { label: 'Sold',          cls: 'bg-status-sold/15 text-status-sold' },
  withdrawn:          { label: 'Withdrawn',     cls: 'bg-status-withdrawn/15 text-status-withdrawn' },
};

function locationLine(p) {
  return [p.area, p.city].filter(Boolean).join(', ');
}

export default function PropertyCard({
  property,
  model,
  to,
  variant = 'grid',
  badge,
  showStatus = false,
  blurImages = false,
  showShare = false,
  onEnquire,
  onScheduleVisit,
  onClick,
  className = '',
}) {
  const navigate = useNavigate();
  const _model = model || property._model || 'UnitProperty';
  const isMortgage = _model === 'MortgageProperty';
  const path = to || (isMortgage ? `/buyer/mortgage/${property._id}` : `/buyer/property/${property._id}`);
  const price = isMortgage ? property.price : getStartingPrice(property);
  const category = CATEGORY[_model];
  const status = showStatus ? STATUS[property.status] : null;
  const isList = variant === 'list';
  const hasActions = onEnquire || onScheduleVisit || showShare;

  function handleClick() {
    if (onClick) onClick(property);
    else navigate(path);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      className={`card overflow-hidden cursor-pointer hover:shadow-level-3 hover:-translate-y-1 transition-all duration-200 ${isList ? 'flex' : ''} ${className}`}
    >
      <div className={`relative flex-shrink-0 ${isList ? 'w-44' : ''}`}>
        <ImageSlider
          images={property.images || []}
          alt={property.title}
          className={isList ? 'h-full min-h-[7rem]' : 'h-52'}
          imgClassName={blurImages ? 'blur-md scale-110' : ''}
          interval={2500}
          placeholderIcon={isMortgage ? 'account_balance' : 'apartment'}
          overlay={showShare && !isList ? <ShareWhatsappButton property={property} path={path} iconOnly className="absolute bottom-3 right-3" /> : null}
        />
        {blurImages && property.images?.[0] && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/25 pointer-events-none">
            <span className="material-icons-outlined text-white text-2xl drop-shadow">lock</span>
            <span className="text-white text-[11px] font-semibold drop-shadow">Login to view photos</span>
          </div>
        )}
        {(badge || category) && (
          <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 ${badge?.cls || category.cls}`}>
            {badge?.label || category.label}
          </span>
        )}
        {status && (
          <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 ${status.cls}`}>
            {status.label}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 min-w-0">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 truncate">
          {(isMortgage
            ? (property.type === 'other' ? (property.customType || 'Other') : property.type)
            : property.propertyType?.replace(/_/g, ' ')) || '—'}
          {locationLine(property) && ` · ${locationLine(property)}`}
        </p>
        <h3 className="font-montserrat font-bold text-on-surface mb-1 truncate">{property.title}</h3>
        <p className="text-primary font-bold text-lg mb-1">
          {!isMortgage && 'Units starting '}{formatPrice(price)}
        </p>
        {isMortgage && property.bankName && (
          <p className="text-xs text-on-surface-variant">{property.bankName}</p>
        )}
        {!isMortgage && property.investmentPlan?.enabled && (
          <p className="text-xs text-emerald-700">{property.investmentPlan.returnRatePct}% p.a. · {property.investmentPlan.durationYears} yr</p>
        )}
        {(() => {
          const facts = [
            property.bedrooms > 0 && `${property.bedrooms} BHK`,
            property.bathrooms > 0 && `${property.bathrooms} Bath`,
            (property.areaSqft || property.area_sqft) > 0 && `${(property.areaSqft || property.area_sqft).toLocaleString()} sqft`,
          ].filter(Boolean);
          if (!facts.length && !property.isFeatured) return null;
          return (
            <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-2">
              <span>{facts.join(' · ')}</span>
              {property.isFeatured && (
                <span className="ml-auto text-amber-600 font-semibold flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">star</span>Featured
                </span>
              )}
            </div>
          );
        })()}
        {hasActions && (
          <div className="flex gap-2 mt-3">
            {onEnquire && (
              <button
                onClick={e => { e.stopPropagation(); onEnquire(property); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition"
              >
                Enquire
              </button>
            )}
            {onScheduleVisit && (
              <button
                onClick={e => { e.stopPropagation(); onScheduleVisit(property); }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-primary text-primary text-xs font-semibold hover:bg-primary/5 transition"
              >
                <span className="material-icons-outlined text-sm">event</span>
                Schedule Visit
              </button>
            )}
            {showShare && (onEnquire || onScheduleVisit) && (
              <ShareWhatsappButton property={property} path={path} iconOnly className="flex-shrink-0" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
