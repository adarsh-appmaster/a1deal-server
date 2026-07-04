import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';

const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'row_house'];
const BANKS = [
  'HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank',
  'Bank of Baroda', 'PNB', 'Canara Bank', 'Union Bank', 'LIC Housing Finance',
  'IDFC First Bank', 'Yes Bank', 'Federal Bank', 'Other',
];

const WORKFLOW_STEPS = [
  { key: 'submitted',         label: 'Pending Verification',  icon: 'pending_actions',    color: 'text-sky-600',     bg: 'bg-sky-100' },
  { key: 'under_review',      label: 'Team Contacted',        icon: 'support_agent',      color: 'text-amber-600',   bg: 'bg-amber-100' },
  { key: 'charges_pending',   label: 'Docs Requested',        icon: 'folder_open',        color: 'text-orange-600',  bg: 'bg-orange-100' },
  { key: 'charges_collected', label: 'Docs Uploaded',         icon: 'task_alt',           color: 'text-indigo-600',  bg: 'bg-indigo-100' },
  { key: 'approved',          label: 'Verified & Published',  icon: 'verified',           color: 'text-emerald-600', bg: 'bg-emerald-100' },
];

const STATUS_INFO = {
  submitted:         { label: 'Pending Verification',  color: 'bg-sky-100 text-sky-700' },
  under_review:      { label: 'Team Contacted',        color: 'bg-amber-100 text-amber-700' },
  charges_pending:   { label: 'Docs Requested',        color: 'bg-orange-100 text-orange-700' },
  charges_collected: { label: 'Docs Uploaded',         color: 'bg-indigo-100 text-indigo-700' },
  approved:          { label: 'Verified & Published',  color: 'bg-emerald-100 text-emerald-700' },
  rejected:          { label: 'Rejected',              color: 'bg-rose-100 text-rose-600' },
};

const EMPTY_FORM = {
  // Step 1 – Property
  title: '', propertyType: 'apartment', city: '', area: '',
  askingPrice: '', areaSqft: '', bedrooms: '', bathrooms: '',
  images: [],
  // Step 2 – Loan
  loanBank: '', totalLoanAmount: '', outstandingLoanAmount: '',
  monthlyEmi: '', tenureRemainingMonths: '', interestRate: '',
  // Step 3 – Seller
  sellerFullName: '', sellerMobile: '', sellerEmail: '', panNumber: '',
  panFile: null,
  // legacy
  description: '', pincode: '', address: '', docsAvailable: '',
};

const INP = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 transition';
const LBL = 'block text-xs font-semibold text-slate-500 mb-1';

