import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

// Large partner card — used in the prominent home-page banner.
function PartnerCard({ partner, label }) {
  if (!partner) return null;
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {partner.logo ? (
        <img src={partner.logo} alt={partner.businessName} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 object-cover" loading="lazy" />
      ) : (
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-icons-outlined text-primary text-2xl">{partner.isMaster ? 'verified' : 'storefront'}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wide leading-tight">{label}</p>
        <p className="font-montserrat font-bold text-slate-800 text-sm sm:text-base truncate leading-tight">{partner.businessName}</p>
        {partner.tagline && <p className="text-xs text-slate-500 truncate leading-tight">{partner.tagline}</p>}
      </div>
    </div>
  );
}

// Small partner row — used in the compact header strip on non-home pages.
function PartnerRow({ partner, label }) {
  if (!partner) return null;
  return (
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      {partner.logo ? (
        <img src={partner.logo} alt={partner.businessName} className="w-8 h-8 rounded-lg flex-shrink-0 object-cover" loading="lazy" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-icons-outlined text-primary text-base">{partner.isMaster ? 'verified' : 'storefront'}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-primary uppercase tracking-wide leading-tight">{label}</p>
        <p className="font-montserrat font-bold text-slate-800 text-xs truncate leading-tight">{partner.businessName}</p>
        {partner.tagline && <p className="text-[10px] text-slate-500 truncate leading-tight">{partner.tagline}</p>}
      </div>
    </div>
  );
}

// "Your area partner" co-branding component.
// - On the home page (variant="hero"): large gradient banner with both logos.
// - Elsewhere (default): compact strip below the header.
export default function CoBrandStrip({ className = '', variant = 'strip' }) {
  const { user } = useAuth();
  const [coBrand, setCoBrand] = useState(null);
  const [brokerBrand, setBrokerBrand] = useState(null);
  const [masterBrand, setMasterBrand] = useState(null);

  useEffect(() => {
    const pin = user?.pincode || '';
    api.get(`/broker-card/branding?pincode=${encodeURIComponent(pin)}`)
      .then((r) => {
        setCoBrand(r.data.branding);
        setBrokerBrand(r.data.brokerBranding);
        setMasterBrand(r.data.masterBranding);
      })
      .catch(() => { setCoBrand(null); setBrokerBrand(null); setMasterBrand(null); });
  }, [user?.pincode, user?.id]);

  const hasDual = brokerBrand && masterBrand;
  const hasSingle = coBrand && !hasDual;

  if (!hasDual && !hasSingle) return null;

  // ─── Hero variant: prominent banner for the home page ────────────────
  if (variant === 'hero') {
    const primary = masterBrand || brokerBrand || coBrand;
    const cardSlug = primary?.slug || coBrand?.slug;

    return (
      <div className={`max-w-container mx-auto px-4 sm:px-6 pt-4 ${className}`}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-white to-primary/10 border border-primary/10 shadow-sm">
          {/* Decorative dot */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5" />

          <div className="relative px-5 py-4 sm:px-6 sm:py-5">
            {hasDual ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <PartnerCard partner={masterBrand} label="Master Broker" />
                <div className="hidden sm:block w-px h-12 bg-slate-200 flex-shrink-0" />
                <div className="sm:hidden w-full h-px bg-slate-200" />
                <PartnerCard partner={brokerBrand} label="Your Area Partner" />
              </div>
            ) : (
              <PartnerCard
                partner={coBrand}
                label={`Your area partner${coBrand.isMaster ? ' · Master Broker' : ''}`}
              />
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">Powered by A1 Deal</p>
              {cardSlug && (
                <a href={`/b/${cardSlug}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition">
                  <span className="material-icons-outlined text-sm">badge</span>
                  View Profile
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Strip variant: compact bar for non-home pages ───────────────────
  return (
    <div className={`max-w-container mx-auto px-4 sm:px-6 pt-4 ${className}`}>
      <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm ${hasDual ? 'flex-col sm:flex-row sm:items-center' : ''}`}>
        {hasDual ? (
          <>
            <PartnerRow partner={masterBrand} label="Master Broker" />
            <div className="hidden sm:block w-px h-8 bg-slate-200 flex-shrink-0" />
            <PartnerRow partner={brokerBrand} label="Your Area Partner" />
          </>
        ) : (
          <PartnerRow partner={coBrand} label={`Your area partner${coBrand.isMaster ? ' · Master Broker' : ''}`} />
        )}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 sm:ml-auto">
          <p className="text-[10px] text-slate-400">Powered by A1 Deal</p>
          {coBrand?.slug && (
            <a href={`/b/${coBrand.slug}`} target="_blank" rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition">
              View Card
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
