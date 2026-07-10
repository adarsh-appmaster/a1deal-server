// Shared confirmation modal — replaces window.confirm() so destructive
// actions get a styled, on-brand dialog instead of a browser popup.
// Pair with the useConfirm() hook for a drop-in async replacement.
export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-level-3 w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'}`}>
          <span className="material-icons-outlined text-xl">{danger ? 'warning' : 'help_outline'}</span>
        </div>
        <h3 className="font-montserrat font-bold text-on-surface text-lg mb-1.5">{title}</h3>
        {message && <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary hover:opacity-90'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
