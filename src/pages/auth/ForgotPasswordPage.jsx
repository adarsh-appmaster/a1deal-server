import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import AuthShell from '../../components/common/AuthShell';
import { validateForm } from '../../validation/validate';
import { forgotPasswordSchema } from '../../validation/schemas';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { errors } = validateForm(forgotPasswordSchema, { email });
    if (errors) { setError(errors.email); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
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
      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <span className="material-icons-outlined text-emerald-500 text-3xl">mark_email_read</span>
          </div>
          <h1 className="font-montserrat font-bold text-xl text-on-surface mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm mb-6">
            We sent a 6-digit reset code to <span className="font-semibold text-slate-600">{email}</span>. Enter it on the next page.
          </p>
          <button
            onClick={() => navigate('/reset-password', { state: { email } })}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition"
          >
            Enter Reset Code
          </button>
          <p className="text-xs text-slate-300 mt-4">
            Didn't receive it?{' '}
            <button
              onClick={() => setSent(false)}
              className="text-primary font-semibold hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-1">Forgot password?</h1>
          <p className="text-slate-400 text-sm mb-7">
            Enter your email and we'll send you a reset code.
          </p>

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
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60 mt-2"
            >
              {loading ? 'Sending…' : 'Send Reset Code'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
