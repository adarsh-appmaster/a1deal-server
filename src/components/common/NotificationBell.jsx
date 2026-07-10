import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import { timeAgo } from '../../utils/timeAgo';

const TYPE_COLORS = {
  property_pending:      'text-amber-500',
  property_approved:     'text-emerald-500',
  property_rejected:     'text-rose-500',
  unit_property_added:   'text-tertiary',
  mortgage_property_added: 'text-blue-500',
  system:                'text-slate-400',
};

export default function NotificationBell({ accentColor = '#484a5a' }) {
  const [open, setOpen]           = useState(false);
  const [notifications, setNots]  = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const ref = useRef(null);

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnread(data.count || 0);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=15');
      setNots(data.notifications || []);
      setUnread(data.unread || 0);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // Open dropdown
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markRead(n) {
    if (isRead(n)) return;
    try { await api.patch(`/notifications/${n._id}/read`); fetchNotifications(); } catch { /* silent */ }
  }

  async function markAllRead() {
    try { await api.patch('/notifications/read-all'); fetchNotifications(); } catch { /* silent */ }
  }

  function isRead(n) {
    return n.userId ? n.read : false; // broadcasts re-fetched as unread only
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-11 h-11 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        title="Activity"
      >
        <span className={`material-icons-outlined text-[26px] ${open || unread > 0 ? 'text-rose-500' : ''}`}>
          favorite
        </span>
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-montserrat font-bold text-sm text-slate-800">Activity</span>
              {unread > 0 && (
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-slate-700 transition">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <span className="material-icons-outlined text-3xl text-slate-200 block mb-2">favorite</span>
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const read = isRead(n);
                return (
                  <button
                    key={n._id}
                    onClick={() => { markRead(n); if (n.link) window.location.href = n.link; }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition flex gap-3 items-start ${!read ? 'bg-blue-50/40' : ''}`}
                  >
                    <span className={`material-icons-outlined text-lg mt-0.5 flex-shrink-0 ${TYPE_COLORS[n.type] || 'text-slate-400'}`}>
                      {n.icon || 'notifications'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${!read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-slate-400 mt-0.5 truncate">{n.body}</p>}
                      <p className="text-xs text-slate-300 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5 text-center">
              <p className="text-xs text-slate-400">Showing last 15 notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
