import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import LoanTransferMySubmissions from '../../../components/common/LoanTransferMySubmissions';

const STATUS_COLORS = {
  available:    'bg-emerald-100 text-emerald-700',
  under_process:'bg-amber-100 text-amber-700',
  transferred:  'bg-slate-100 text-slate-500',
};

const TABS = ['Available Properties', 'My Submissions'];

export default function DeveloperLoanTransfer() {
  const { user }               = useAuth();
  const [tab, setTab]         = useState(0);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [applyNote, setApplyNote] = useState('');
  const [applying, setApplying]   = useState(false);
  const [applied, setApplied]     = useState(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.get('/loan-transfer');
        setProperties(r.data.properties || []);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  async function handleApply(prop) {
    setApplying(true);
    try {
      await api.post('/enquiry', {
        name:  user?.name  || '',
        phone: user?.phone || '',
        email: user?.email || '',
        city:  prop.city  || '',
        area:  prop.area  || '',
        message: applyNote,
        propertyId:    prop._id,
        propertyModel: 'LoanTransferProperty',
        propertyTitle: prop.title || '',
      });
      setApplied(s => new Set([...s, prop._id]));
      setSelected(null);
      setApplyNote('');
    } catch { /* empty */ }
    setApplying(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Loan Transfer Properties</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Explore properties with assumable loans or list your own for loan transfer.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition
              ${tab === i ? 'bg-[#0369a1] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <>
          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading…</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-icons-outlined text-5xl text-slate-300">account_balance</span>
              <p className="text-slate-400 mt-3">No loan transfer properties in your area yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {properties.map(p => (
                <div key={p._id} className="bg-white rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="bg-gradient-to-br from-sky-50 to-white px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                        {p.status?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">{p.propertyType?.replace('_', ' ')}</span>
                    </div>
                    <h3 className="font-montserrat font-bold text-base text-slate-800 leading-tight">{p.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <span className="material-icons-outlined text-xs">location_on</span>
                      {p.area ? `${p.area}, ` : ''}{p.city}{p.pincode ? ` – ${p.pincode}` : ''}
                    </p>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-slate-50">
                    <div>
                      <p className="text-xs text-slate-400">Asking Price</p>
                      <p className="font-bold text-slate-800 text-sm">{p.askingPrice ? `₹${(p.askingPrice / 100000).toFixed(1)}L` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Outstanding Loan</p>
                      <p className="font-bold text-[#0369a1] text-sm">{p.outstandingLoanAmount ? `₹${(p.outstandingLoanAmount / 100000).toFixed(1)}L` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Monthly EMI</p>
                      <p className="font-semibold text-slate-700 text-sm">{p.monthlyEmi ? `₹${p.monthlyEmi.toLocaleString('en-IN')}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Interest Rate</p>
                      <p className="font-semibold text-slate-700 text-sm">{p.interestRate ? `${p.interestRate}%` : '—'}</p>
                    </div>
                  </div>
                  {p.loanBank && (
                    <div className="px-4 py-2 flex items-center gap-2 bg-slate-50 text-xs text-slate-600">
                      <span className="material-icons-outlined text-sm text-slate-400">account_balance</span>
                      {p.loanBank}
                      {p.tenureRemainingMonths && <span className="ml-auto text-slate-400">{p.tenureRemainingMonths} mo left</span>}
                    </div>
                  )}
                  <div className="px-4 pb-4 pt-2">
                    <button onClick={() => setSelected(p)} disabled={applied.has(p._id) || p.status === 'transferred'}
                      className={`w-full py-2 rounded-xl text-sm font-semibold transition
                        ${applied.has(p._id) ? 'bg-emerald-50 text-emerald-700 cursor-default'
                          : p.status === 'transferred' ? 'bg-slate-100 text-slate-400 cursor-default'
                          : 'bg-[#0369a1] text-white hover:bg-[#0284c7]'}`}>
                      {applied.has(p._id) ? '✓ Applied' : p.status === 'transferred' ? 'Already Transferred' : 'Express Interest'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 1 && <LoanTransferMySubmissions accentColor="#0369a1" />}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-montserrat font-bold text-lg text-slate-800">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Asking Price', selected.askingPrice ? `₹${selected.askingPrice.toLocaleString('en-IN')}` : '—'],
                  ['Outstanding', selected.outstandingLoanAmount ? `₹${selected.outstandingLoanAmount.toLocaleString('en-IN')}` : '—'],
                  ['Loan Bank', selected.loanBank || '—'],
                  ['Monthly EMI', selected.monthlyEmi ? `₹${selected.monthlyEmi.toLocaleString('en-IN')}` : '—'],
                  ['Interest Rate', selected.interestRate ? `${selected.interestRate}%` : '—'],
                  ['Tenure Left', selected.tenureRemainingMonths ? `${selected.tenureRemainingMonths} months` : '—'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              {selected.requiredDocs?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-bold text-slate-500 mb-1">Required Documents</p>
                  {selected.requiredDocs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="material-icons-outlined text-amber-500 text-sm">task_alt</span>{doc}
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Message (optional)</label>
                <textarea rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0369a1]/30"
                  placeholder="Your note for the team…" value={applyNote} onChange={e => setApplyNote(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={() => handleApply(selected)} disabled={applying}
                  className="flex-1 py-2.5 rounded-xl bg-[#0369a1] text-white text-sm font-semibold hover:bg-[#0284c7] disabled:opacity-50">
                  {applying ? 'Submitting…' : 'Express Interest'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
