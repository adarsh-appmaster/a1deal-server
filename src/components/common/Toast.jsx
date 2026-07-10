import { useEffect, useState } from 'react';

// Minimal dependency-free toast system. Call `toast.error(msg)` / `toast.success(msg)`
// from anywhere; a single <ToastHost /> mounted near the app root renders them.
const listeners = new Set();
let counter = 0;

function emit(type, message) {
  const id = ++counter;
  listeners.forEach(fn => fn({ id, type, message }));
}

export const toast = {
  error:   (message) => emit('error', message),
  success: (message) => emit('success', message),
  info:    (message) => emit('info', message),
};

const STYLES = {
  error:   { icon: 'error_outline',   cls: 'bg-rose-600' },
  success: { icon: 'check_circle',    cls: 'bg-emerald-600' },
  info:    { icon: 'info',            cls: 'bg-slate-800' },
};

export function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const add = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 5000);
    };
    listeners.add(add);
    return () => listeners.delete(add);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map(t => {
        const s = STYLES[t.type] || STYLES.info;
        return (
          <div key={t.id}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${s.cls}`}>
            <span className="material-icons-outlined text-base flex-shrink-0">{s.icon}</span>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="flex-shrink-0 opacity-70 hover:opacity-100">
              <span className="material-icons-outlined text-base">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
