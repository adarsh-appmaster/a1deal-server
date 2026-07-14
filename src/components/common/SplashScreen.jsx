import { useEffect, useState } from 'react';
import logoFull from '../../assets/logo-full.svg';

// App-launch splash screen.
// Shows the A1 Deal logo on the brand gradient the moment the app boots
// (cold load / refresh), then fades out once the app is ready. Tuned for the
// mobile app experience — a full-screen branded launch screen — but renders on
// every viewport for a consistent boot.
//
// Only plays once per browser-tab session, so an in-app refresh after the first
// launch doesn't replay it. Respects prefers-reduced-motion by skipping the
// pop/bounce animations (the fade-out still runs).
const SHOW_MS = 1600;   // how long the logo holds before fading out
const FADE_MS = 500;    // fade-out duration (keep in sync with duration-500)

export default function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('a1deal_splash_shown');
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem('a1deal_splash_shown', '1');
    const fadeTimer = setTimeout(() => setLeaving(true), SHOW_MS);
    const doneTimer = setTimeout(() => setVisible(false), SHOW_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="A1 Deal — loading"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity ease-out duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(160deg, #451886 0%, #6236ff 55%, #792fd0 100%)',
      }}
    >
      {/* Logo on a white pill so the purple logo mark stays crisp on the
          gradient — mirrors how the app presents the logo on dark surfaces. */}
      <div className="motion-safe:animate-splash-pop">
        <div className="bg-white rounded-3xl shadow-level-3 px-8 py-7">
          <img
            src={logoFull}
            alt="A1 Deal"
            className="h-24 sm:h-28 w-auto object-contain"
          />
        </div>
      </div>

      {/* Loading dots */}
      <div className="mt-9 flex items-center gap-2" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-white/90 motion-safe:animate-splash-dot" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 rounded-full bg-white/90 motion-safe:animate-splash-dot" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 rounded-full bg-white/90 motion-safe:animate-splash-dot" style={{ animationDelay: '300ms' }} />
      </div>

      <p className="absolute bottom-10 text-[0.7rem] font-semibold tracking-[0.25em] text-white/70 uppercase">
        One Deal · Many Possibilities
      </p>
    </div>
  );
}
