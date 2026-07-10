// Shared "nothing here" placeholder for lists/tables across the app —
// icon + message + optional hint + optional action button.
export default function EmptyState({
  icon = 'inbox',
  label = 'Nothing here yet',
  hint = '',
  actionLabel = '',
  onAction = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}>
      <span className="material-icons-outlined text-5xl text-on-surface-variant/25 mb-3">{icon}</span>
      <p className="font-semibold text-on-surface">{label}</p>
      {hint && <p className="text-sm text-on-surface-variant mt-1 max-w-sm">{hint}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
