import { useState } from 'react';

const PROJECTS = [
  { id: 1, name: 'Skyline Phase 3', city: 'Mumbai', type: 'Residential', units: 240, sold: 180, price: '₹1.8-3.2 Cr', status: 'Active', rera: 'P51900027780' },
  { id: 2, name: 'Green Valley Ext.', city: 'Bangalore', type: 'Villa', units: 120, sold: 45, price: '₹2.5-4.5 Cr', status: 'Delayed', rera: 'PRM/KA/RERA/1251/309/PR' },
  { id: 3, name: 'Horizon Towers B', city: 'Pune', type: 'Residential', units: 300, sold: 220, price: '₹75L-1.5 Cr', status: 'Active', rera: 'P52100000977' },
  { id: 4, name: 'Marina Residences', city: 'Chennai', type: 'Mixed Use', units: 180, sold: 30, price: '₹90L-2 Cr', status: 'Planning', rera: 'Pending' },
  { id: 5, name: 'Central Park Towers', city: 'Hyderabad', type: 'Commercial', units: 90, sold: 60, price: '₹3-8 Cr', status: 'Active', rera: 'P02400004312' },
];

export default function ProjectList() {
  const [search, setSearch] = useState('');

  const filtered = PROJECTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Projects</h1>
        <button className="btn-primary text-sm">+ Add Project</button>
      </div>

      <div className="card p-5">
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
            <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant">
                {['Project','City','Type','Units','Sold','Price Range','RERA','Status',''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide pb-3 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3 pr-4 font-semibold text-on-surface">{p.name}</td>
                  <td className="py-3 pr-4 text-on-surface-variant">{p.city}</td>
                  <td className="py-3 pr-4 text-on-surface-variant">{p.type}</td>
                  <td className="py-3 pr-4 text-on-surface">{p.units}</td>
                  <td className="py-3 pr-4 text-on-surface">{p.sold}</td>
                  <td className="py-3 pr-4 text-on-surface">{p.price}</td>
                  <td className="py-3 pr-4 text-xs text-on-surface-variant font-mono">{p.rera}</td>
                  <td className="py-3 pr-4">
                    <span className={`portal-badge text-xs ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : p.status === 'Delayed' ? 'bg-red-100 text-red-800' : p.status === 'Planning' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</span>
                  </td>
                  <td className="py-3">
                    <button className="text-primary-container hover:underline text-xs font-semibold">Edit</button>
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
