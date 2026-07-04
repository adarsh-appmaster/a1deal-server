import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = ['Basic Info', 'Location', 'Unit Details', 'Amenities', 'Launch'];

export default function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '', type: '', rera: '', launchDate: '', completionDate: '',
    address: '', city: '', state: '', pincode: '', landmark: '',
    totalUnits: '', configuration: '', priceFrom: '', priceTo: '', totalArea: '',
    amenities: [],
    brokerCommission: '', partnershipPackage: false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (a) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }));

  const AMENITIES = ['Swimming Pool', 'Gymnasium', 'Club House', 'Children Play Area', 'Jogging Track',
    'Power Backup', 'CCTV Security', 'Covered Parking', 'Lift', 'Garden', 'Sports Court', 'Concierge'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/developer/projects')} className="w-9 h-9 rounded-xl border border-outline-variant flex items-center justify-center hover:bg-surface-container">
          <span className="material-icons-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <div>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Create New Project</h1>
          <p className="text-on-surface-variant text-sm">{STEPS[step]}</p>
        </div>
      </div>

      {/* Step bar */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                {i < step ? <span className="material-icons-outlined text-sm">check</span> : i + 1}
              </div>
              <span className={`text-xs mt-1 hidden md:block ${i === step ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-emerald-500' : 'bg-outline-variant'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Project Name" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Skyline Phase 4" />
            <div>
              <label className="field-label">Project Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="field-input">
                <option value="">Select type</option>
                {['Residential', 'Commercial', 'Mixed Use', 'Villa', 'Plotted', 'Hospitality'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <Field label="RERA Registration Number" value={form.rera} onChange={v => set('rera', v)} placeholder="P51900027780" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Launch Date" value={form.launchDate} onChange={v => set('launchDate', v)} type="date" />
              <Field label="Expected Completion" value={form.completionDate} onChange={v => set('completionDate', v)} type="date" />
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Street Address" value={form.address} onChange={v => set('address', v)} placeholder="123 MG Road, Indiranagar" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" value={form.city} onChange={v => set('city', v)} placeholder="Bangalore" />
              <Field label="State" value={form.state} onChange={v => set('state', v)} placeholder="Karnataka" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pincode" value={form.pincode} onChange={v => set('pincode', v)} placeholder="560001" />
              <Field label="Nearest Landmark" value={form.landmark} onChange={v => set('landmark', v)} placeholder="Near Metro Station" />
            </div>
            <div className="h-48 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center">
              <div className="text-center text-on-surface-variant">
                <span className="material-icons-outlined text-4xl block mb-2">map</span>
                <p className="text-sm">Map preview — pin location on map</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Unit Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Total Units" value={form.totalUnits} onChange={v => set('totalUnits', v)} type="number" placeholder="240" />
              <Field label="Total Area (Acres)" value={form.totalArea} onChange={v => set('totalArea', v)} placeholder="5.2" />
            </div>
            <Field label="Configuration" value={form.configuration} onChange={v => set('configuration', v)} placeholder="1BHK, 2BHK, 3BHK, 4BHK" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price Starting From" value={form.priceFrom} onChange={v => set('priceFrom', v)} placeholder="₹ 75,00,000" />
              <Field label="Price Up To" value={form.priceTo} onChange={v => set('priceTo', v)} placeholder="₹ 3,20,00,000" />
            </div>
            <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
              <input type="checkbox" id="pkg" checked={form.partnershipPackage} onChange={e => set('partnershipPackage', e.target.checked)} className="w-4 h-4 accent-primary" />
              <label htmlFor="pkg" className="text-sm font-medium text-on-surface cursor-pointer">
                Create Partnership Package for Brokers
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Amenities */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">Select all amenities available in this project</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES.map(a => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left ${form.amenities.includes(a) ? 'bg-primary/10 border-primary text-primary-container' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <span className={`material-icons-outlined text-base ${form.amenities.includes(a) ? 'text-primary-container' : ''}`}>
                    {form.amenities.includes(a) ? 'check_box' : 'check_box_outline_blank'}
                  </span>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Launch */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
              <div className="flex items-start gap-3">
                <span className="material-icons-outlined text-emerald-600 text-2xl">check_circle</span>
                <div>
                  <p className="font-semibold text-emerald-800">{form.name || 'New Project'} is ready to launch</p>
                  <p className="text-sm text-emerald-700 mt-1">Review your details and go live on the A1 Deal marketplace.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Type', form.type], ['City', form.city], ['RERA', form.rera],
                ['Total Units', form.totalUnits], ['Price Range', `${form.priceFrom} – ${form.priceTo}`],
                ['Amenities', `${form.amenities.length} selected`],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface-container-low rounded-xl p-3">
                  <p className="text-xs text-on-surface-variant mb-1">{k}</p>
                  <p className="font-semibold text-on-surface">{v || '—'}</p>
                </div>
              ))}
            </div>
            <div>
              <Field label="Broker Commission %" value={form.brokerCommission} onChange={v => set('brokerCommission', v)} placeholder="2.0" />
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-ghost flex-1 text-sm py-2.5">Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="btn-primary flex-1 text-sm py-2.5">
              Next — {STEPS[step + 1]}
            </button>
          ) : (
            <button onClick={() => navigate('/developer/projects')} className="btn-primary flex-1 text-sm py-2.5">
              <span className="material-icons-outlined text-base align-middle mr-1">rocket_launch</span>
              Launch Project
            </button>
          )}
        </div>
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
