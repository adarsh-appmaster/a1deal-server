import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';

const ROLE_META = {
  broker:        { label: 'Broker',        icon: 'handshake',  color: 'text-rose-500',    bg: 'bg-rose-50'    },
  master_broker: { label: 'Master Broker', icon: 'verified',   color: 'text-[#4900e5]',   bg: 'bg-[#4900e5]/5' },
  developer:     { label: 'Developer',     icon: 'apartment',  color: 'text-sky-600',     bg: 'bg-sky-50'     },
  investor:      { label: 'Investor',      icon: 'trending_up',color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function PendingApproval() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const role  = state?.role  || user?.role  || 'broker';
  const email = state?.email || user?.email || '';
  const meta  = ROLE_META[role] || ROLE_META['broker'];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')}>
            <Logo variant="full" size="lg" />
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${meta.bg} flex items-center justify-center mx-auto mb-5`}>
            <span className={`material-icons-outlined text-3xl ${meta.color}`}>{meta.icon}</span>
          </div>

          <h1 className="font-montserrat font-bold text-2xl text-[#0F172A] mb-1">
            Account Under Review
          </h1>
          <p className="text-slate-400 text-sm mb-5">
            {meta.label} · {email}
          </p>

          {/* Main message */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-outlined text-amber-500 text-xl">support_agent</span>
              <p className="font-semibold text-amber-700 text-sm">Our team will reach you soon</p>
            </div>
            <p className="text-xs text-amber-600 leading-relaxed">
              We've received your registration as a <strong>{meta.label}</strong>. A member of our
              team will contact you within <strong>1–2 business days</strong> to verify your details
              and activate your account.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6 text-left">
            {[
              { icon: 'task_alt',      text: 'Registration received & logged' },
              { icon: 'manage_search', text: 'Team reviews your details & zone' },
              { icon: 'call',          text: 'We\'ll call or email you to confirm' },
              { icon: 'lock_open',     text: 'Account activated — you\'re ready to go' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-sm text-slate-400">{s.icon}</span>
                </div>
                <p className="text-xs text-slate-500">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition"
            >
              Check Status (Sign In)
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:border-slate-300 hover:text-slate-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-6">
          Questions?{' '}
          <a href="mailto:support@a1deal.in" className="hover:text-slate-500 transition">
            support@a1deal.in
          </a>
        </p>
      </div>
    </div>
  );
}
