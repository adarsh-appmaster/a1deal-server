import { useState } from 'react';

const UNITS = [
  { id: 'SPA-101', project: 'Skyline Phase 3', floor: 1, type: '2BHK', sqft: 1050, price: '₹1.8 Cr', status: 'Available' },
  { id: 'SPA-102', project: 'Skyline Phase 3', floor: 1, type: '2BHK', sqft: 1050, price: '₹1.8 Cr', status: 'Booked' },
  { id: 'SPA-201', project: 'Skyline Phase 3', floor: 2, type: '3BHK', sqft: 1450, price: '₹2.4 Cr', status: 'Available' },
  { id: 'SPA-301', project: 'Skyline Phase 3', floor: 3, type: '3BHK', sqft: 1450, price: '₹2.5 Cr', status: 'Sold' },
  { id: 'HZB-101', project: 'Horizon Towers B', floor: 1, type: '1BHK', sqft: 650, price: '₹75 L', status: 'Available' },
  { id: 'HZB-201', project: 'Horizon Towers B', floor: 2, type: '2BHK', sqft: 1100, price: '₹1.1 Cr', status: 'Sold' },
  { id: 'GVE-01', project: 'Green Valley Ext.', floor: 0, type: 'Villa', sqft: 2200, price: '₹3.8 Cr', status: 'Available' },
];

const STATUS_COLOR = {
  Available: 'bg-emerald-100 text-emerald-800',
  Booked: 'bg-amber-100 text-amber-800',
  Sold: 'bg-gray-100 text-gray-600',
};

export default function InventoryTracking() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? UNITS : UNITS.filter(u => u.status.toLowerCase() === filter);
  const counts = { available: UNITS.filter(u => u.status === 'Available').length, booked: UNITS.filter(u => u.status === 'Booked').length, sold: UNITS.filter(u => u.status === 'Sold').length };

  return (
    <div className="space-y-5">
      <h1 className="font-montserrat font-bold text-2xl text-on-surface">Inventory Tracking</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available', count: counts.available, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Booked', count: counts.booked, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Sold', count: counts.sold, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className={`font-montserrat font-bold text-3xl ${s.color}`}>{s.count}</p>
            <p className="text-xs text-on-surface-variant mt-1">{s.label} Units</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all','available','booked','sold'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            {f === 'all' ? 'All Units' : f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              {['Unit ID','Project','Floor','Type','Sqft','Price','Status','Action'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-on-surface">{u.id}</td>
                <td className="px-4 py-3 text-on-surface-variant">{u.project}</td>
                <td className="px-4 py-3 text-on-surface-variant">{u.floor === 0 ? 'G' : u.floor}</td>
                <td className="px-4 py-3 text-on-surface">{u.type}</td>
                <td className="px-4 py-3 text-on-surface-variant">{u.sqft.toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold text-on-surface">{u.price}</td>
                <td className="px-4 py-3">
                  <span className={`portal-badge text-xs ${STATUS_COLOR[u.status]}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-primary-container text-xs font-semibold hover:underline">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
