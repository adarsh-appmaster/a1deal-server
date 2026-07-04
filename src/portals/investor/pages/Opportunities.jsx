import { useState } from 'react';

const OPP = [
  { id: 1, name: 'Skyline Phase 5', location: 'Bandra West, Mumbai', type: 'Residential', roi: '18.4%', minInv: '₹25 L', totalSize: '₹120 Cr', filled: 68, timeline: '36 months', risk: 'Low', tag: 'Hot' },
  { id: 2, name: 'TechPark Commercial Hub', location: 'Whitefield, Bangalore', type: 'Commercial', roi: '22.1%', minInv: '₹50 L', totalSize: '₹280 Cr', filled: 45, timeline: '48 months', risk: 'Medium', tag: 'New' },
  { id: 3, name: 'Green Valley Phase 3', location: 'Baner, Pune', type: 'Residential', roi: '15.8%', minInv: '₹15 L', totalSize: '₹85 Cr', filled: 82, timeline: '24 months', risk: 'Low', tag: null },
  { id: 4, name: 'Marina Waterfront', location: 'OMR, Chennai', type: 'Mixed Use', roi: '19.7%', minInv: '₹35 L', totalSize: '₹200 Cr', filled: 31, timeline: '42 months', risk: 'Medium', tag: 'New' },
  { id: 5, name: 'Luxury Villas Goa', location: 'Anjuna, Goa', type: 'Luxury', roi: '26.3%', minInv: '₹1 Cr', totalSize: '₹75 Cr', filled: 15, timeline: '18 months', risk: 'High', tag: 'Premium' },
  { id: 6, name: 'Industrial Warehousing', location: 'Bhiwandi, Mumbai', type: 'Industrial', roi: '14.2%', minInv: '₹40 L', totalSize: '₹180 Cr', filled: 91, timeline: '60 months', risk: 'Low', tag: null },
];

const RISK_COLOR = { Low: 'text-emerald-600 bg-emerald-50', Medium: 'text-amber-600 bg-amber-50', High: 'text-rose-600 bg-rose-50' };
const TAG_COLOR = { Hot: 'bg-rose-500 text-white', New: 'bg-blue-500 text-white', Premium: 'bg-amber-500 text-white' };

export default function Opportunities() {
  const [typeFilter, setTypeFilter] = useState('All');
  const types = ['All', ...new Set(OPP.map(o => o.type))];
  const filtered = typeFilter === 'All' ? OPP : OPP.filter(o => o.type === typeFilter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Investment Opportunities</h1>
        <p className="text-on-surface-variant text-sm mt-1">Curated high-yield real estate projects open for investment</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${typeFilter === t ? 'bg-[#1b5e20] text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(o => (
          <div key={o.id} className="card p-5 hover:shadow-level-3 hover:-translate-y-0.5 transition-all duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg">{o.type}</span>
              {o.tag && <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${TAG_COLOR[o.tag]}`}>{o.tag}</span>}
            </div>

            <h3 className="font-montserrat font-bold text-on-surface mb-0.5">{o.name}</h3>
            <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-1">
              <span className="material-icons-outlined text-sm">location_on</span>{o.location}
            </p>

            {/* ROI callout */}
            <div className="bg-[#1b5e20]/8 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant">Expected ROI</p>
                <p className="font-montserrat font-bold text-2xl text-[#1b5e20]">{o.roi}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">Min. Investment</p>
                <p className="font-bold text-on-surface">{o.minInv}</p>
              </div>
            </div>

            {/* Fill bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
                <span>Funding raised</span>
                <span className="font-semibold text-on-surface">{o.filled}% of {o.totalSize}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-[#1b5e20] rounded-full transition-all" style={{ width: `${o.filled}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mb-4">
              <span className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-icons-outlined text-sm">schedule</span>{o.timeline}
              </span>
              <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${RISK_COLOR[o.risk]}`}>{o.risk} Risk</span>
            </div>

            <button className="w-full py-2.5 rounded-xl bg-[#1b5e20] text-white text-sm font-bold hover:bg-[#2e7d32] transition">
              Invest Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
