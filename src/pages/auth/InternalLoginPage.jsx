import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';

const PORTAL_META = {
  admin: { label: 'Super Admin', icon: 'admin_panel_settings', color: '#484a5a', role: 'admin' },
  team: { label: 'Team / Sales CRM', icon: 'groups', color: '#0b5394', role: 'team' },
  bank: { label: 'Bank Portal', icon: 'account_balance', color: '#0f4c81', role: 'bank' },
};

export default function InternalLoginPage() {
  const { portal } = useParams();
  const meta = PORTAL_META[portal] || PORTAL_META.admin;
  const navigate = useNavigate();
  const { login, portalPath } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ email: form.email, password: form.password });
      if (user.role !== meta.role && user.role !== 'admin') {
        setError(`This portal is for ${meta.label} only.`);
        return;
      }
      navigate(portalPath(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')}>
            <Logo variant="full" size="lg" theme="dark" />
          </button>
        </div>

        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: meta.color }}
            >
              <span className="material-icons-outlined text-white text-xl">{meta.icon}</span>
            </div>
            <div>
              <h1 className="font-montserrat font-bold text-lg text-white">{meta.label}</h1>
              <p className="text-slate-400 text-xs">Internal Access Only</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-900/40 border border-rose-700 text-rose-300 text-sm flex items-center gap-2">
              <span className="material-icons-outlined text-base">error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@a1deal.in"
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4900e5]/50 focus:border-[#6236ff] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4900e5]/50 focus:border-[#6236ff] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition disabled:opacity-60 mt-2"
              style={{ backgroundColor: meta.color }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          <button onClick={() => navigate('/')} className="hover:text-slate-400 transition">
            ← Back to home
          </button>
        </p>
      </div>
    </div>
  );
}
