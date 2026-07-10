import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const MAX_WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

// Shared page shell for every auth screen (login, signup, OTP, 2FA, reset
// password, pending approval, onboarding) — same centered card, logo, and
// light/dark background across all of them so they read as one flow.
export default function AuthShell({
  theme = 'light',
  maxWidth = 'sm',
  logoVariant,
  aboveCard,
  footer,
  cardClassName = '',
  children,
}) {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 py-10 ${
      isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2]'
    }`}>
      <div className={`w-full ${MAX_WIDTH[maxWidth] || MAX_WIDTH.sm}`}>
        <div className="flex justify-center mb-8">
          <button onClick={() => navigate('/')}>
            <Logo variant={logoVariant || 'full'} theme={isDark ? 'dark' : undefined} size="lg" />
          </button>
        </div>

        {aboveCard}

        <div className={`rounded-3xl p-8 ${
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white shadow-xl shadow-slate-100'
        } ${cardClassName}`}>
          {children}
        </div>

        {footer && (
          <div className={`text-center text-xs mt-6 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
