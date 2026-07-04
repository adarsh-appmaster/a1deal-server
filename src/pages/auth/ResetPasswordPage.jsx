import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api/axios';
import Logo from '../../components/common/Logo';

const OTP_LEN = 6;

export default function ResetPasswordPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail]           = useState(emailFromState);
  const [digits, setDigits]         = useState(Array(OTP_LEN).fill(''));
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [cooldown, setCooldown]     = useState(60); // starts counting immediately
  const [resending, setResending]   = useState(false);
  const inputRefs = useRef([]);

  // 1-minute cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const focusAt = (i) => inputRefs.current[i]?.focus();

  const handleDigitChange = useCallback((i, val) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[i] = ch;
      return next;
    });
    if (ch && i < OTP_LEN - 1) focusAt(i + 1);
  }, []);

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) focusAt(i - 1);
    if (e.key === 'ArrowLeft'  && i > 0)          focusAt(i - 1);
    if (e.key === 'ArrowRight' && i < OTP_LEN - 1) focusAt(i + 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    focusAt(Math.min(pasted.length, OTP_LEN - 1));
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-forgot-otp', { email });
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const otp = digits.join('');
    if (otp.length < OTP_LEN) return setError('Please enter all 6 digits.');
    if (!password)             return setError('Please enter a new password.');
    if (password.length < 6)  return setError('Password must be at least 6 characters.');
    if (password !== confirm)  return setError('Passwords do not match.');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <button onClick={() => navigate('/')}><Logo variant="full" size="lg" /></button>
          </div>
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons-outlined text-emerald-500 text-3xl">check_circle</span>
            </div>
            <h1 className="font-montserrat font-bold text-xl text-[#0F172A] mb-2">Password reset!</h1>
            <p className="text-slate-400 text-sm mb-6">Your password has been updated. You can now sign in with your new password.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')}><Logo variant="full" size="lg" /></button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8">
          <h1 className="font-montserrat font-bold text-2xl text-[#0F172A] mb-1">Reset password</h1>
          <p className="text-slate-400 text-sm mb-7">
            Enter the 6-digit code we sent to{' '}
            {email
              ? <span className="font-semibold text-slate-600">{email}</span>
              : 'your email'
            }, then choose a new password.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-2">
              <span className="material-icons-outlined text-base">error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field (shown only if not pre-filled from state) */}
            {!emailFromState && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] transition"
                />
              </div>
            )}

            {/* OTP boxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Reset Code</label>
              <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] transition bg-slate-50 text-[#0F172A]"
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="flex items-center justify-end mt-2">
                {cooldown > 0 ? (
                  <span className="text-xs text-slate-400">
                    Resend in <span className="font-semibold text-slate-600">{cooldown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-xs text-[#4900e5] font-semibold hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Sending…' : 'Resend code'}
                  </button>
                )}
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">New Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-icons-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Confirm Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-60"
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            <Link to="/forgot-password" className="text-[#4900e5] font-semibold hover:underline">
              ← Back
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6">
          <button onClick={() => navigate('/')} className="hover:text-slate-500 transition">
            ← Back to home
          </button>
        </p>
      </div>
    </div>
  );
}
