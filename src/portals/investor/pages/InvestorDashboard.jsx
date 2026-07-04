import { useNavigate } from 'react-router-dom';

const PORTFOLIO = [
  { property: 'Skyline Residences 3BHK', location: 'Bandra, Mumbai', invested: '₹2.4 Cr', currentValue: '₹2.88 Cr', roi: '+20%', returns: '₹48,000/mo', type: 'Residential', status: 'Rented' },
  { property: 'Commercial Tower Unit 8B', location: 'BKC, Mumbai', invested: '₹8.2 Cr', currentValue: '₹10.1 Cr', roi: '+23.2%', returns: '₹1.2 L/mo', type: 'Commercial', status: 'Leased' },
  { property: 'Green Valley Villa', location: 'Whitefield, Bangalore', invested: '₹3.8 Cr', currentValue: '₹4.15 Cr', roi: '+9.2%', returns: '₹65,000/mo', type: 'Villa', status: 'Rented' },
];

const OPPORTUNITIES = [
  { name: 'Prestige Lakeside Phase 2', location: 'Whitefield, Bangalore', type: 'Residential', minInvest: '₹50 L', projectedROI: '14-18%', available: '12 units' },
  { name: 'Central Park Towers Office', location: 'Hyderabad', type: 'Commercial', minInvest: '₹1.2 Cr', projectedROI: '10-12%', available: '5 units' },
];

export default function InvestorDashboard() {
  const navigate = useNavigate();

  const totalInvested = '₹14.4 Cr';
  const currentValue = '₹17.13 Cr';
  const totalROI = '+18.96%';
  const monthlyReturns = '₹2.13 L';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Investment Portfolio</h1>
          <p className="text-on-surface-variant text-sm">Real-time portfolio valuation and returns</p>
        </div>
        <button onClick={() => navigate('/investor/opportunities')} className="btn-primary text-sm">+ New Investment</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invested', value: totalInvested, icon: 'account_balance_wallet', color: 'text-primary-container' },
          { label: 'Portfolio Value', value: currentValue, icon: 'trending_up', color: 'text-emerald-600' },
          { label: 'Overall ROI', value: totalROI, icon: 'percent', color: 'text-amber-600' },
          { label: 'Monthly Returns', value: monthlyReturns, icon: 'payments', color: 'text-purple-600' },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <span className={`material-icons-outlined text-2xl ${m.color} mb-2 block`}>{m.icon}</span>
            <p className={`font-montserrat font-bold text-2xl ${m.label === 'Overall ROI' ? 'text-emerald-600' : 'text-on-surface'}`}>{m.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Portfolio */}
      <div className="card p-5">
        <h2 className="font-montserrat font-semibold text-on-surface mb-4">My Properties</h2>
        <div className="space-y-4">
          {PORTFOLIO.map((p, i) => (
            <div key={i} className="p-4 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-green-700 text-2xl">{p.type === 'Commercial' ? 'business' : p.type === 'Villa' ? 'villa' : 'apartment'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-on-surface">{p.property}</h3>
                      <p className="text-xs text-on-surface-variant">{p.location} · {p.type}</p>
                    </div>
                    <span className="portal-badge bg-emerald-100 text-emerald-800 text-xs flex-shrink-0">{p.status}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-outline-variant">
                <div>
                  <p className="text-xs text-on-surface-variant">Invested</p>
                  <p className="font-semibold text-sm text-on-surface">{p.invested}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Current Value</p>
                  <p className="font-semibold text-sm text-on-surface">{p.currentValue}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">ROI</p>
                  <p className="font-semibold text-sm text-emerald-600">{p.roi}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Monthly Returns</p>
                  <p className="font-semibold text-sm text-primary-container">{p.returns}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat font-semibold text-on-surface">New Opportunities</h2>
          <button onClick={() => navigate('/investor/opportunities')} className="text-sm text-primary-container font-semibold hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPPORTUNITIES.map((o, i) => (
            <div key={i} className="p-4 rounded-xl border border-outline-variant bg-gradient-to-br from-green-50 to-emerald-50">
              <p className="font-semibold text-on-surface text-sm">{o.name}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{o.location} · {o.type}</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div>
                  <p className="text-xs text-on-surface-variant">Min. Invest</p>
                  <p className="font-semibold text-xs text-on-surface">{o.minInvest}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Proj. ROI</p>
                  <p className="font-semibold text-xs text-emerald-700">{o.projectedROI}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Available</p>
                  <p className="font-semibold text-xs text-on-surface">{o.available}</p>
                </div>
              </div>
              <button className="btn-primary w-full text-xs py-2 mt-3">Express Interest</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
