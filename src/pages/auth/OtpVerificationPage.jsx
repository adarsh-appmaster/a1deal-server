import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthShell from '../../components/common/AuthShell';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { validateForm } from '../../validation/validate';
import { otpSchema } from '../../validation/schemas';

export default function OtpVerificationPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login: ctxLogin } = useAuth();

  const email = state?.email || '';
  const role  = state?.role  || '';

  const [code, setCode]       = useState(['', '', '', '', '', '']);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]   = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    setError('');
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setCode(paste.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    const { errors } = validateForm(otpSchema, { otp });
    if (errors) { setError(errors.otp); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      if (data.pending) {
        // Try to post pending MB inquiry without auth (public endpoint)
        const mbInquiry = sessionStorage.getItem('pendingMBInquiry');
        if (mbInquiry) {
          try { await api.post('/master-broker/inquiry', JSON.parse(mbInquiry)); } catch { /* silent */ }
          sessionStorage.removeItem('pendingMBInquiry');
        }
        navigate('/pending', { state: { role: data.role, email } });
      } else {
        ctxLogin({ token: data.token, user: data.user });
        // Post pending MB inquiry now that auth token is set
        const mbInquiry = sessionStorage.getItem('pendingMBInquiry');
        if (mbInquiry) {
          try { await api.post('/master-broker/inquiry', JSON.parse(mbInquiry)); } catch { /* silent */ }
          sessionStorage.removeItem('pendingMBInquiry');
        }
        // Master broker signup: registered as broker but needs admin approval before
        // accessing the portal — send to pending screen instead of broker portal.
        if (role === 'master_broker' && data.user.role === 'broker') {
          navigate('/pending', { state: { role: 'master_broker', email } });
          return;
        }
        const paths = { buyer: '/buyer', broker: '/broker', developer: '/developer', investor: '/investor' };
        navigate(paths[data.user.role] || '/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-otp', { email });
      setResent(true);
      setCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      logoVariant="compact"
      footer={
        <button onClick={() => navigate('/signup')} className="hover:text-slate-600 transition">
          ← Back to Sign Up
        </button>
      }
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <span className="material-icons-outlined text-3xl text-primary">mark_email_read</span>
      </div>

      <h1 className="font-montserrat font-bold text-xl text-on-surface text-center mb-1">
        Check your email
      </h1>
      <p className="text-slate-400 text-sm text-center mb-1">
        We sent a 6-digit code to
      </p>
      <p className="text-primary font-semibold text-sm text-center mb-6 truncate px-4">
        {email || 'your email'}
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm text-center">
          {error}
        </div>
      )}

      {resent && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-center flex items-center justify-center gap-1.5">
          <span className="material-icons-outlined text-base">check_circle</span>
          New code sent! Check your inbox.
        </div>
      )}

      {/* OTP inputs */}
      <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={el => inputs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`w-11 h-12 rounded-xl text-center text-lg font-bold bg-slate-50 border-2 text-on-surface focus:outline-none transition-colors
              ${digit ? 'border-primary bg-primary/5' : 'border-slate-200'}
              ${error ? 'border-rose-400 bg-rose-50' : 'focus:border-primary'}`}
          />
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || code.some(d => !d)}
        className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-50 mb-4"
      >
        {loading ? 'Verifying…' : 'Verify & Continue'}
      </button>

      <div className="text-center">
        {cooldown > 0 ? (
          <p className="text-xs text-slate-400">
            Resend available in <span className="font-semibold text-slate-600">{cooldown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
          >
            Didn't get a code?{' '}
            <span className="text-primary font-semibold">
              {resending ? 'Sending…' : 'Resend'}
            </span>
          </button>
        )}
      </div>
    </AuthShell>
  );
}
