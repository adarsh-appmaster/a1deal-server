import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import Logo from '../../components/common/Logo';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')}>
            <Logo variant="full" size="lg" />
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-outlined text-emerald-500 text-3xl">mark_email_read</span>
              </div>
              <h1 className="font-montserrat font-bold text-xl text-[#0F172A] mb-2">Check your email</h1>
              <p className="text-slate-400 text-sm mb-6">
                We sent a 6-digit reset code to <span className="font-semibold text-slate-600">{email}</span>. Enter it on the next page.
              </p>
              <button
                onClick={() => navigate('/reset-password', { state: { email } })}
                className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition"
              >
                Enter Reset Code
              </button>
              <p className="text-xs text-slate-300 mt-4">
                Didn't receive it?{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-[#4900e5] font-semibold hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-montserrat font-bold text-2xl text-[#0F172A] mb-1">Forgot password?</h1>
              <p className="text-slate-400 text-sm mb-7">
                Enter your email and we'll send you a reset code.
              </p>

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
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-60 mt-2"
                >
                  {loading ? 'Sending…' : 'Send Reset Code'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6">
                Remember your password?{' '}
                <Link to="/login" className="text-[#4900e5] font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </>
          )}
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
