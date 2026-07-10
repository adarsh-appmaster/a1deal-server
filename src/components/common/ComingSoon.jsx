export default function ComingSoon({ icon = 'schedule', title = 'Coming Soon', message = 'This facility will be available soon.' }) {
  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col items-center justify-center text-center py-24 bg-white rounded-2xl border border-slate-100">
        <span className="material-icons-outlined text-6xl text-slate-200 mb-4">{icon}</span>
        <h1 className="font-montserrat font-bold text-xl text-on-surface mb-2">{title}</h1>
        <p className="text-on-surface-variant text-sm max-w-sm">{message}</p>
        <span className="mt-4 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Coming Soon</span>
      </div>
    </div>
  );
}
