import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../../components/common/Logo';

export default function TeamLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login'); // 'login' | '2fa'
  const [otp, setOtp] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('2fa'); }, 800);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('a1deal_user', JSON.stringify({ name: 'Sales Executive', email: form.email, role: 'team' }));
      navigate('/team');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1c30] to-[#0b5394] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="compact" theme="dark" size="lg" />
          </div>
          <h1 className="font-montserrat font-bold text-2xl text-white mb-2">Team A1 Deal</h1>
          <p className="text-white/60">Internal Sales CRM</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="font-montserrat font-semibold text-on-surface mb-4">Sign In</h2>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Work Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="name@a1deal.com"
                  className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Password</label>
                <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-4">
                <span className="material-icons-outlined text-4xl text-primary-container">lock</span>
                <h2 className="font-montserrat font-semibold text-on-surface mt-2">Two-Factor Authentication</h2>
                <p className="text-xs text-on-surface-variant mt-1">Enter the 6-digit code from your authenticator app</p>
              </div>
              <input
                type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full border border-outline-variant rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              />
              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => setStep('login')} className="w-full text-sm text-on-surface-variant hover:text-primary">
                ← Back
              </button>
            </form>
          )}
        </div>
        <button onClick={() => navigate('/')} className="block mx-auto mt-6 text-white/50 text-xs hover:text-white transition-colors">
          ← Back to Portal Selector
        </button>
      </div>
    </div>
  );
}
