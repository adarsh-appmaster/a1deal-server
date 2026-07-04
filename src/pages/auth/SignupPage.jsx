import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';
import { INDIA_STATES } from '../../data/indiaLocations';
import api from '../../api/axios';

const RAJASTHAN_CITIES = INDIA_STATES['Rajasthan'] || [];

const ROLES = [
  { value: 'buyer',         label: 'Buyer',         icon: 'home',          desc: 'Browse & purchase properties' },
  { value: 'broker',        label: 'Broker',         icon: 'handshake',     desc: 'Manage listings & leads' },
  { value: 'master_broker', label: 'Master Broker',  icon: 'verified',      desc: 'Lead broker network in your zone', approval: true },
  { value: 'developer',     label: 'Developer',      icon: 'apartment',     desc: 'List & sell projects', approval: true },
  { value: 'investor',      label: 'Investor',       icon: 'trending_up',   desc: 'Invest in properties & track ROI', approval: true },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: searchParams.get('role') || 'buyer',
    phone: '',
    company: '',
    city: '',
    pincode: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Master broker coverage map
  const [coverage, setCoverage]         = useState([]);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [selectedPins, setSelectedPins] = useState([]);
  const debounceRef = useRef(null);

  const selectedRole    = ROLES.find((r) => r.value === form.role);
  const needsApproval   = selectedRole?.approval;
  const isMasterBroker  = form.role === 'master_broker';
  const isBuyerOrBroker = ['buyer', 'broker'].includes(form.role);

  // Fetch pincode coverage when city changes (master broker only)
  useEffect(() => {
    if (!isMasterBroker || !form.city) { setCoverage([]); setSelectedPins([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCoverageLoading(true);
      try {
        const { data } = await api.get(`/master-broker/coverage-map?city=${encodeURIComponent(form.city)}`);
        setCoverage(data.coverage || []);
      } catch { setCoverage([]); }
      setCoverageLoading(false);
    }, 500);
    setSelectedPins([]);
  }, [form.city, isMasterBroker]);

  function togglePin(pincode) {
    setSelectedPins(prev => prev.includes(pincode) ? prev.filter(p => p !== pincode) : [...prev, pincode]);
  }

  const available = coverage.filter(c => c.available);
  const taken     = coverage.filter(c => !c.available);

  function setField(name, value) {
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: '' }));
    setApiError('');
  }

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name    = 'Full name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    if (!form.phone.trim())   e.phone   = 'Phone number is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    if (isMasterBroker && !form.city) e.city = 'Please select a city';
    return e;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { name, email, password, phone, company, city } = form;

      if (isMasterBroker) {
        // Backend doesn't allow master_broker role — register as broker.
        // Save inquiry data to sessionStorage; OTP page posts it after auth token is set.
        await register({ name, email, password, role: 'broker', phone, company });
        sessionStorage.setItem('pendingMBInquiry', JSON.stringify({
          name, phone, email,
          source: 'signup',
          motivation: company ? `Company: ${company}` : 'Master Broker direct signup',
          requestedAreas: selectedPins.length
            ? selectedPins.map(p => ({ city, area: '', pincode: p }))
            : [{ city, area: '', pincode: '' }],
        }));
        navigate('/verify-otp', { state: { email, role: 'master_broker' } });
      } else {
        const role = form.role;
        await register({
          name, email, password, role, phone, company,
          city: form.city?.trim() || undefined,
          pincode: form.pincode?.trim() || undefined,
        });
        navigate('/verify-otp', { state: { email, role } });
      }
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
        : 'border-slate-200 focus:ring-[#4900e5]/30 focus:border-[#4900e5]'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')}>
            <Logo variant="full" size="lg" />
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8">
          <h1 className="font-montserrat font-bold text-2xl text-[#0F172A] mb-1">Create account</h1>
          <p className="text-slate-400 text-sm mb-6">Join India's premier real estate platform</p>

          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-2">
              <span className="material-icons-outlined text-base">error_outline</span>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
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
                        ? 'border-[#4900e5] bg-[#4900e5]/5 text-[#4900e5]'
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

            {/* ── Master Broker Coverage Zone ── */}
            {isMasterBroker && (
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-icons-outlined text-sm">location_on</span>
                  Coverage Zone — Rajasthan
                </p>

                {/* State locked */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">State</label>
                  <input readOnly value="Rajasthan"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed" />
                </div>

                {/* City chip picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                    City *
                    {form.city && <span className="ml-2 normal-case font-normal text-[#4900e5]">({form.city})</span>}
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {RAJASTHAN_CITIES.map(c => (
                      <button key={c} type="button"
                        onClick={() => setField('city', c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                          ${form.city === c
                            ? 'bg-[#4900e5] text-white border-[#4900e5] shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#4900e5] hover:text-[#4900e5]'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {errors.city && (
                    <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">error_outline</span>{errors.city}
                    </p>
                  )}
                </div>

                {/* Pincode coverage map */}
                {form.city && (
                  <div className="rounded-xl border border-amber-100 bg-white p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Pincodes</p>
                      {coverageLoading && <span className="text-xs text-[#4900e5] animate-pulse">Loading…</span>}
                    </div>

                    {!coverageLoading && coverage.length === 0 && (
                      <p className="text-xs text-slate-400 italic">
                        No pincodes mapped yet for {form.city}. You can still sign up — our team will assign your zone.
                      </p>
                    )}

                    {!coverageLoading && available.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Available ({available.length})</p>
                          <button type="button" onClick={() => setSelectedPins(available.map(c => c.pincode))}
                            className="ml-auto text-[10px] text-[#4900e5] font-semibold hover:underline">Select all</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {available.map(c => (
                            <button type="button" key={c.pincode} onClick={() => togglePin(c.pincode)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                                ${selectedPins.includes(c.pincode)
                                  ? 'bg-[#4900e5] text-white border-[#4900e5] shadow-sm'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-[#4900e5] hover:text-[#4900e5]'}`}>
                              {selectedPins.includes(c.pincode) ? '✓ ' : ''}{c.pincode}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!coverageLoading && taken.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Already Taken ({taken.length})</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {taken.map(c => (
                            <div key={c.pincode} title={`Taken by ${c.takenBy?.name || 'a master broker'}`}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed flex items-center gap-1">
                              <span className="material-icons-outlined text-[10px]">lock</span>{c.pincode}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPins.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#4900e5]">
                          Selected ({selectedPins.length}): {selectedPins.join(', ')}
                        </p>
                        <button type="button" onClick={() => setSelectedPins([])}
                          className="text-[10px] text-slate-400 hover:text-rose-500">Clear</button>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-amber-600">
                  You can manage more pincodes after admin approval from your dashboard.
                </p>
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
            {['developer', 'broker', 'investor', 'master_broker'].includes(form.role) && (
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

            {/* City + Pincode for buyer / standard broker */}
            {isBuyerOrBroker && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
                  <input name="city" type="text" value={form.city}
                    onChange={e => setField('city', e.target.value)}
                    placeholder="Jaipur"
                    className={INP('city')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Pincode</label>
                  <input name="pincode" type="text" value={form.pincode}
                    onChange={e => setField('pincode', e.target.value)}
                    placeholder="302001"
                    maxLength={6}
                    className={INP('pincode')} />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  placeholder="Min. 6 characters"
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
              className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-60 mt-2">
              {loading ? 'Sending OTP…' : 'Continue with Email OTP'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#4900e5] font-semibold hover:underline">Sign In</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6">
          <button onClick={() => navigate('/')} className="hover:text-slate-500 transition">← Back to home</button>
        </p>
      </div>
    </div>
  );
}
