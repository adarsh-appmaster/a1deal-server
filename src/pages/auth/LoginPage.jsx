import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
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
      navigate(portalPath(user.role));
    } catch (err) {
      const data = err.response?.data;
      if (data?.unverified) {
        navigate('/verify-otp', { state: { email: data.email } });
      } else if (data?.pending) {
        navigate('/pending', { state: { role: data.role, email: form.email } });
      } else {
        setError(data?.message || 'Login failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')}>
            <Logo variant="full" size="lg" />
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8">
          <h1 className="font-montserrat font-bold text-2xl text-[#0F172A] mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-7">Sign in to your A1 Deal account</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-2">
              <span className="material-icons-outlined text-base">error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] transition"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#4900e5] font-semibold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-60 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#4900e5] font-semibold hover:underline">
              Sign Up
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
