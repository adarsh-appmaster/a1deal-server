import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const STATUS_BADGE = {
  active:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700' },
  matured:   { label: 'Matured',  cls: 'bg-blue-100 text-blue-700' },
  withdrawn: { label: 'Withdrawn',cls: 'bg-slate-100 text-slate-600' },
};

export default function MyInvestments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/investments')
      .then(({ data }) => setInvestments(data.investments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalInvested   = investments.reduce((s, i) => s + i.amount, 0);
  const totalExpected   = investments.reduce((s, i) => s + (i.expectedReturn || 0), 0);
  const active          = investments.filter(i => i.status === 'active').length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-icons-outlined text-4xl text-[#1b5e20] animate-spin">progress_activity</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">My Investments</h1>
        <p className="text-on-surface-variant text-sm">Per annum return investments by project / location</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="font-montserrat font-bold text-xl text-[#1b5e20]">
            ₹{(totalInvested / 100000).toFixed(1)} L
          </p>
          <p className="text-sm font-semibold text-on-surface mt-0.5">Total Invested</p>
          <p className="text-xs text-on-surface-variant">{investments.length} investment{investments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-4">
          <p className="font-montserrat font-bold text-xl text-emerald-600">
            ₹{(totalExpected / 100000).toFixed(1)} L
          </p>
          <p className="text-sm font-semibold text-on-surface mt-0.5">Expected Returns</p>
          <p className="text-xs text-on-surface-variant">At maturity</p>
        </div>
        <div className="card p-4">
          <p className="font-montserrat font-bold text-xl text-blue-600">{active}</p>
          <p className="text-sm font-semibold text-on-surface mt-0.5">Active Plans</p>
          <p className="text-xs text-on-surface-variant">Currently running</p>
        </div>
      </div>

      {/* Investment list */}
      {investments.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="material-icons-outlined text-4xl text-on-surface-variant mb-3">savings</span>
          <p className="font-semibold text-on-surface">No investments yet</p>
          <p className="text-sm text-on-surface-variant mt-1">Your investment records will appear here once added by admin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {investments.map(inv => {
            const badge = STATUS_BADGE[inv.status] || {};
            const pctDone = inv.maturityDate
              ? Math.min(100, Math.round(
                  (Date.now() - new Date(inv.startDate)) /
                  (new Date(inv.maturityDate) - new Date(inv.startDate)) * 100
                ))
              : 0;
            return (
              <div key={inv._id} className="card p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-on-surface">{inv.projectName}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">location_on</span>
                      {[inv.city, inv.area].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-on-surface-variant">Invested</p>
                    <p className="font-semibold text-on-surface">₹{inv.amount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Return Rate</p>
                    <p className="font-bold text-emerald-600">{inv.returnRate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Duration</p>
                    <p className="font-semibold text-on-surface">{inv.durationYears} yr{inv.durationYears !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Expected Return</p>
                    <p className="font-semibold text-emerald-600">₹{(inv.expectedReturn || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Progress bar */}
                {inv.status === 'active' && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                      <span>{new Date(inv.startDate).toLocaleDateString('en-IN')}</span>
                      <span className="font-semibold text-emerald-600">{pctDone}% complete</span>
                      <span>{inv.maturityDate ? new Date(inv.maturityDate).toLocaleDateString('en-IN') : '—'}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pctDone}%` }}
                      />
                    </div>
                  </div>
                )}

                {inv.adminNote && (
                  <p className="text-xs text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg">{inv.adminNote}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
