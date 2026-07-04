import { useState } from 'react';

const LEADS = [
  { id: 1, name: 'Rajesh Gupta', phone: '+91 98765 43210', requirement: '3BHK, Bandra West', budget: '₹2-3 Cr', source: 'Portal', stage: 'Site Visit', assignedTo: 'Kavita Shah', priority: 'High', lastContact: '2h ago' },
  { id: 2, name: 'Sunita Rao', phone: '+91 87654 32109', requirement: 'Villa, Whitefield', budget: '₹3.5-5 Cr', source: 'Referral', stage: 'Negotiation', assignedTo: 'Rohan Desai', priority: 'High', lastContact: '4h ago' },
  { id: 3, name: 'Mohan Das', phone: '+91 76543 21098', requirement: '2BHK, Koramangala', budget: '₹1-1.5 Cr', source: 'Website', stage: 'Contacted', assignedTo: 'Kavita Shah', priority: 'Medium', lastContact: '1d ago' },
  { id: 4, name: 'Poonam Singh', phone: '+91 65432 10987', requirement: 'Plot, Lonavala', budget: '₹50-75 L', source: 'Advertisement', stage: 'New', assignedTo: 'Unassigned', priority: 'Low', lastContact: 'Not yet' },
  { id: 5, name: 'Arvind Kumar', phone: '+91 54321 09876', requirement: 'Penthouse, Worli', budget: '₹10-15 Cr', source: 'Direct', stage: 'Contacted', assignedTo: 'Rohan Desai', priority: 'High', lastContact: '6h ago' },
];

const STAGE_COLOR = { New: 'bg-blue-100 text-blue-800', Contacted: 'bg-indigo-100 text-indigo-800', 'Site Visit': 'bg-amber-100 text-amber-800', Negotiation: 'bg-orange-100 text-orange-800', Closed: 'bg-emerald-100 text-emerald-800' };
const PRIORITY_COLOR = { High: 'bg-red-100 text-red-800', Medium: 'bg-amber-100 text-amber-800', Low: 'bg-gray-100 text-gray-600' };

export default function LeadManagement() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? LEADS : LEADS.filter(l => l.stage.toLowerCase().replace(' ', '-') === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Lead Management</h1>
        <button className="btn-primary text-sm">+ New Lead</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all','new','contacted','site-visit','negotiation','closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            {f === 'all' ? 'All Leads' : f.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              {['Lead','Phone','Requirement','Budget','Source','Stage','Assigned','Priority','Last Contact',''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-3 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.map(l => (
              <tr key={l.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-3 py-3 font-semibold text-on-surface whitespace-nowrap">{l.name}</td>
                <td className="px-3 py-3 text-on-surface-variant whitespace-nowrap">{l.phone}</td>
                <td className="px-3 py-3 text-on-surface-variant">{l.requirement}</td>
                <td className="px-3 py-3 font-semibold text-on-surface whitespace-nowrap">{l.budget}</td>
                <td className="px-3 py-3 text-on-surface-variant">{l.source}</td>
                <td className="px-3 py-3"><span className={`portal-badge text-xs ${STAGE_COLOR[l.stage]}`}>{l.stage}</span></td>
                <td className="px-3 py-3 text-on-surface-variant text-xs">{l.assignedTo}</td>
                <td className="px-3 py-3"><span className={`portal-badge text-xs ${PRIORITY_COLOR[l.priority]}`}>{l.priority}</span></td>
                <td className="px-3 py-3 text-on-surface-variant text-xs whitespace-nowrap">{l.lastContact}</td>
                <td className="px-3 py-3">
                  <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span className="material-icons-outlined text-base">more_vert</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
