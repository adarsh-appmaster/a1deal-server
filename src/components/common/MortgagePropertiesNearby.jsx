import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function MortgagePropertiesNearby({ portalColor = '#451886' }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mortgage-properties')
      .then(({ data }) => setProperties(data.properties))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-24">
      <span className="material-icons-outlined text-2xl animate-spin" style={{ color: portalColor }}>progress_activity</span>
    </div>
  );

  if (properties.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-icons-outlined" style={{ color: portalColor }}>home_work</span>
        <h2 className="font-montserrat font-semibold text-on-surface">Mortgage Properties Near You</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {properties.map(p => (
          <div key={p._id} className="card p-4 space-y-3 hover:shadow-level-2 transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-on-surface text-sm leading-tight">{p.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{p.bankName || 'Bank Listed'}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={{ background: `${portalColor}18`, color: portalColor }}>
                {p.type}
              </span>
            </div>
            <div className="text-xs text-on-surface-variant space-y-0.5">
              <p className="flex items-center gap-1">
                <span className="material-icons-outlined text-xs">location_on</span>
                {[p.city, p.area, p.pincode].filter(Boolean).join(', ')}
              </p>
              <p className="flex items-center gap-1">
                <span className="material-icons-outlined text-xs">currency_rupee</span>
                {Number(p.price).toLocaleString('en-IN')}
              </p>
              {p.bedrooms && (
                <p className="flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">bed</span>
                  {p.bedrooms} BHK
                </p>
              )}
              {p.auctionDate && (
                <p className="flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">event</span>
                  Auction: {new Date(p.auctionDate).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
            {p.contactPhone && (
              <a
                href={`tel:${p.contactPhone}`}
                className="flex items-center gap-2 py-2 px-3 rounded-xl border text-sm font-semibold transition hover:opacity-80"
                style={{ borderColor: portalColor, color: portalColor }}
              >
                <span className="material-icons-outlined text-sm">call</span>
                {p.contactPhone}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
