import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
  no_show:   'bg-slate-200 text-slate-600',
};
const STATUS_LABELS = {
  scheduled: 'Scheduled', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No Show',
};

export default function MyVisits() {
  const navigate = useNavigate();
  const [visits, setVisits]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/site-visits/mine')
      .then(r => setVisits(r.data.visits || []))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-1">My Site Visits</h1>
      <p className="text-sm text-on-surface-variant mb-6">Track all your scheduled property visits.</p>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <span className="material-icons-outlined animate-spin mr-2">refresh</span> Loading…
        </div>
      ) : visits.length === 0 ? (
        <div className="card p-16 flex flex-col items-center justify-center text-center">
          <span className="material-icons-outlined text-5xl text-slate-200 mb-3">event_busy</span>
          <p className="font-semibold text-on-surface mb-1">No site visits yet</p>
          <p className="text-sm text-on-surface-variant mb-4">Browse properties and schedule a visit to see it here.</p>
          <button onClick={() => navigate('/buyer/search')}
            className="px-5 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition">
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visits.map(v => (
            <div key={v._id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-on-surface truncate">{v.propertyTitle || 'Property'}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[v.status] || 'bg-slate-100 text-slate-600'}`}>
                  {STATUS_LABELS[v.status] || v.status}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">{[v.area, v.city].filter(Boolean).join(', ')}</p>
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">event</span>{v.date}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">schedule</span>{v.slot}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
                <span className="text-xs font-mono text-on-surface-variant">{v.passCode}</span>
                {!v.otpVerified && v.status !== 'cancelled' && (
                  <span className="text-xs font-mono font-bold text-primary tracking-widest">OTP {v.otp}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
