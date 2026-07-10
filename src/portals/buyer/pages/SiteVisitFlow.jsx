import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { validateForm } from '../../../validation/validate';
import { siteVisitSchema } from '../../../validation/schemas';

const SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];

const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return { label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }), value: d.toISOString().split('T')[0] };
});

export default function SiteVisitFlow() {
  const navigate  = useNavigate();
  const { propertyId } = useParams();
  const location  = useLocation();
  const { user }  = useAuth();

  const { propertyTitle = '', city = '', area = '', propertyModel = 'UnitProperty' } = location.state || {};

  const prefilled = {
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  };
  const isLoggedIn = !!(user && prefilled.name && prefilled.phone && prefilled.email);

  const [step, setStep] = useState(isLoggedIn ? 2 : 1);
  const [form, setForm] = useState({ ...prefilled, date: '', slot: '' });
  const [visit, setVisit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const canProceed1 = form.name && form.phone && form.email;
  const canProceed2 = form.date && form.slot;

  const steps = [
    { n: 1, label: 'Your Details' },
    { n: 2, label: 'Select Slot' },
    { n: 3, label: 'Visit Pass' },
  ];

  const visibleSteps = isLoggedIn ? steps.filter(s => s.n !== 1) : steps;

  async function handleConfirm() {
    setError('');
    const { errors } = validateForm(siteVisitSchema, {
      name: form.name, phone: form.phone, email: form.email, date: form.date, slot: form.slot,
    });
    if (errors) { setError(Object.values(errors)[0]); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/site-visits', {
        name: form.name, phone: form.phone, email: form.email,
        propertyId, propertyModel, propertyTitle, city, area,
        date: form.date, slot: form.slot,
      });
      setVisit(data.visit);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule visit. Please try again.');
    }
    setSaving(false);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-6">
        <span className="material-icons-outlined text-base">arrow_back</span> Back
      </button>

      <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-2">Request Site Visit</h1>
      <p className="text-on-surface-variant text-sm mb-8">{propertyTitle || `Property ID: #${propertyId || '001'}`}</p>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {visibleSteps.map((s, i) => {
          const active = step === s.n;
          const done = step > s.n;
          return (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                {done ? <span className="material-icons-outlined text-sm">check</span> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${active ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{s.label}</span>
              {i < visibleSteps.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-500' : 'bg-outline-variant'}`} />}
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-montserrat font-semibold text-on-surface mb-4">Your Details</h2>
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Rajesh Kumar' },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'rajesh@email.com' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                />
              </div>
            ))}
            <button onClick={() => setStep(2)} disabled={!canProceed1} className="btn-primary w-full disabled:opacity-50 mt-2">
              Next — Choose Slot
            </button>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="space-y-5">
            {isLoggedIn && (
              <div className="flex items-center gap-3 p-3 bg-surface-container rounded-xl mb-2">
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(form.name || form.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{form.name || form.email}</p>
                  <p className="text-xs text-on-surface-variant">{form.phone} · {form.email}</p>
                </div>
              </div>
            )}

            <h2 className="font-montserrat font-semibold text-on-surface">Select Date</h2>
            <div className="grid grid-cols-4 gap-2">
              {DATES.map(d => (
                <button
                  key={d.value}
                  onClick={() => setForm({ ...form, date: d.value })}
                  className={`p-2 rounded-xl text-center text-xs font-semibold border transition-colors ${form.date === d.value ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <h2 className="font-montserrat font-semibold text-on-surface">Select Time Slot</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {SLOTS.map(s => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, slot: s })}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${form.slot === s ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex gap-3">
              {!isLoggedIn && (
                <button onClick={() => setStep(1)} className="btn-ghost flex-1 text-sm py-2.5">Back</button>
              )}
              <button onClick={handleConfirm} disabled={!canProceed2 || saving} className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50">
                {saving ? 'Scheduling…' : 'Confirm Visit'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Visit Pass */}
        {step === 3 && visit && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <span className="material-icons-outlined text-emerald-600 text-3xl">check_circle</span>
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-xl text-on-surface">Site Visit Confirmed!</h2>
              <p className="text-sm text-on-surface-variant mt-1">{visit.date} at {visit.slot}</p>
            </div>

            {/* QR placeholder */}
            <div className="w-44 h-44 mx-auto border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center bg-surface-container">
              <span className="material-icons-outlined text-on-surface-variant text-6xl">qr_code_2</span>
              <p className="text-xs font-mono text-on-surface-variant mt-2">{visit.passCode}</p>
            </div>

            {/* OTP trace badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-5 py-3">
              <span className="material-icons-outlined text-primary text-xl">pin</span>
              <div className="text-left">
                <p className="text-xs text-on-surface-variant">Visit OTP</p>
                <p className="font-mono font-bold text-2xl tracking-[0.3em] text-primary-container">{visit.otp}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant -mt-2">Share this OTP with the site representative to confirm your arrival.</p>

            <div className="bg-surface-container-low rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Visit Details</p>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Name</span><span className="font-semibold text-on-surface">{visit.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Phone</span><span className="font-semibold text-on-surface">{visit.phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Date</span><span className="font-semibold text-on-surface">{visit.date}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Time</span><span className="font-semibold text-on-surface">{visit.slot}</span></div>
              <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Pass Code</span><span className="font-mono font-semibold text-primary-container">{visit.passCode}</span></div>
            </div>

            <button onClick={() => navigate('/buyer')} className="btn-primary w-full">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  );
}
