import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../../components/common/Logo';

const STEPS = ['Company Info', 'Contact Details', 'KYC Documents', 'Review'];

export default function DeveloperRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    companyName: '', reraId: '', city: '', projectType: '',
    contactName: '', email: '', phone: '', designation: '',
    panCard: null, gstCert: null, reraDoc: null,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2b] to-[#2d3250] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Logo variant="compact" theme="dark" size="md" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary-container text-white' : 'bg-white/10 text-white/40'}`}>
                {i < step ? <span className="material-icons-outlined text-sm">check</span> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block mx-1 ${i === step ? 'text-white font-semibold' : 'text-white/40'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? 'bg-emerald-500' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-montserrat font-bold text-xl text-on-surface mb-6">{STEPS[step]}</h2>

          {/* Step 0: Company Info */}
          {step === 0 && (
            <div className="space-y-4">
              <Field label="Company / Developer Name" value={form.companyName} onChange={v => set('companyName', v)} placeholder="Prestige Group Pvt. Ltd." />
              <Field label="RERA Registration ID" value={form.reraId} onChange={v => set('reraId', v)} placeholder="P51900027780" />
              <Field label="Primary City" value={form.city} onChange={v => set('city', v)} placeholder="Bangalore" />
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Project Type</label>
                <select value={form.projectType} onChange={e => set('projectType', e.target.value)}
                  className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                  <option value="">Select type</option>
                  {['Residential', 'Commercial', 'Mixed Use', 'Plotted Development', 'Hospitality'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Primary Contact Name" value={form.contactName} onChange={v => set('contactName', v)} placeholder="Rajesh Kumar" />
              <Field label="Designation" value={form.designation} onChange={v => set('designation', v)} placeholder="VP – Sales & Marketing" />
              <Field label="Official Email" value={form.email} onChange={v => set('email', v)} type="email" placeholder="rajesh@company.com" />
              <Field label="Phone Number" value={form.phone} onChange={v => set('phone', v)} type="tel" placeholder="+91 98765 43210" />
            </div>
          )}

          {/* Step 2: KYC */}
          {step === 2 && (
            <div className="space-y-4">
              {[
                { label: 'PAN Card (Company)', key: 'panCard', hint: 'PDF / JPG, max 5MB' },
                { label: 'GST Certificate', key: 'gstCert', hint: 'PDF / JPG, max 5MB' },
                { label: 'RERA Registration Document', key: 'reraDoc', hint: 'PDF only, max 10MB' },
              ].map(doc => (
                <div key={doc.key}>
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">{doc.label}</label>
                  <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition-colors ${form[doc.key] ? 'border-emerald-400 bg-emerald-50' : 'border-outline-variant hover:border-primary bg-white'}`}>
                    <span className={`material-icons-outlined text-2xl ${form[doc.key] ? 'text-emerald-600' : 'text-on-surface-variant'}`}>
                      {form[doc.key] ? 'check_circle' : 'upload_file'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{form[doc.key] ? form[doc.key].name : 'Click to upload'}</p>
                      <p className="text-xs text-on-surface-variant">{doc.hint}</p>
                    </div>
                    <input type="file" className="hidden" onChange={e => set(doc.key, e.target.files[0])} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <ReviewRow label="Company" value={form.companyName} />
              <ReviewRow label="RERA ID" value={form.reraId} />
              <ReviewRow label="City" value={form.city} />
              <ReviewRow label="Project Type" value={form.projectType} />
              <ReviewRow label="Contact" value={form.contactName} />
              <ReviewRow label="Email" value={form.email} />
              <ReviewRow label="Phone" value={form.phone} />
              <div className="border-t border-outline-variant pt-4">
                <p className="text-xs text-on-surface-variant">By registering, you agree to A1 Deal's Terms of Service and Privacy Policy. Your account will be reviewed within 2 business days.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-1 text-sm py-2.5">Back</button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary flex-1 text-sm py-2.5">
                Next — {STEPS[step + 1]}
              </button>
            ) : (
              <button onClick={() => navigate('/developer')} className="btn-primary flex-1 text-sm py-2.5">
                Submit Registration
              </button>
            )}
          </div>
        </div>

        <button onClick={() => navigate('/developer/login')} className="block mx-auto mt-6 text-white/50 text-xs hover:text-white transition-colors">
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-outline-variant">
      <span className="text-xs text-on-surface-variant uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-on-surface">{value || '—'}</span>
    </div>
  );
}
