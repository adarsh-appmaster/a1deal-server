import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const STATUS_LABELS = { available: 'Available', under_process: 'Under Process', transferred: 'Transferred' };
const STATUS_COLORS = {
  available:    'bg-emerald-100 text-emerald-700',
  under_process:'bg-amber-100 text-amber-700',
  transferred:  'bg-sky-100 text-sky-700',
};
const APP_STATUS_COLORS = {
  pending:   'bg-slate-100 text-slate-600',
  in_review: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-rose-100 text-rose-600',
};
const SUB_STATUS = {
  submitted:         { label: 'Pending Verification', color: 'bg-sky-100 text-sky-700' },
  under_review:      { label: 'Team Contacted',       color: 'bg-amber-100 text-amber-700' },
  charges_pending:   { label: 'Docs Requested',       color: 'bg-orange-100 text-orange-700' },
  charges_collected: { label: 'Docs Uploaded',        color: 'bg-indigo-100 text-indigo-700' },
  approved:          { label: 'Verified & Published', color: 'bg-emerald-100 text-emerald-700' },
  rejected:          { label: 'Rejected',             color: 'bg-rose-100 text-rose-600' },
};

const TABS = ['Listed Properties', 'User Submissions'];

export default function TeamLoanTransfer() {
  const [tab, setTab]              = useState(0);

  // Listed properties state
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [applications, setApps]     = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [teamNote, setTeamNote]     = useState('');
  const [proceeding, setProceeding] = useState('');

  // User submissions state
  const [subs, setSubs]           = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subFilter, setSubFilter] = useState('');
  const [subSelected, setSubSelected] = useState(null);
  const [report, setReport]       = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [subSaving, setSubSaving] = useState('');

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === 1) fetchSubs(); }, [tab]);

  async function fetchAll() {
    setLoading(true);
    try {
      const r = await api.get('/loan-transfer/team/all');
      setProperties(r.data.properties || []);
    } catch { /* empty */ }
    setLoading(false);
  }

  async function fetchSubs() {
    setSubsLoading(true);
    try {
      const q = subFilter ? `?status=${subFilter}` : '';
      const r = await api.get(`/loan-transfer/submissions${q}`);
      setSubs(r.data.submissions || []);
    } catch { /* empty */ }
    setSubsLoading(false);
  }

  useEffect(() => { if (tab === 1) fetchSubs(); }, [subFilter]);

  async function openProperty(prop) {
    setSelected(prop);
    setAppsLoading(true);
    try {
      const r = await api.get(`/loan-transfer/${prop._id}/applications`);
      setApps(r.data.applications || []);
    } catch { setApps([]); }
    setAppsLoading(false);
  }

  async function handleStatusChange(propId, status) {
    try {
      await api.patch(`/loan-transfer/${propId}/status`, { status });
      fetchAll();
      if (selected?._id === propId) setSelected(s => s ? { ...s, status } : s);
    } catch { /* empty */ }
  }

  async function handleReviewApp(appId, status) {
    setProceeding(appId);
    try {
      await api.patch(`/loan-transfer/${selected._id}/applications/${appId}`, { status, teamNote });
      const r = await api.get(`/loan-transfer/${selected._id}/applications`);
      setApps(r.data.applications || []);
      setTeamNote('');
    } catch { /* empty */ }
    setProceeding('');
  }

  function openSubDetail(s) {
    setSubSelected(s);
    setReport(s.teamReview?.report || '');
    setVisitDate(s.teamReview?.visitDate ? s.teamReview.visitDate.slice(0, 10) : '');
    setPrivateNotes(s.privateNotes || '');
  }

  async function doSubAction(action) {
    if (!subSelected) return;
    setSubSaving(action);
    try {
      if (action === 'start-review') {
        await api.patch(`/loan-transfer/submissions/${subSelected._id}/start-review`);
      } else if (action === 'request-docs') {
        await api.patch(`/loan-transfer/submissions/${subSelected._id}/set-charge`, { amount: 0, note: 'Additional documents requested by team.' });
      } else if (action === 'team-report') {
        await api.patch(`/loan-transfer/submissions/${subSelected._id}/team-report`, { report, visitDate, privateNotes });
      } else if (action === 'mark-paid') {
        await api.patch(`/loan-transfer/submissions/${subSelected._id}/mark-charge-paid`);
      }
      fetchSubs();
      setSubSelected(null);
    } catch { /* empty */ }
    setSubSaving('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Loan Transfer – Team View</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Full access to manage listed properties and review user submissions.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-slate-100 pb-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition
              ${tab === i ? 'bg-[#0b5394] text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            {t}
            {i === 1 && subs.filter(s => ['submitted','under_review','charges_collected'].includes(s.submissionStatus)).length > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {subs.filter(s => ['submitted','under_review','charges_collected'].includes(s.submissionStatus)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Listed Properties ── */}
      {tab === 0 && (
        <>
          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading…</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20 text-slate-400">No loan transfer properties added yet.</div>
          ) : (
            <div className="space-y-3">
              {properties.map(p => (
                <div key={p._id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-montserrat font-bold text-base text-slate-800">{p.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        <span className="material-icons-outlined text-xs align-middle">location_on</span>{' '}
                        {p.area ? `${p.area}, ` : ''}{p.city}{p.pincode ? ` · ${p.pincode}` : ''}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {[
                          ['Asking Price', p.askingPrice ? `₹${(p.askingPrice / 100000).toFixed(1)}L` : '—'],
                          ['Outstanding', p.outstandingLoanAmount ? `₹${(p.outstandingLoanAmount / 100000).toFixed(1)}L` : '—'],
                          ['EMI', p.monthlyEmi ? `₹${p.monthlyEmi.toLocaleString('en-IN')}/mo` : '—'],
                          ['Rate', p.interestRate ? `${p.interestRate}%` : '—'],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-xs text-slate-400">{l}</p>
                            <p className="text-sm font-semibold text-slate-700">{v}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-4">
                        {p.assignedBroker ? (
                          <div className="bg-[#0b5394]/5 border border-[#0b5394]/10 rounded-xl px-3 py-2">
                            <p className="text-xs text-[#0b5394] font-bold mb-0.5">Assigned Broker</p>
                            <p className="text-sm font-semibold text-slate-800">{p.assignedBroker.name}</p>
                            <p className="text-xs text-slate-500">{p.assignedBroker.phone || p.assignedBroker.email}</p>
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                            <p className="text-xs text-amber-600 font-semibold">No broker assigned</p>
                          </div>
                        )}
                        {p.sellerName && (
                          <div className="bg-slate-50 rounded-xl px-3 py-2">
                            <p className="text-xs text-slate-400 font-bold mb-0.5">Seller</p>
                            <p className="text-sm font-semibold text-slate-800">{p.sellerName}</p>
                            {p.sellerPhone && <p className="text-xs text-slate-500">{p.sellerPhone}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => openProperty(p)}
                        className="px-3 py-1.5 bg-[#0b5394] text-white text-xs font-semibold rounded-lg hover:bg-[#0a4a7a] transition whitespace-nowrap">
                        Applications
                      </button>
                      <select value={p.status} onChange={e => handleStatusChange(p._id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none cursor-pointer">
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                      {p.assignedBroker?.phone && (
                        <a href={`https://wa.me/91${p.assignedBroker.phone}?text=${encodeURIComponent(
                          `Hi ${p.assignedBroker.name}, regarding loan transfer property: "${p.title}" in ${p.city}.`
                        )}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition">
                          <span className="material-icons-outlined text-sm">chat</span> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── User Submissions ── */}
      {tab === 1 && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex flex-wrap gap-2">
            {[['', 'All'], ['submitted', 'Pending'], ['under_review', 'Team Contacted'], ['charges_pending', 'Docs Requested'],
              ['charges_collected', 'Docs Uploaded'], ['approved', 'Published'], ['rejected', 'Rejected']].map(([v, l]) => (
              <button key={v} onClick={() => setSubFilter(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition
                  ${subFilter === v ? 'bg-[#0b5394] text-white border-[#0b5394]' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                {l}
              </button>
            ))}
          </div>

          {subsLoading ? (
            <div className="text-center py-16 text-slate-400">Loading…</div>
          ) : subs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No submissions found.</div>
          ) : (
            <div className="space-y-3">
              {subs.map(s => {
                const st = SUB_STATUS[s.submissionStatus] || SUB_STATUS.submitted;
                return (
                  <div key={s._id} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-montserrat font-bold text-base text-slate-800">{s.title}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {s.city}{s.area ? `, ${s.area}` : ''}{s.pincode ? ` – ${s.pincode}` : ''}
                          &nbsp;·&nbsp;{new Date(s.createdAt).toLocaleDateString('en-IN')}
                        </p>

                        {/* Submitter */}
                        {s.submittedBy && (
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-[#0b5394]/10 flex items-center justify-center text-[#0b5394] text-xs font-bold">
                                {s.submittedBy.name?.[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-slate-700">{s.submittedBy.name}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{s.submittedBy.role}</span>
                            </div>
                            {s.submittedBy.phone && (
                              <a href={`tel:${s.submittedBy.phone}`} className="text-xs text-[#0b5394] font-semibold hover:underline">
                                {s.submittedBy.phone}
                              </a>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          {[
                            ['Asking', s.askingPrice ? `₹${(s.askingPrice / 100000).toFixed(1)}L` : '—'],
                            ['Outstanding', s.outstandingLoanAmount ? `₹${(s.outstandingLoanAmount / 100000).toFixed(1)}L` : '—'],
                            ['EMI', s.monthlyEmi ? `₹${s.monthlyEmi.toLocaleString('en-IN')}` : '—'],
                            ['Bank', s.loanBank || '—'],
                          ].map(([l, v]) => (
                            <div key={l}>
                              <p className="text-xs text-slate-400">{l}</p>
                              <p className="text-sm font-semibold text-slate-700">{v}</p>
                            </div>
                          ))}
                        </div>

                        {/* Charge info */}
                        {s.propertyCharge?.amount > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="material-icons-outlined text-sm text-slate-400">payments</span>
                            <span className="font-semibold text-slate-700">₹{s.propertyCharge.amount.toLocaleString('en-IN')}</span>
                            {s.propertyCharge.paid
                              ? <span className="text-emerald-600 font-semibold">· Paid</span>
                              : <span className="text-orange-600 font-semibold">· Pending</span>}
                          </div>
                        )}

                        {/* Team review info */}
                        {s.teamReview?.report && (
                          <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
                            <span className="font-semibold">Report:</span> {s.teamReview.report}
                          </div>
                        )}
                      </div>

                      <button onClick={() => openSubDetail(s)}
                        className="px-3 py-1.5 bg-[#0b5394] text-white text-xs font-semibold rounded-lg hover:bg-[#0a4a7a] transition flex-shrink-0">
                        Manage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Applications Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-montserrat font-bold text-lg text-slate-800">{selected.title}</h2>
                <p className="text-xs text-slate-400">Applications</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {appsLoading ? (
                <div className="text-center py-8 text-slate-400">Loading…</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No applications yet.</div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app._id} className="border border-slate-100 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#0b5394]/10 flex items-center justify-center text-[#0b5394] font-bold text-sm">
                              {app.applicant?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{app.applicant?.name}</p>
                              <p className="text-xs text-slate-400">{app.applicant?.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{app.role}</span>
                            {app.applicant?.phone && (
                              <a href={`tel:${app.applicant.phone}`} className="text-xs text-[#0b5394] font-semibold hover:underline">
                                {app.applicant.phone}
                              </a>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${APP_STATUS_COLORS[app.status]}`}>
                          {app.status?.replace('_', ' ')}
                        </span>
                      </div>

                      {app.note && <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 italic mb-3">"{app.note}"</div>}

                      {app.status !== 'approved' && app.status !== 'rejected' && (
                        <div className="space-y-2">
                          <textarea rows={2}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            placeholder="Add team note…" value={teamNote} onChange={e => setTeamNote(e.target.value)} />
                          <div className="flex gap-2">
                            {app.status === 'pending' && (
                              <button onClick={() => handleReviewApp(app._id, 'in_review')} disabled={proceeding === app._id}
                                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition disabled:opacity-50">
                                Start Review
                              </button>
                            )}
                            <button onClick={() => handleReviewApp(app._id, 'approved')} disabled={proceeding === app._id}
                              className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                              Approve
                            </button>
                            <button onClick={() => handleReviewApp(app._id, 'rejected')} disabled={proceeding === app._id}
                              className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50">
                              Reject
                            </button>
                          </div>
                          {app.applicant?.phone && (
                            <a href={`https://wa.me/91${app.applicant.phone}?text=${encodeURIComponent(
                              `Hi ${app.applicant.name}, your application for "${selected.title}" is being reviewed.`
                            )}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
                              <span className="material-icons-outlined text-sm">chat</span> WhatsApp Applicant
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => handleStatusChange(selected._id, 'under_process')}
                  className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600">
                  Mark Under Process
                </button>
                <button onClick={() => handleStatusChange(selected._id, 'transferred')}
                  className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700">
                  Mark as Transferred
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Manage Modal */}
      {subSelected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-montserrat font-bold text-lg text-slate-800">{subSelected.title}</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(SUB_STATUS[subSelected.submissionStatus] || SUB_STATUS.submitted).color}`}>
                  {(SUB_STATUS[subSelected.submissionStatus] || SUB_STATUS.submitted).label}
                </span>
              </div>
              <button onClick={() => setSubSelected(null)} className="text-slate-400 hover:text-slate-700">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[78vh]">
              {/* Submitter */}
              {subSelected.submittedBy && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-400 mb-2">Submitted By</p>
                  <p className="font-semibold text-slate-800">{subSelected.submittedBy.name}
                    <span className="ml-2 text-xs font-normal text-slate-400 capitalize">({subSelected.submittedBy.role})</span>
                  </p>
                  <p className="text-xs text-slate-500">{subSelected.submittedBy.email}</p>
                  {subSelected.submittedBy.phone && (
                    <div className="flex items-center gap-2 mt-2">
                      <a href={`tel:${subSelected.submittedBy.phone}`} className="text-xs text-[#0b5394] font-semibold hover:underline">
                        {subSelected.submittedBy.phone}
                      </a>
                      <a href={`https://wa.me/91${subSelected.submittedBy.phone}?text=${encodeURIComponent(
                        `Hi ${subSelected.submittedBy.name}, regarding your loan transfer submission: "${subSelected.title}".`
                      )}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200">
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Loan summary */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Asking Price', subSelected.askingPrice ? `₹${subSelected.askingPrice.toLocaleString('en-IN')}` : '—'],
                  ['Outstanding', subSelected.outstandingLoanAmount ? `₹${subSelected.outstandingLoanAmount.toLocaleString('en-IN')}` : '—'],
                  ['Monthly EMI', subSelected.monthlyEmi ? `₹${subSelected.monthlyEmi.toLocaleString('en-IN')}` : '—'],
                  ['Loan Bank', subSelected.loanBank || '—'],
                  ['Interest Rate', subSelected.interestRate ? `${subSelected.interestRate}%` : '—'],
                  ['Tenure Left', subSelected.tenureRemainingMonths ? `${subSelected.tenureRemainingMonths} mo` : '—'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-xl p-2">
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="text-sm font-semibold text-slate-700">{v}</p>
                  </div>
                ))}
              </div>

              {/* Charge info */}
              {subSelected.propertyCharge?.amount > 0 && (
                <div className={`rounded-xl p-3 border ${subSelected.propertyCharge.paid ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                  <p className="text-xs font-bold mb-1">{subSelected.propertyCharge.paid ? 'Charge Collected' : 'Charge Set (Pending Payment)'}</p>
                  <p className="text-lg font-bold">₹{subSelected.propertyCharge.amount.toLocaleString('en-IN')}</p>
                  {subSelected.propertyCharge.note && <p className="text-xs text-slate-500 mt-1">{subSelected.propertyCharge.note}</p>}
                  {!subSelected.propertyCharge.paid && (
                    <button onClick={() => doSubAction('mark-paid')} disabled={subSaving === 'mark-paid'}
                      className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition">
                      {subSaving === 'mark-paid' ? 'Marking…' : 'Mark as Paid'}
                    </button>
                  )}
                </div>
              )}

              {/* Workflow action buttons */}
              <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Workflow</p>
                <div className="grid grid-cols-2 gap-2">
                  {subSelected.submissionStatus === 'submitted' && (
                    <button onClick={() => doSubAction('start-review')} disabled={!!subSaving}
                      className="col-span-2 py-2 text-sm font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition">
                      {subSaving === 'start-review' ? 'Updating…' : '📞 Mark as Team Contacted'}
                    </button>
                  )}
                  {subSelected.submissionStatus === 'under_review' && (
                    <button onClick={() => doSubAction('request-docs')} disabled={!!subSaving}
                      className="col-span-2 py-2 text-sm font-semibold rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition">
                      {subSaving === 'request-docs' ? 'Updating…' : '📁 Request Additional Documents'}
                    </button>
                  )}
                  {subSelected.submissionStatus === 'charges_pending' && (
                    <button onClick={() => doSubAction('mark-paid')} disabled={!!subSaving}
                      className="col-span-2 py-2 text-sm font-semibold rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition">
                      {subSaving === 'mark-paid' ? 'Updating…' : '✅ Mark Documents as Received'}
                    </button>
                  )}
                </div>
              </div>

              {/* Field review notes */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Field Notes</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Site Visit Date</label>
                  <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={visitDate} onChange={e => setVisitDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Field Report / Verification Notes</label>
                  <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="Property condition, documents verified, valuation note…"
                    value={report} onChange={e => setReport(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Private Notes (team/admin only)</label>
                  <textarea rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="Internal notes not visible to the seller…"
                    value={privateNotes} onChange={e => setPrivateNotes(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => doSubAction('team-report')} disabled={!!subSaving}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl bg-[#0b5394] text-white hover:bg-[#0a4a7a] disabled:opacity-50 transition">
                  {subSaving === 'team-report' ? 'Saving…' : 'Save Notes'}
                </button>
                <button onClick={() => setSubSelected(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
