import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../../components/common/Logo';

export default function DeveloperLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Demo: bypass auth for now
    setTimeout(() => {
      localStorage.setItem('a1deal_user', JSON.stringify({ name: 'Developer User', email: form.email, role: 'developer' }));
      navigate('/developer');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1d2b] to-[#2d3250] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo variant="compact" theme="dark" size="lg" />
          </div>
          <h1 className="font-montserrat font-bold text-2xl text-white mb-2">Developer Portal</h1>
          <p className="text-white/60">Sign in to manage your projects</p>
        </div>
        <div className="glass-card rounded-2xl p-8">
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@company.com"
                className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1">Password</label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
                className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-xs text-on-surface-variant mt-4">
            Don't have an account?{' '}
            <button onClick={() => navigate('/developer/register')} className="text-primary-container font-semibold hover:underline">Register</button>
          </p>
        </div>
        <button onClick={() => navigate('/')} className="block mx-auto mt-6 text-white/50 text-xs hover:text-white transition-colors">
          ← Back to Portal Selector
        </button>
      </div>
    </div>
  );
}
