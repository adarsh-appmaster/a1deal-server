import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import AuthShell from '../../components/common/AuthShell';
import { useAuth } from '../../context/AuthContext';
import { INDIA_STATES } from '../../data/indiaLocations';
import { expandPincodesForCity } from '../../data/rajasthanPincodes';
import api from '../../api/axios';
import { validateForm } from '../../validation/validate';
import { signupSchema } from '../../validation/schemas';

const RAJASTHAN_CITIES = INDIA_STATES['Rajasthan'] || [];

const ROLES = [
  { value: 'buyer',         label: 'Buyer',         icon: 'home',          desc: 'Browse & purchase properties' },
  { value: 'broker',        label: 'Broker',         icon: 'handshake',     desc: 'Manage listings & leads' },
  { value: 'developer',     label: 'Developer',      icon: 'apartment',     desc: 'List & sell projects', approval: true },
  { value: 'bank',          label: 'Bank',           icon: 'account_balance', desc: 'List mortgage & auction properties', approval: true },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  // Opened from a broker's public card (?ref=): lock the role to Buyer and prefill
  // the card's city/pincode so the lead is attributed to that broker.
  const fromCard = !!searchParams.get('ref');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: fromCard ? 'buyer' : (searchParams.get('role') || 'buyer'),
    phone: '',
    company: '',
    city: searchParams.get('city') || '',
    area: '',
    pincode: searchParams.get('pincode') || '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const cityFieldRef = useRef(null);

  const [pincodeDropdownOpen, setPincodeDropdownOpen] = useState(false);
  const [pincodeSearch, setPincodeSearch] = useState('');
  const pincodeFieldRef = useRef(null);

  const filteredCities = RAJASTHAN_CITIES.filter(c =>
    c.toLowerCase().includes(citySearch.trim().toLowerCase())
  );

  const cityPincodes = expandPincodesForCity(form.city);
  const filteredPincodes = cityPincodes.filter(p => p.includes(pincodeSearch.trim()));

  useEffect(() => {
    if (!cityDropdownOpen) return;
    function handleOutside(e) {
      if (cityFieldRef.current && !cityFieldRef.current.contains(e.target)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [cityDropdownOpen]);

  useEffect(() => {
    if (!pincodeDropdownOpen) return;
    function handleOutside(e) {
      if (pincodeFieldRef.current && !pincodeFieldRef.current.contains(e.target)) {
        setPincodeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [pincodeDropdownOpen]);

  // Master broker coverage map
  const [coverage, setCoverage]         = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [selectedPins, setSelectedPins] = useState([]);
  const debounceRef = useRef(null);

  const selectedRole    = ROLES.find((r) => r.value === form.role);
  const needsApproval   = selectedRole?.approval;
  const isBuyerOrBroker = ['buyer', 'broker'].includes(form.role);

  function setField(name, value) {
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: '' }));
    setApiError('');
  }

  function validate() {
    const { errors } = validateForm(signupSchema, form);
    return errors || {};
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { name, email, password, phone, company, city, area } = form;
      const role = form.role;
      // Attribute a buyer who registered via a broker's card to that broker.
      const refBroker = role === 'buyer'
        ? (searchParams.get('ref') || sessionStorage.getItem('refBroker') || undefined)
        : undefined;
      await register({
        name, email, password, role, phone, company,
        city: form.city?.trim() || undefined,
        area: form.area?.trim() || undefined,
        pincode: form.pincode?.trim() || undefined,
        ...(refBroker ? { refBroker } : {}),
      });
      if (refBroker) sessionStorage.removeItem('refBroker');
      navigate('/verify-otp', { state: { email, role } });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const INP = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-400'
        : 'border-slate-200 focus:ring-primary/30 focus:border-primary'
    }`;

  return (
    <AuthShell
      maxWidth="md"
      footer={
        <button onClick={() => navigate('/')} className="hover:text-slate-500 transition">← Back to home</button>
      }
    >
      <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-1">Create account</h1>
      <p className="text-slate-400 text-sm mb-6">Join India's premier real estate platform</p>

      {apiError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-center gap-2">
          <span className="material-icons-outlined text-base">error_outline</span>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role selector — locked to Buyer when signing up via a broker card */}
        {fromCard ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5">
            <span className="material-icons-outlined text-primary">home</span>
            <div>
              <p className="text-sm font-semibold text-primary">Signing up as a Buyer</p>
              <p className="text-xs text-slate-400">You'll be connected with the broker whose card you visited.</p>
            </div>
          </div>
        ) : (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">I am a</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setForm(f => ({ ...f, role: r.value, city: '' })); setCoverage([]); setSelectedPins([]); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.role === r.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="material-icons-outlined text-base">{r.icon}</span>
                <span>{r.label}</span>
                {r.approval && (
                  <span className="ml-auto text-[10px] bg-amber-100 text-amber-600 px-1 rounded">Approval</span>
                )}
              </button>
            ))}
          </div>
          {needsApproval && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
              <span className="material-icons-outlined text-sm">info</span>
              {selectedRole.label} accounts require admin approval before access.
            </p>
          )}
        </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Full Name</label>
          <input name="name" type="text" required value={form.name}
            onChange={e => setField('name', e.target.value)}
            placeholder="Ravi Sharma"
            className={INP('name')} />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <span className="material-icons-outlined text-sm">error_outline</span>{errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
          <input name="email" type="email" required value={form.email}
            onChange={e => setField('email', e.target.value)}
            placeholder="ravi@example.com"
            className={INP('email')} />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <span className="material-icons-outlined text-sm">error_outline</span>{errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone</label>
          <input name="phone" type="tel" value={form.phone}
            onChange={e => setField('phone', e.target.value)}
            placeholder="+91 98765 43210"
            className={INP('phone')} />
          {errors.phone && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <span className="material-icons-outlined text-sm">error_outline</span>{errors.phone}
            </p>
          )}
        </div>

        {/* Company */}
        {['developer', 'broker', 'investor'].includes(form.role) && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Company / Firm Name <span className="normal-case font-normal text-slate-300">(optional)</span>
            </label>
            <input name="company" type="text" value={form.company}
              onChange={e => setField('company', e.target.value)}
              placeholder="Acme Realty Pvt. Ltd."
              className={INP('company')} />
          </div>
        )}

        {/* City + Area + Pincode for buyer / standard broker */}
        {isBuyerOrBroker && (
          <div className="grid grid-cols-2 gap-3">
            <div className="relative" ref={cityFieldRef}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
              <button type="button"
                onClick={() => { setCityDropdownOpen(v => !v); setCitySearch(''); }}
                className={`${INP('city')} flex items-center justify-between text-left ${!form.city ? 'text-slate-400' : ''}`}>
                {form.city || 'Select city'}
                <span className="material-icons-outlined text-base text-slate-400">
                  {cityDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {cityDropdownOpen && (
                <div className="absolute z-20 top-full mt-1.5 left-1/2 -translate-x-1/2 w-64 max-w-[80vw] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <input type="text" autoFocus value={citySearch}
                      onChange={e => setCitySearch(e.target.value)}
                      placeholder="Search city…"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {filteredCities.length === 0 && (
                      <p className="px-4 py-2 text-sm text-slate-400 italic">No cities found</p>
                    )}
                    {filteredCities.map(c => (
                      <button key={c} type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, city: c, pincode: f.city === c ? f.pincode : '' }));
                          setErrors(e => ({ ...e, city: '', pincode: '' }));
                          setCityDropdownOpen(false);
                          setCitySearch('');
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition ${
                          form.city === c ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Area / Locality <span className="normal-case font-normal text-slate-300">(optional)</span>
              </label>
              <input name="area" type="text" value={form.area}
                onChange={e => setField('area', e.target.value)}
                placeholder="Vaishali Nagar"
                className={INP('area')} />
            </div>
            <div className="col-span-2 relative" ref={pincodeFieldRef}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Pincode</label>
              <button type="button" disabled={!form.city}
                onClick={() => { setPincodeDropdownOpen(v => !v); setPincodeSearch(''); }}
                className={`${INP('pincode')} flex items-center justify-between text-left ${!form.pincode ? 'text-slate-400' : ''} ${!form.city ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {form.pincode || (form.city ? 'Select pincode' : 'Select city first')}
                <span className="material-icons-outlined text-base text-slate-400">
                  {pincodeDropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {pincodeDropdownOpen && form.city && (
                <div className="absolute z-20 top-full mt-1.5 left-1/2 -translate-x-1/2 w-64 max-w-[80vw] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-slate-100">
                    <input type="text" autoFocus value={pincodeSearch}
                      onChange={e => setPincodeSearch(e.target.value)}
                      placeholder="Search pincode…"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {filteredPincodes.length === 0 && (
                      <p className="px-4 py-2 text-sm text-slate-400 italic">No pincodes found for {form.city}</p>
                    )}
                    {filteredPincodes.map(p => (
                      <button key={p} type="button"
                        onClick={() => { setField('pincode', p); setPincodeDropdownOpen(false); setPincodeSearch(''); }}
                        className={`w-full text-left px-4 py-2 text-sm transition ${
                          form.pincode === p ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-600 hover:bg-slate-50'
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Password</label>
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password}
              onChange={e => setField('password', e.target.value)}
              placeholder="Min. 8 characters, with a letter & number"
              className={`${INP('password')} pr-11`} />
            <button type="button" tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
              <span className="material-icons-outlined text-lg">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <span className="material-icons-outlined text-sm">error_outline</span>{errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Confirm Password</label>
          <div className="relative">
            <input name="confirm" type={showConfirm ? 'text' : 'password'} required value={form.confirm}
              onChange={e => setField('confirm', e.target.value)}
              placeholder="••••••••"
              className={`${INP('confirm')} pr-11`} />
            <button type="button" tabIndex={-1}
              onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
              <span className="material-icons-outlined text-lg">
                {showConfirm ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.confirm && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <span className="material-icons-outlined text-sm">error_outline</span>{errors.confirm}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60 mt-2">
          {loading ? 'Sending OTP…' : 'Continue with Email OTP'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
      </p>
    </AuthShell>
  );
}
