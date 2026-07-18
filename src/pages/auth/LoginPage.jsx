import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthShell from '../../components/common/AuthShell';
import { useAuth } from '../../context/AuthContext';
import { validateForm } from '../../validation/validate';
import { loginSchema } from '../../validation/schemas';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, portalPath } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { value, errors } = validateForm(loginSchema, form);
    if (errors) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const user = await login({ email: value.email, password: value.password });
      // Resume a pending subscription (started as a guest) or honor a redirect.
      const dest = sessionStorage.getItem('pendingPlan')
        ? '/plans'
        : (location.state?.from || portalPath(user.role));
      navigate(dest);
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
    <AuthShell
      footer={
        <button onClick={() => navigate('/')} className="hover:text-slate-500 transition">
          ← Back to home
        </button>
      }
    >
      <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-1">Welcome back</h1>
      <p className="text-slate-400 text-sm mb-7">Sign in to your A1 Deal account</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-center gap-2">
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
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-rose-500">{fieldErrors.email}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            <button type="button" tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
              <span className="material-icons-outlined text-lg">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {fieldErrors.password && <p className="mt-1 text-xs text-rose-500">{fieldErrors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60 mt-2"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary font-semibold hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthShell>
  );
}
