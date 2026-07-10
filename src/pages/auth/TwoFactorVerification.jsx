import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthShell from '../../components/common/AuthShell';

export default function TwoFactorVerification() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

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
    const full = code.join('');
    if (full.length < 6) { setError('Please enter the complete 6-digit code'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    if (full === '123456') {
      navigate('/team');
    } else {
      setError('Invalid code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResent(true);
    setCode(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
    setTimeout(() => setResent(false), 30000);
  };

  return (
    <AuthShell
      theme="dark"
      logoVariant="compact"
      footer={
        <>
          <button onClick={() => navigate('/team/login')} className="hover:text-slate-400 transition">
            ← Back to login
          </button>
          <p className="mt-2 text-slate-700">
            Use code <span className="font-mono text-slate-500">123456</span> to demo
          </p>
        </>
      }
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-5">
        <span className="material-icons-outlined text-3xl text-primary-container">security</span>
      </div>

      <h1 className="font-montserrat font-bold text-xl text-white text-center mb-1">
        Two-Factor Verification
      </h1>
      <p className="text-slate-400 text-sm text-center mb-6">
        Enter the 6-digit code from your authenticator app
        {state?.email && <><br /><span className="text-slate-300 font-medium">{state.email}</span></>}
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-900/40 border border-rose-700 text-rose-300 text-sm text-center">
          {error}
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
            className={`w-11 h-12 rounded-xl text-center text-lg font-bold bg-slate-700 border-2 text-white focus:outline-none transition-colors
              ${digit ? 'border-primary-container' : 'border-slate-600'}
              ${error ? 'border-rose-500' : 'focus:border-primary-container'}`}
          />
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || code.some(d => !d)}
        className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-50 mb-4"
      >
        {loading ? 'Verifying…' : 'Verify & Sign In'}
      </button>

      <div className="text-center">
        {resent ? (
          <p className="text-xs text-emerald-400 flex items-center justify-center gap-1">
            <span className="material-icons-outlined text-base">check_circle</span>
            New code sent to your authenticator
          </p>
        ) : (
          <button
            onClick={handleResend}
            className="text-sm text-slate-400 hover:text-slate-200 transition"
          >
            Didn't get a code? <span className="text-[#a78bfa] font-semibold">Resend</span>
          </button>
        )}
      </div>
    </AuthShell>
  );
}
