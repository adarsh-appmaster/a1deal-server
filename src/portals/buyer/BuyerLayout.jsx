import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { useAuth } from '../../context/AuthContext';

export default function BuyerLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-outline-variant sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center">
            <Logo variant="compact" size="sm" />
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-on-surface-variant">
            <Link to="/buyer" className="hover:text-primary transition-colors">Home</Link>
            <Link to="/buyer/search" className="hover:text-primary transition-colors">Search</Link>
            <Link to="/buyer/mortgage" className="hover:text-primary transition-colors">Mortgages</Link>
            <Link to="/buyer/loan-transfer" className="hover:text-primary transition-colors">Loan Transfer</Link>
            <Link to="/buyer/unit-properties" className="hover:text-primary transition-colors">Unit Properties</Link>
            {user && <Link to="/buyer/visits" className="hover:text-primary transition-colors">My Visits</Link>}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-on-surface max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                  <span className="material-icons-outlined text-sm text-on-surface-variant">expand_more</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-outline-variant rounded-xl shadow-level-3 py-1 z-50">
                    <div className="px-4 py-2 border-b border-outline-variant">
                      <p className="text-xs text-on-surface-variant">Signed in as</p>
                      <p className="text-sm font-semibold text-on-surface truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container flex items-center gap-2"
                    >
                      <span className="material-icons-outlined text-sm">logout</span>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-primary text-sm py-2 px-4">Sign In</button>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 text-on-surface-variant" onClick={() => setMenuOpen(o => !o)}>
              <span className="material-icons-outlined">{menuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-outline-variant bg-white px-4 py-3 space-y-1">
            {[
              { to: '/buyer', label: 'Home' },
              { to: '/buyer/search', label: 'Search' },
              { to: '/buyer/mortgage', label: 'Mortgages' },
              { to: '/buyer/loan-transfer', label: 'Loan Transfer' },
              { to: '/buyer/unit-properties', label: 'Unit Properties' },
              ...(user ? [{ to: '/buyer/visits', label: 'My Visits' }] : []),
            ].map(l => (
              <Link
                key={l.to} to={l.to}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container"
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600">
                <span className="material-icons-outlined text-sm">logout</span> Sign Out
              </button>
            )}
          </div>
        )}
      </header>

      {/* Close user menu on outside click */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-inverse-surface text-inverse-on-surface py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <Logo variant="full" theme="dark" size="sm" />
            <div className="flex flex-wrap gap-6 text-xs text-white/50">
              <Link to="/buyer" className="hover:text-white">Home</Link>
              <Link to="/buyer/mortgage" className="hover:text-white">Mortgages</Link>
            </div>
          </div>
          <p className="text-white/30 text-xs mt-6">© 2026 A1 Deal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