function StepIndicator({ step, accentColor }) {
  const steps = ['Property', 'Loan', 'Seller & ID', 'Review'];
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${done ? 'text-white' : active ? 'text-white' : 'bg-slate-100 text-slate-400'}`}
                style={done || active ? { backgroundColor: accentColor } : {}}>
                {done ? <span className="material-icons-outlined text-sm">check</span> : idx}
              </div>
              <span className={`text-xs mt-1 font-semibold ${active ? 'text-slate-700' : done ? 'text-slate-500' : 'text-slate-300'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${done ? '' : 'bg-slate-100'}`}
                style={done ? { backgroundColor: accentColor } : {}} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function WorkflowProgress({ status }) {
  const stepKeys = WORKFLOW_STEPS.map(s => s.key);
  const currentIdx = status === 'rejected' ? -1 : stepKeys.indexOf(status);

  if (status === 'rejected') {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
        <span className="material-icons-outlined text-rose-500 text-2xl">cancel</span>
        <div>
          <p className="font-semibold text-rose-700 text-sm">Listing Rejected</p>
          <p className="text-xs text-rose-500 mt-0.5">Contact our team for more information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key}
            className={`flex items-center gap-3 p-3 rounded-xl transition
              ${active ? `${step.bg} border border-current/20` : done ? 'bg-slate-50' : 'opacity-40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${active ? step.bg : done ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <span className={`material-icons-outlined text-base ${active ? step.color : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                {done ? 'check_circle' : step.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${active ? step.color : done ? 'text-slate-600' : 'text-slate-400'}`}>
                {step.label}
              </p>
            </div>
            {active && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span className={`text-xs font-semibold ${step.color}`}>Current</span>
              </div>
            )}
            {done && <span className="text-xs font-semibold text-emerald-600">Done</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function LoanTransferMySubmissions({ accentColor = '#4900e5' }) {
  const [view, setView]           = useState('list'); // 'list' | 'new'
  const [step, setStep]           = useState(1);
  const [submissions, setSubs]    = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [otpSent, setOtpSent]     = useState(false);
  const [otp, setOtp]             = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending]   = useState(false);
  const [imageFiles, setImageFiles]   = useState([]);
  const [panFileName, setPanFileName] = useState('');
  const imageInputRef = useRef();
  const panInputRef   = useRef();

  useEffect(() => { fetchSubs(); }, []);

  async function fetchSubs() {
    setLoading(true);
    try {
      const r = await api.get('/loan-transfer/my-submissions');
      setSubs(r.data.submissions || []);
    } catch { /* empty */ }
    setLoading(false);
  }

  const f = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  function handleImageChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 10) return;
    setImageFiles(prev => [...prev, ...files].slice(0, 10));
  }

  function removeImage(idx) {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function handlePanFile(e) {
    const file = e.target.files?.[0];
    if (file) setPanFileName(file.name);
  }

  async function sendOtp() {
    if (!form.sellerMobile || form.sellerMobile.length < 10) return;
    setOtpSending(true);
    await new Promise(r => setTimeout(r, 800));
    setOtpSent(true);
    setOtpSending(false);
  }

  function verifyOtp() {
    if (otp.length === 6) setOtpVerified(true);
  }

  function canProceedStep() {
    if (step === 1) {
      return form.title && form.city && form.askingPrice && imageFiles.length >= 3;
    }
    if (step === 2) {
      return form.loanBank && form.outstandingLoanAmount && form.monthlyEmi && form.tenureRemainingMonths;
    }
    if (step === 3) {
      return form.sellerFullName && otpVerified && form.sellerEmail && form.panNumber && panFileName;
    }
    return true;
  }

  async function handleSubmit() {
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        title: form.title,
        propertyType: form.propertyType,
        city: form.city,
        area: form.area,
        askingPrice: form.askingPrice,
        areaSqft: form.areaSqft,
        bedrooms: form.bedrooms,
        description: `Bathrooms: ${form.bathrooms || '—'}`,
        loanBank: form.loanBank,
        outstandingLoanAmount: form.outstandingLoanAmount,
        monthlyEmi: form.monthlyEmi,
        tenureRemainingMonths: form.tenureRemainingMonths,
        interestRate: form.interestRate,
        docsAvailable: `PAN: ${form.panNumber} | File: ${panFileName}`,
      };
      await api.post('/loan-transfer/submit', payload);
      setMsg('success');
      setForm(EMPTY_FORM);
      setImageFiles([]);
      setPanFileName('');
      setOtpSent(false);
      setOtp('');
      setOtpVerified(false);
      setStep(1);
      setView('list');
      fetchSubs();
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Submission failed. Please try again.');
    }
    setSaving(false);
  }

  function startNew() {
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setPanFileName('');
    setOtpSent(false);
    setOtp('');
    setOtpVerified(false);
    setStep(1);
    setMsg('');
    setView('new');
  }

  function cancelNew() {
    setView('list');
    setStep(1);
  }

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Top bar */}
      {view === 'list' && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {submissions.length > 0 ? `${submissions.length} submission${submissions.length > 1 ? 's' : ''}` : 'No submissions yet'}
          </p>
          <button onClick={startNew} style={{ backgroundColor: accentColor }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition">
            <span className="material-icons-outlined text-base">add_home</span> List My Property
          </button>
        </div>
      )}

      {/* ── SUBMISSIONS LIST ── */}
      {view === 'list' && (
        <>
          {msg === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="material-icons-outlined text-emerald-500 text-2xl">check_circle</span>
              <div>
                <p className="font-semibold text-emerald-700">Property Submitted Successfully!</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Our team will review your listing and contact you within 1–2 working days.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading your submissions…</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-outlined text-4xl text-slate-300">home_work</span>
              </div>
              <p className="text-slate-500 font-semibold">No submissions yet</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">List your property in under 2 minutes — only PAN card needed!</p>
              <button onClick={startNew} style={{ backgroundColor: accentColor }}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition">
                Submit My First Property
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map(s => {
                const st = STATUS_INFO[s.submissionStatus] || STATUS_INFO.submitted;
                const isExp = expanded === s._id;
                return (
                  <div key={s._id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-montserrat font-bold text-base text-slate-800 truncate">{s.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            <span className="material-icons-outlined text-xs align-middle">location_on</span>{' '}
                            {s.city}{s.area ? `, ${s.area}` : ''}
                            &nbsp;·&nbsp;Submitted {new Date(s.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        {[
                          ['Asking Price', s.askingPrice ? `₹${(s.askingPrice / 100000).toFixed(1)}L` : '—'],
                          ['Outstanding', s.outstandingLoanAmount ? `₹${(s.outstandingLoanAmount / 100000).toFixed(1)}L` : '—'],
                          ['Monthly EMI', s.monthlyEmi ? `₹${s.monthlyEmi.toLocaleString('en-IN')}` : '—'],
                          ['Bank', s.loanBank || '—'],
                        ].map(([l, v]) => (
                          <div key={l} className="bg-slate-50 rounded-xl p-2.5">
                            <p className="text-xs text-slate-400">{l}</p>
                            <p className="text-sm font-semibold text-slate-700">{v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Admin / team message */}
                      {s.adminNote && (
                        <div className={`rounded-xl p-3 text-sm border mb-3 ${
                          s.submissionStatus === 'rejected'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : 'bg-sky-50 border-sky-100 text-sky-700'}`}>
                          <p className="text-xs font-bold mb-1">
                            {s.submissionStatus === 'rejected' ? 'Rejection Reason' : 'Message from A1 Deal Team'}
                          </p>
                          {s.adminNote}
                        </div>
                      )}

                      {/* Charge due */}
                      {s.propertyCharge?.amount > 0 && !s.propertyCharge.paid && (
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-orange-700">Payment Due</p>
                              <p className="text-lg font-bold text-orange-800">₹{s.propertyCharge.amount.toLocaleString('en-IN')}</p>
                              {s.propertyCharge.note && <p className="text-xs text-slate-500 mt-0.5">{s.propertyCharge.note}</p>}
                            </div>
                            <span className="material-icons-outlined text-orange-400 text-3xl">payments</span>
                          </div>
                          <p className="text-xs text-orange-600 mt-2">Contact our team to complete payment and proceed with listing.</p>
                        </div>
                      )}
                      {s.propertyCharge?.amount > 0 && s.propertyCharge.paid && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3 flex items-center gap-2">
                          <span className="material-icons-outlined text-emerald-500">check_circle</span>
                          <p className="text-xs font-semibold text-emerald-700">
                            Payment of ₹{s.propertyCharge.amount.toLocaleString('en-IN')} confirmed
                          </p>
                        </div>
                      )}

                      {/* Docs requested by team */}
                      {s.submissionStatus === 'charges_pending' && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-3">
                          <p className="text-xs font-bold text-amber-700 mb-1">Additional Documents Required</p>
                          <p className="text-xs text-amber-600">
                            Our team has requested additional documents. Please contact us or check your email/WhatsApp.
                          </p>
                        </div>
                      )}

                      <button onClick={() => setExpanded(isExp ? null : s._id)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition mt-1">
                        <span className="material-icons-outlined text-sm">{isExp ? 'expand_less' : 'expand_more'}</span>
                        {isExp ? 'Hide progress' : 'View progress'}
                      </button>
                    </div>

                    {/* Expanded workflow progress */}
                    {isExp && (
                      <div className="border-t border-slate-50 px-5 py-4 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Listing Progress</p>
                        <WorkflowProgress status={s.submissionStatus} />
                        {s.submissionStatus === 'submitted' && !s.adminNote && (
                          <p className="text-xs text-slate-400 mt-3 bg-white rounded-lg p-2.5">
                            Our team will review your submission and contact you within 1–2 working days.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── MULTI-STEP FORM ── */}
      {view === 'new' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-montserrat font-bold text-lg text-slate-800">List Your Property for Loan Transfer</h2>
            <button onClick={cancelNew} className="text-slate-400 hover:text-slate-600">
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            <span className="material-icons-outlined text-xs align-middle text-emerald-500">bolt</span>{' '}
            Create your listing in under 2 minutes — only PAN card required at this stage.
          </p>

          <StepIndicator step={step} accentColor={accentColor} />

          {msg && msg !== 'success' && (
            <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 text-sm text-rose-600">{msg}</div>
          )}

          {/* ── STEP 1: Property Information ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: accentColor }}>1</div>
                <h3 className="font-semibold text-slate-800">Property Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={LBL}>Property Title *</label>
                  <input className={INP} required value={form.title} onChange={f('title')}
                    placeholder="e.g. 3BHK Apartment – Loan Transfer, Baner Pune" />
                </div>
                <div>
                  <label className={LBL}>Property Type *</label>
                  <select className={INP} value={form.propertyType} onChange={f('propertyType')}>
                    {PROPERTY_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LBL}>City *</label>
                  <input className={INP} required value={form.city} onChange={f('city')} placeholder="Pune" />
                </div>
                <div>
                  <label className={LBL}>Area / Locality</label>
                  <input className={INP} value={form.area} onChange={f('area')} placeholder="Baner" />
                </div>
                <div>
                  <label className={LBL}>Asking Price (₹) *</label>
                  <input className={INP} required type="number" min="0" value={form.askingPrice} onChange={f('askingPrice')}
                    placeholder="6500000" />
                </div>
                <div>
                  <label className={LBL}>Property Size (Sq. Ft.)</label>
                  <input className={INP} type="number" min="0" value={form.areaSqft} onChange={f('areaSqft')} placeholder="1250" />
                </div>
                <div>
                  <label className={LBL}>Bedrooms</label>
                  <input className={INP} type="number" min="0" value={form.bedrooms} onChange={f('bedrooms')} placeholder="3" />
                </div>
                <div>
                  <label className={LBL}>Bathrooms</label>
                  <input className={INP} type="number" min="0" value={form.bathrooms} onChange={f('bathrooms')} placeholder="2" />
                </div>
              </div>

              {/* Property Images */}
              <div>
                <label className={LBL}>
                  Property Images *
                  <span className="ml-1 text-slate-400 font-normal">(minimum 3, up to 10)</span>
                </label>
                <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={handleImageChange} />
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#4900e5]/40 transition">
                  <span className="material-icons-outlined text-3xl text-slate-300 block">add_photo_alternate</span>
                  <p className="text-sm text-slate-500 mt-1">Click to add photos</p>
                  <p className="text-xs text-slate-400">{imageFiles.length}/10 images added</p>
                </div>
                {imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="relative">
                        <img src={URL.createObjectURL(file)} alt={`img-${idx}`}
                          className="w-20 h-20 object-cover rounded-xl border border-slate-100" />
                        <button type="button" onClick={() => removeImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                          <span className="material-icons-outlined text-xs">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {imageFiles.length < 3 && imageFiles.length > 0 && (
                  <p className="text-xs text-orange-500 mt-1.5">
                    Please add at least {3 - imageFiles.length} more image{3 - imageFiles.length > 1 ? 's' : ''}.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Loan Information ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: accentColor }}>2</div>
                <h3 className="font-semibold text-slate-800">Existing Loan Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={LBL}>Bank / Financial Institution *</label>
                  <select className={INP} value={form.loanBank} onChange={f('loanBank')}>
                    <option value="">— Select Bank —</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {form.loanBank === 'Other' && (
                    <input className={`${INP} mt-2`} placeholder="Enter bank name"
                      onChange={e => setForm(p => ({ ...p, loanBank: e.target.value }))} />
                  )}
                </div>
                <div>
                  <label className={LBL}>Total Loan Amount (₹)</label>
                  <input className={INP} type="number" min="0" value={form.totalLoanAmount} onChange={f('totalLoanAmount')}
                    placeholder="5000000" />
                </div>
                <div>
                  <label className={LBL}>Outstanding Loan Amount (₹) *</label>
                  <input className={INP} required type="number" min="0" value={form.outstandingLoanAmount} onChange={f('outstandingLoanAmount')}
                    placeholder="4200000" />
                </div>
                <div>
                  <label className={LBL}>EMI Amount (₹) *</label>
                  <input className={INP} required type="number" min="0" value={form.monthlyEmi} onChange={f('monthlyEmi')}
                    placeholder="38000" />
                </div>
                <div>
                  <label className={LBL}>Remaining Loan Tenure (months) *</label>
                  <input className={INP} required type="number" min="1" value={form.tenureRemainingMonths} onChange={f('tenureRemainingMonths')}
                    placeholder="168" />
                </div>
                <div>
                  <label className={LBL}>Current Interest Rate (%) <span className="text-slate-400 font-normal">Optional</span></label>
                  <input className={INP} type="number" min="0" step="0.01" value={form.interestRate} onChange={f('interestRate')}
                    placeholder="8.5" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                <span className="material-icons-outlined text-sm align-middle mr-1">info</span>
                This information helps buyers evaluate the loan transfer. All details remain confidential until your listing is verified.
              </div>
            </div>
          )}

          {/* ── STEP 3: Seller Info & PAN ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: accentColor }}>3</div>
                <h3 className="font-semibold text-slate-800">Seller Information & Identity</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={LBL}>Full Name (as per PAN) *</label>
                  <input className={INP} required value={form.sellerFullName} onChange={f('sellerFullName')}
                    placeholder="Rajesh Kumar Sharma" />
                </div>

                {/* Mobile + OTP */}
                <div className="sm:col-span-2">
                  <label className={LBL}>Mobile Number * <span className="text-slate-400 font-normal">(OTP Verified)</span></label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">+91</span>
                      <input className={`${INP} pl-10`} type="tel" maxLength={10} value={form.sellerMobile} onChange={f('sellerMobile')}
                        placeholder="9876543210" disabled={otpVerified} />
                    </div>
                    {!otpVerified && (
                      <button type="button" onClick={sendOtp} disabled={otpSending || form.sellerMobile.length < 10}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border transition disabled:opacity-50"
                        style={{ borderColor: accentColor, color: accentColor }}>
                        {otpSending ? 'Sending…' : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    )}
                    {otpVerified && (
                      <div className="flex items-center gap-1.5 px-3 text-emerald-600 text-sm font-semibold">
                        <span className="material-icons-outlined text-base">verified</span> Verified
                      </div>
                    )}
                  </div>
                  {otpSent && !otpVerified && (
                    <div className="flex gap-2 mt-2">
                      <input className={`${INP} flex-1`} type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP" />
                      <button type="button" onClick={verifyOtp} disabled={otp.length !== 6}
                        className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition"
                        style={{ backgroundColor: accentColor }}>
                        Verify
                      </button>
                    </div>
                  )}
                  {otpSent && !otpVerified && (
                    <p className="text-xs text-slate-400 mt-1">OTP sent to +91 {form.sellerMobile}. Enter any 6 digits to verify.</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className={LBL}>Email Address *</label>
                  <input className={INP} required type="email" value={form.sellerEmail} onChange={f('sellerEmail')}
                    placeholder="rajesh@example.com" />
                </div>
                <div>
                  <label className={LBL}>PAN Card Number *</label>
                  <input className={`${INP} uppercase`} required maxLength={10} value={form.panNumber}
                    onChange={e => setForm(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F" />
                </div>
              </div>

              {/* PAN Upload */}
              <div>
                <label className={LBL}>Upload PAN Card *</label>
                <input ref={panInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handlePanFile} />
                <div
                  onClick={() => panInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition
                    ${panFileName ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-[#4900e5]/40'}`}>
                  {panFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-icons-outlined text-emerald-500">description</span>
                      <span className="text-sm text-emerald-700 font-semibold">{panFileName}</span>
                      <span className="text-xs text-emerald-500">✓ Uploaded</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-icons-outlined text-3xl text-slate-300 block">upload_file</span>
                      <p className="text-sm text-slate-500 mt-1">Click to upload PAN Card</p>
                      <p className="text-xs text-slate-400">JPEG, PNG or PDF — max 5 MB</p>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                <span className="material-icons-outlined text-sm align-middle mr-1">lock</span>
                Your personal information is kept strictly confidential and is never shared with buyers or third parties.
              </div>
            </div>
          )}

          {/* ── STEP 4: Review & Submit ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: accentColor }}>4</div>
                <h3 className="font-semibold text-slate-800">Review & Submit</h3>
              </div>

              {/* Summary cards */}
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Property</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-400">Title</span><br /><span className="font-semibold text-slate-800">{form.title}</span></div>
                    <div><span className="text-slate-400">Type</span><br /><span className="font-semibold text-slate-800 capitalize">{form.propertyType.replace('_', ' ')}</span></div>
                    <div><span className="text-slate-400">City / Area</span><br /><span className="font-semibold text-slate-800">{form.city}{form.area ? `, ${form.area}` : ''}</span></div>
                    <div><span className="text-slate-400">Asking Price</span><br /><span className="font-semibold text-slate-800">₹{Number(form.askingPrice).toLocaleString('en-IN')}</span></div>
                    {form.areaSqft && <div><span className="text-slate-400">Size</span><br /><span className="font-semibold text-slate-800">{form.areaSqft} sq.ft.</span></div>}
                    {form.bedrooms && <div><span className="text-slate-400">Bedrooms</span><br /><span className="font-semibold text-slate-800">{form.bedrooms} BHK</span></div>}
                    <div><span className="text-slate-400">Images</span><br /><span className="font-semibold text-slate-800">{imageFiles.length} photo{imageFiles.length > 1 ? 's' : ''}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Loan Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-400">Bank</span><br /><span className="font-semibold text-slate-800">{form.loanBank}</span></div>
                    <div><span className="text-slate-400">Outstanding</span><br /><span className="font-semibold text-slate-800">₹{Number(form.outstandingLoanAmount).toLocaleString('en-IN')}</span></div>
                    <div><span className="text-slate-400">Monthly EMI</span><br /><span className="font-semibold text-slate-800">₹{Number(form.monthlyEmi).toLocaleString('en-IN')}</span></div>
                    <div><span className="text-slate-400">Remaining Tenure</span><br /><span className="font-semibold text-slate-800">{form.tenureRemainingMonths} months</span></div>
                    {form.interestRate && <div><span className="text-slate-400">Interest Rate</span><br /><span className="font-semibold text-slate-800">{form.interestRate}%</span></div>}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Seller & Documents</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-400">Name</span><br /><span className="font-semibold text-slate-800">{form.sellerFullName}</span></div>
                    <div><span className="text-slate-400">Mobile</span><br /><span className="font-semibold text-slate-800">+91 {form.sellerMobile} ✓</span></div>
                    <div><span className="text-slate-400">Email</span><br /><span className="font-semibold text-slate-800">{form.sellerEmail}</span></div>
                    <div><span className="text-slate-400">PAN</span><br /><span className="font-semibold text-slate-800">{form.panNumber}</span></div>
                    <div><span className="text-slate-400">PAN File</span><br /><span className="font-semibold text-slate-800 truncate">{panFileName}</span></div>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="bg-gradient-to-br from-[#f5f3ff] to-white border border-[#4900e5]/10 rounded-xl p-4">
                <p className="text-sm font-bold text-slate-700 mb-2">What happens next?</p>
                <div className="space-y-2">
                  {[
                    ['support_agent', 'Our team reviews your listing within 1–2 working days'],
                    ['call', 'A team member will contact you to verify details'],
                    ['folder_open', 'Additional documents may be requested if required'],
                    ['verified', 'Once verified, your property goes live on A1 Deal marketplace'],
                  ].map(([icon, text]) => (
                    <div key={text} className="flex items-start gap-2">
                      <span className="material-icons-outlined text-sm text-[#4900e5] mt-0.5">{icon}</span>
                      <p className="text-xs text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
                <span className="material-icons-outlined text-base">arrow_back</span> Back
              </button>
            ) : (
              <button type="button" onClick={cancelNew}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
                Cancel
              </button>
            )}
            <div className="flex-1" />
            {step < 4 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canProceedStep()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-40"
                style={{ backgroundColor: accentColor }}>
                Continue <span className="material-icons-outlined text-base">arrow_forward</span>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50"
                style={{ backgroundColor: accentColor }}>
                {saving ? (
                  <>Submitting…</>
                ) : (
                  <><span className="material-icons-outlined text-base">send</span> Submit Listing</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
