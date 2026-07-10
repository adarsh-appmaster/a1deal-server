import { useNavigate } from 'react-router-dom';

// Reusable "go back" control. Returns to the previous screen when there's
// history to go back to, otherwise navigates to `fallback` (home by default).
//
// Props:
//   fallback  — path to go to when there's no history (default '/')
//   label     — optional text shown next to the arrow (icon-only if omitted)
//   className — extra classes for layout/placement
export default function BackButton({ fallback = '/', label, className = '' }) {
  const navigate = useNavigate();

  const goBack = () => {
    // history.length > 1 means the user navigated here in-app; else deep-linked.
    if (window.history.length > 1) navigate(-1);
    else navigate(fallback);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      title="Back"
      className={`inline-flex items-center gap-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors ${
        label ? 'px-2 py-1.5' : 'w-9 h-9 justify-center'
      } ${className}`}
    >
      <span className="material-icons-outlined text-xl">arrow_back</span>
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
