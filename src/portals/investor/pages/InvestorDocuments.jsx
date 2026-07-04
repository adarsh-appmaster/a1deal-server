import { useState } from 'react';

const DOCS = [
  { id: 1, name: 'Investment Agreement – Skyline Ph4', category: 'Agreements', property: 'Skyline Phase 4', date: 'Mar 15, 2024', size: '2.4 MB', type: 'pdf' },
  { id: 2, name: 'Investment Agreement – TechPark Hub', category: 'Agreements', property: 'TechPark Hub', date: 'Jun 1, 2024', size: '1.9 MB', type: 'pdf' },
  { id: 3, name: 'Share Certificate – Green Valley Ph2', category: 'Certificates', property: 'Green Valley Ph2', date: 'Jan 10, 2025', size: '0.8 MB', type: 'pdf' },
  { id: 4, name: 'NOC – Marina Waterfront', category: 'Property Papers', property: 'Marina Waterfront', date: 'Feb 28, 2025', size: '1.1 MB', type: 'pdf' },
  { id: 5, name: 'Form 26AS – FY 2025-26', category: 'Tax Documents', property: 'All', date: 'Apr 30, 2026', size: '0.5 MB', type: 'pdf' },
  { id: 6, name: 'TDS Certificate Q4 FY26', category: 'Tax Documents', property: 'All', date: 'May 15, 2026', size: '0.3 MB', type: 'pdf' },
  { id: 7, name: 'Title Deed – Skyline Ph4', category: 'Property Papers', property: 'Skyline Phase 4', date: 'Mar 20, 2024', size: '4.2 MB', type: 'pdf' },
  { id: 8, name: 'Quarterly Statement Q1 2026', category: 'Statements', property: 'All', date: 'Apr 5, 2026', size: '1.3 MB', type: 'xlsx' },
  { id: 9, name: 'KYC Verification Letter', category: 'Certificates', property: 'N/A', date: 'Jan 5, 2024', size: '0.2 MB', type: 'pdf' },
];

const CATEGORIES = ['All', 'Agreements', 'Certificates', 'Tax Documents', 'Property Papers', 'Statements'];

const TYPE_ICON = { pdf: { icon: 'picture_as_pdf', color: 'text-rose-500 bg-rose-50' }, xlsx: { icon: 'table_chart', color: 'text-emerald-600 bg-emerald-50' } };

export default function InvestorDocuments() {
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = DOCS
    .filter(d => cat === 'All' || d.category === cat)
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.property.toLowerCase().includes(search.toLowerCase()));

  const grouped = CATEGORIES.slice(1).reduce((acc, c) => {
    const docs = filtered.filter(d => d.category === c);
    if (docs.length) acc[c] = docs;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Documents</h1>
          <p className="text-on-surface-variant text-sm mt-1">All your investment agreements, certificates, and tax documents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b5e20] text-white text-sm font-semibold hover:bg-[#2e7d32] transition">
          <span className="material-icons-outlined text-base">upload</span>
          Upload Document
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${cat === c ? 'bg-[#1b5e20] text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped documents */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12 text-on-surface-variant">
          <span className="material-icons-outlined text-3xl mb-2">folder_open</span>
          <p>No documents found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(cat === 'All' ? Object.entries(grouped) : [[cat, filtered]]).map(([category, docs]) => (
            <div key={category}>
              <h2 className="font-montserrat font-semibold text-sm text-on-surface-variant uppercase tracking-wide mb-3">{category}</h2>
              <div className="card divide-y divide-outline-variant overflow-hidden">
                {docs.map(doc => {
                  const ti = TYPE_ICON[doc.type] || TYPE_ICON.pdf;
                  return (
                    <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ti.color}`}>
                        <span className="material-icons-outlined text-xl">{ti.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-surface text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-on-surface-variant">{doc.property} · {doc.date} · {doc.size}</p>
                      </div>
                      <button className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline flex-shrink-0">
                        <span className="material-icons-outlined text-base">download</span>
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
