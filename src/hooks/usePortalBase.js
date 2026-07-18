import { useLocation } from 'react-router-dom';

// Portals that mount shared property detail pages under their own route tree.
const PORTALS = ['broker', 'buyer', 'investor', 'developer', 'admin'];

// Returns the portal base path (e.g. '/broker' or '/buyer') for the active route.
// Shared detail pages use this so their internal navigation stays inside the
// current portal instead of jumping the user into the buyer panel.
export default function usePortalBase() {
  const { pathname } = useLocation();
  const seg = pathname.split('/')[1];
  return PORTALS.includes(seg) ? `/${seg}` : '/buyer';
}
