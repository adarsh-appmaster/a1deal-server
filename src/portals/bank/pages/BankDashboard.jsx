import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

function fmt(n) {
  const v = Number(n);
  if (!v) return '—';
  return v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : `₹${(v / 100000).toFixed(1)}L`;
}

export default function BankDashboard() {
  const navigate = useNavigate();
  const [leadsCount, setLeadsCount]   = useState(null);
  const [propsCount, setPropsCount]   = useState(null);
  const [auctions, setAuctions]       = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, propsRes, auctionsRes] = await Promise.all([
          api.get('/enquiry/banker-enquiries?page=1&limit=1'),
          api.get('/mortgage-properties?page=1&limit=1'),
          api.get('/mortgage-properties?page=1&limit=3&status=under_auction'),
        ]);
        setLeadsCount(leadsRes.data.summary?.totalEnquiries ?? leadsRes.data.total ?? 0);
        setPropsCount(propsRes.data.total ?? 0);
        setAuctions(auctionsRes.data.properties || []);
      } catch { /* empty */ }
      setLoading(false);
    }
    load();
  }, []);

  const metrics = [
    { label: 'Mortgage Leads',     value: leadsCount ?? '—', icon: 'people',  color: 'text-blue-600' },
    { label: 'Mortgage Properties', value: propsCount ?? '—', icon: 'gavel',  color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Bank Portal Dashboard</h1>
        <p className="text-on-surface-variant text-sm">Mortgage leads & auction management</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="metric-card">
            <div className="flex items-start justify-between mb-3">
              <span className={`material-icons-outlined text-2xl ${m.color}`}>{m.icon}</span>
            </div>
            <p className="font-montserrat font-bold text-2xl text-on-surface">{loading ? '…' : m.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Auction Properties */}
      <div className="card p-5">
        <h2 className="font-montserrat font-semibold text-on-surface mb-4">Upcoming Auctions</h2>
        {loading ? (
          <p className="text-sm text-on-surface-variant text-center py-6">Loading…</p>
        ) : auctions.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-6">No properties under auction right now.</p>
        ) : (
          <div className="space-y-3">
            {auctions.map(a => (
              <div key={a._id} className="p-3 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-on-surface-variant">{a.city}</span>
                </div>
                <p className="text-sm font-semibold text-on-surface mb-1">{a.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold">{fmt(a.price)}</span>
                  {a.auctionDate && (
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">event</span>
                      {new Date(a.auctionDate).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => navigate('/bank/auctions')} className="btn-primary w-full mt-4 text-sm py-2.5">List New Property</button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Manage Auctions', icon: 'gavel', path: '/bank/auctions' },
          { label: 'View All Leads', icon: 'people', path: '/bank/mortgages' },
          { label: 'Loan Approvals', icon: 'fact_check', path: '/bank/approvals' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} className="card p-4 text-center hover:shadow-level-2 transition-shadow">
            <span className="material-icons-outlined text-primary-container text-3xl mb-2 block">{a.icon}</span>
            <p className="text-xs font-semibold text-on-surface">{a.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
