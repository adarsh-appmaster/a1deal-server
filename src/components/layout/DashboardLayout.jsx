import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Logo from '../common/Logo';
import NotificationBell from '../common/NotificationBell';
import ChatPanel from '../common/ChatPanel';

export default function DashboardLayout({ portalName, portalColor, navItems, children, banner }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [chatUnread, setChatUnread]   = useState(0);
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Track unread messages + new incoming rooms when chat panel is closed
  useEffect(() => {
    const s = socket?.current;
    if (!s) return;
    const onMsg    = () => { if (!chatOpen) setChatUnread(u => u + 1); };
    const onNewRoom = () => { if (!chatOpen) setChatUnread(u => u + 1); };
    s.on('new_message', onMsg);
    s.on('new_chat_room', onNewRoom);
    return () => { s.off('new_message', onMsg); s.off('new_chat_room', onNewRoom); };
  }, [chatOpen, socket]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 flex-shrink-0 bg-inverse-surface flex flex-col
          transition-transform duration-250
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 min-h-[60px]">
          <button onClick={() => navigate('/')} className="flex items-center">
            <Logo variant="compact" theme="dark" size="sm" />
          </button>
        </div>

        {/* Portal label */}
        <div className="px-4 py-2 border-b border-white/10">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest truncate">{portalName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="material-icons-outlined text-xl flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User & sign out */}
        <div className="p-3 border-t border-white/10">
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#6236ff] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.name || 'User'}</p>
                <p className="text-white/50 text-[11px] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm"
          >
            <span className="material-icons-outlined text-xl">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
              aria-label="Open menu"
            >
              <span className="material-icons-outlined text-2xl">menu</span>
            </button>
            <h1 className="font-montserrat font-semibold text-on-surface text-sm md:text-base truncate">
              {portalName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell accentColor={portalColor} />
            <button
              onClick={() => { setChatOpen(v => !v); setChatUnread(0); }}
              className="relative w-11 h-11 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              title="Negotiations"
            >
              <span className="material-icons-outlined text-[26px]">forum</span>
              {chatUnread > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1 leading-none">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Optional banner slot (e.g. "under review" notice) */}
        {banner}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface">
          {children}
        </main>
      </div>
    </div>

    {/* Negotiation chat panel */}
    {chatOpen && (
      <div className="fixed inset-0 z-[45] bg-black/30 backdrop-blur-[1px]" onClick={() => setChatOpen(false)} />
    )}
    <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
