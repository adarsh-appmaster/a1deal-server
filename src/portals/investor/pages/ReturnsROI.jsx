const MONTHLY = [
  { month: 'Jan', returns: 18200, roi: 15.2 },
  { month: 'Feb', returns: 19500, roi: 16.3 },
  { month: 'Mar', returns: 21000, roi: 17.5 },
  { month: 'Apr', returns: 17800, roi: 14.8 },
  { month: 'May', returns: 23400, roi: 19.5 },
  { month: 'Jun', returns: 21300, roi: 17.8 },
];

const PROPERTIES = [
  { name: 'Skyline Phase 4', invested: '₹48 L', currentVal: '₹58.2 L', returns: '₹10.2 L', roi: '+21.3%', monthly: '₹38,500', status: 'Active' },
  { name: 'TechPark Hub', invested: '₹65 L', currentVal: '₹74.1 L', returns: '₹9.1 L', roi: '+14.0%', monthly: '₹42,800', status: 'Active' },
  { name: 'Green Valley Ph2', invested: '₹28 L', currentVal: '₹35.6 L', returns: '₹7.6 L', roi: '+27.1%', monthly: '₹19,200', status: 'Active' },
  { name: 'Marina Waterfront', invested: '₹40 L', currentVal: '₹43.3 L', returns: '₹3.3 L', roi: '+8.2%', monthly: '₹0', status: 'Locked (24 mo)' },
];

const maxRet = Math.max(...MONTHLY.map(m => m.returns));

export default function ReturnsROI() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Returns & ROI</h1>
        <p className="text-on-surface-variant text-sm mt-1">Track your investment returns across all properties</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Returns', value: '₹30.2 L', sub: 'All time', color: 'text-emerald-600' },
          { label: 'Overall ROI', value: '+18.96%', sub: 'vs 12% benchmark', color: 'text-[#1b5e20]' },
          { label: 'Monthly Income', value: '₹2.13 L', sub: 'Avg last 3 months', color: 'text-blue-600' },
          { label: 'Annualised', value: '₹25.6 L', sub: 'Projected FY27', color: 'text-purple-600' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <p className={`font-montserrat font-bold text-xl ${k.color}`}>{k.value}</p>
            <p className="text-sm font-semibold text-on-surface mt-0.5">{k.label}</p>
            <p className="text-xs text-on-surface-variant">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-montserrat font-semibold text-on-surface">Monthly Returns (2026)</h2>
          <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-lg">Jan – Jun</span>
        </div>
        <div className="flex items-end gap-3 h-36">
          {MONTHLY.map(m => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-[#1b5e20]">
                ₹{(m.returns / 1000).toFixed(0)}K
              </span>
              <div
                className="w-full bg-[#1b5e20] rounded-t-lg transition-all hover:bg-[#2e7d32]"
                style={{ height: `${(m.returns / maxRet) * 100}px` }}
              />
              <span className="text-xs text-on-surface-variant">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per property table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant">
          <h2 className="font-montserrat font-semibold text-on-surface">Per Property Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Property</th>
                <th className="text-right px-5 py-3">Invested</th>
                <th className="text-right px-5 py-3 hidden sm:table-cell">Current Value</th>
                <th className="text-right px-5 py-3">Returns</th>
                <th className="text-right px-5 py-3">ROI</th>
                <th className="text-right px-5 py-3 hidden md:table-cell">Monthly</th>
                <th className="text-center px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {PROPERTIES.map(p => (
                <tr key={p.name} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-5 py-4 font-semibold text-on-surface">{p.name}</td>
                  <td className="px-5 py-4 text-right text-on-surface-variant">{p.invested}</td>
                  <td className="px-5 py-4 text-right text-on-surface hidden sm:table-cell">{p.currentVal}</td>
                  <td className="px-5 py-4 text-right font-semibold text-emerald-600">{p.returns}</td>
                  <td className="px-5 py-4 text-right font-bold text-[#1b5e20]">{p.roi}</td>
                  <td className="px-5 py-4 text-right hidden md:table-cell text-on-surface-variant">{p.monthly}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
