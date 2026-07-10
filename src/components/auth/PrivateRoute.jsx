import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// portalRole: the role required to access this portal (e.g. 'buyer', 'admin')
// If omitted, only checks for a valid token (any logged-in user).
export default function PrivateRoute({ children, portalRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-icons-outlined text-4xl text-primary animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!user) {
    const internalPortals = ['admin', 'team', 'bank'];
    const loginPath = portalRole && internalPortals.includes(portalRole)
      ? `/${portalRole}/login`
      : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Block unapproved users from accessing their portal — send to pending screen.
  // Internal roles (admin, team, bank) are managed differently and bypass this check.
  const internalRoles = ['admin', 'team', 'bank'];
  const isPending =
    user.status === 'pending' ||
    user.isApproved === false ||
    user.approved === false;
  if (isPending && !internalRoles.includes(user.role)) {
    return (
      <Navigate
        to="/pending"
        state={{ role: user.role, email: user.email }}
        replace
      />
    );
  }

  if (portalRole && user.role !== portalRole) {
    const paths = {
      buyer: '/buyer', broker: '/broker', developer: '/developer',
      investor: '/investor', admin: '/admin', team: '/team', bank: '/bank',
    };
    return <Navigate to={paths[user.role] || '/'} replace />;
  }

  return children;
}
