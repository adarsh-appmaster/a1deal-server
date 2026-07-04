import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const STAGES = ['Contact', 'Site Visit', 'Negotiation', 'Documentation', 'Closed'];

const PRIORITY_COLOR = { high: 'bg-rose-100 text-rose-600', medium: 'bg-amber-100 text-amber-600', low: 'bg-slate-100 text-slate-500' };
const STAGE_COLOR = {
  'Contact':       'border-t-slate-400',
  'Site Visit':    'border-t-blue-400',
  'Negotiation':   'border-t-amber-400',
  'Documentation': 'border-t-purple-400',
  'Closed':        'border-t-emerald-500',
};

function EmptyStage() {
  return (
    <div className="px-3 pb-3 text-center py-6">
      <span className="material-icons-outlined text-3xl text-slate-200">inbox</span>
      <p className="text-xs text-slate-400 mt-1">No deals</p>
    </div>
  );
}

export default function DealPipeline() {
  const [view, setView]     = useState('kanban');
  const [deals, setDeals]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/broker/deals')
      .then(r => setDeals(r.data?.deals || []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  const byStage = (stage) => deals.filter(d => d.stage === stage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Deal Pipeline</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {deals.length > 0 ? `${deals.length} active deals · Track progress by stage` : 'Track your deals by stage'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-container rounded-xl p-1">
            {[{ v: 'kanban', icon: 'view_kanban' }, { v: 'list', icon: 'view_list' }].map(b => (
              <button key={b.v} onClick={() => setView(b.v)}
                className={`p-2 rounded-lg transition-colors ${view === b.v ? 'bg-white shadow text-primary' : 'text-on-surface-variant'}`}>
                <span className="material-icons-outlined text-xl">{b.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => <div key={s} className="w-64 h-48 bg-surface-container rounded-2xl animate-pulse flex-shrink-0" />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <span className="material-icons-outlined text-5xl text-slate-200 mb-3">view_kanban</span>
          <p className="font-semibold text-on-surface mb-1">No deals in pipeline</p>
          <p className="text-sm text-on-surface-variant">Your deals will appear here as they progress through stages</p>
        </div>
      ) : view === 'kanban' ? (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 min-w-max pb-4">
            {STAGES.map(stage => (
              <div key={stage} className={`w-64 bg-surface-container rounded-2xl border-t-4 ${STAGE_COLOR[stage]} flex flex-col`}>
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-montserrat font-semibold text-sm text-on-surface">{stage}</h3>
                    <span className="text-xs bg-white rounded-full px-2 py-0.5 font-bold text-on-surface-variant">
                      {byStage(stage).length}
                    </span>
                  </div>
                </div>
                {byStage(stage).length === 0 ? <EmptyStage /> : (
                  <div className="flex-1 px-3 pb-3 space-y-2">
                    {byStage(stage).map(deal => (
                      <div key={deal._id || deal.id} className="bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-on-surface text-xs leading-snug">{deal.property}</p>
                          {deal.priority && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 capitalize ${PRIORITY_COLOR[deal.priority] || ''}`}>
                              {deal.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant mb-2">{deal.buyer}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#ff5a5f]">{deal.value}</span>
                          <span className="text-[10px] text-on-surface-variant">{deal.lastContact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Property</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Buyer</th>
                  <th className="text-right px-5 py-3">Value</th>
                  <th className="text-center px-5 py-3">Stage</th>
                  <th className="text-center px-5 py-3 hidden md:table-cell">Priority</th>
                  <th className="text-right px-5 py-3 hidden lg:table-cell">Last Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {deals.map(d => (
                  <tr key={d._id || d.id} className="hover:bg-surface-container-low transition-colors cursor-pointer">
                    <td className="px-5 py-4 font-semibold text-on-surface">{d.property}</td>
                    <td className="px-5 py-4 text-on-surface-variant hidden sm:table-cell">{d.buyer}</td>
                    <td className="px-5 py-4 text-right font-bold text-[#ff5a5f]">{d.value}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">{d.stage}</span>
                    </td>
                    <td className="px-5 py-4 text-center hidden md:table-cell">
                      {d.priority && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${PRIORITY_COLOR[d.priority] || ''}`}>{d.priority}</span>}
                    </td>
                    <td className="px-5 py-4 text-right text-on-surface-variant hidden lg:table-cell">{d.lastContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
