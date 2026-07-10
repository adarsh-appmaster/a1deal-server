import { NavLink } from 'react-router-dom';

// Sticky bottom tab bar for mobile. Shown only below the given breakpoint
// (where the sidebar / desktop nav is hidden). Renders up to a handful of the
// most important destinations, with an optional "More" button that opens the
// full menu (the slide-out sidebar on dashboard portals).
//
// Props:
//   items      — [{ path, icon, label, end }]
//   onMore     — optional () => void; renders a trailing "More" tab when set
//   breakpoint — 'md' | 'lg' (hide the bar at/above this width). Default 'lg'.
export default function MobileBottomNav({ items = [], onMore, breakpoint = 'lg' }) {
  // Full class strings so Tailwind's content scanner keeps them.
  const hideClass = breakpoint === 'md' ? 'md:hidden' : 'lg:hidden';

  const tabClass = ({ isActive }) =>
    `flex flex-col items-center justify-center flex-1 min-w-0 gap-1 py-2.5 transition-colors ${
      isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
    }`;

  return (
    <nav
      className={`${hideClass} fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-outline-variant
                  flex items-stretch justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.06)]`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      {items.map((it) => (
        <NavLink key={it.path} to={it.path} end={it.end} className={tabClass}>
          <span className="material-icons-outlined text-[30px] leading-none">{it.icon}</span>
          <span className="text-xs font-medium leading-none truncate max-w-full px-0.5">{it.label}</span>
        </NavLink>
      ))}
      {onMore && (
        <button type="button" onClick={onMore} className={tabClass({ isActive: false })}>
          <span className="material-icons-outlined text-[30px] leading-none">menu</span>
          <span className="text-xs font-medium leading-none">More</span>
        </button>
      )}
    </nav>
  );
}
