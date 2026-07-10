import { Link, useLocation } from 'react-router-dom';

// Derives "Portal Name / Current Page" from the same navItems array each
// dashboard layout already passes for its sidebar — no separate route map
// to keep in sync. Falls back to just the portal name on the index page.
export default function Breadcrumbs({ portalName, navItems }) {
  const { pathname } = useLocation();

  const portalRoot = navItems.find(item => item.end)?.path || '/';

  const current = navItems
    .filter(item => (item.end ? pathname === item.path : pathname.startsWith(item.path)))
    .sort((a, b) => b.path.length - a.path.length)[0];

  const isRoot = !current || current.end;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0">
      <Link
        to={portalRoot}
        className={`font-montserrat font-semibold text-sm md:text-base truncate transition-colors ${
          isRoot ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        {portalName}
      </Link>
      {!isRoot && (
        <>
          <span className="material-icons-outlined text-on-surface-variant text-base flex-shrink-0">chevron_right</span>
          <span className="font-montserrat font-semibold text-sm md:text-base text-on-surface truncate">
            {current.label}
          </span>
        </>
      )}
    </nav>
  );
}
