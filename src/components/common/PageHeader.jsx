// Shared dashboard page heading — title + subtitle on the left, actions
// (buttons) on the right. Keeps every internal-portal page's header layout
// and spacing identical.
export default function PageHeader({ title, subtitle, actions = null, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">{title}</h1>
        {subtitle && <p className="text-on-surface-variant text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
