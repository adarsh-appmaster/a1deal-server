import { useState, useEffect, useCallback } from 'react';
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

export default function TeamSiteVisits() {
  const [visits, setVisits]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [otpModal, setOtpModal] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpMsg, setOtpMsg]     = useState('');
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const { data } = await api.get('/site-visits/assigned', { params });
      setVisits(data.visits || []);
      setTotal(data.total || 0);
    } catch { /* silently */ }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  function openOtp(v) {
    setOtpModal(v);
    setOtpInput('');
    setOtpMsg('');
  }

  async function handleVerify() {
    setVerifying(true);
    setOtpMsg('');
    try {
      const { data } = await api.patch(`/site-visits/${otpModal._id}/verify-otp`, { otp: otpInput.trim() });
      const brokerMsg = data.brokerAssigned
        ? ` Lead sent to master broker: ${data.brokerAssigned}.`
        : ' Lead is pending broker assignment by admin.';
      setOtpMsg(`Visit confirmed!${brokerMsg}`);
      setVisits(prev => prev.map(v => v._id === data.visit._id ? data.visit : v));
      setTimeout(() => setOtpModal(null), 2500);
    } catch (ex) {
      setOtpMsg(ex.response?.data?.message || 'Verification failed.');
    }
    setVerifying(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-slate-800">My Site Visits</h1>
        <p className="text-sm text-slate-500 mt-0.5">{total} visits assigned to you</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', ...Object.keys(STATUS_LABELS)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition capitalize
              ${filterStatus === s ? 'bg-[#0b5394] text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-[#0b5394]'}`}>
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <span className="material-icons-outlined animate-spin mr-2">refresh</span> Loading…
        </div>
      ) : visits.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <span className="material-icons-outlined text-4xl mb-2 block">event_available</span>
          No site visits assigned to you.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visits.map(v => (
            <div key={v._id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{v.buyer?.name || v.name}</p>
                  <p className="text-xs text-slate-400">{v.phone}{v.email ? ` · ${v.email}` : ''}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[v.status] || 'bg-slate-100 text-slate-600'}`}>
                  {STATUS_LABELS[v.status] || v.status}
                </span>
              </div>

              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-medium">{v.propertyTitle || 'Property'}</p>
                <p className="text-xs text-slate-400">{[v.area, v.city].filter(Boolean).join(', ')}</p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="material-icons-outlined text-sm">event</span>
                  {v.date} at {v.slot}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="material-icons-outlined text-sm">confirmation_number</span>
                  {v.passCode}
                </p>
              </div>

              {v.status !== 'completed' && v.status !== 'cancelled' && (
                <button onClick={() => openOtp(v)}
                  className="w-full py-2 rounded-xl bg-[#0b5394] text-white text-sm font-semibold hover:bg-[#08407a] transition flex items-center justify-center gap-1.5">
                  <span className="material-icons-outlined text-sm">pin</span>
                  Verify OTP & Mark Visited
                </button>
              )}
              {v.otpVerified && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">check_circle</span>
                  Visit confirmed on {new Date(v.visitedAt).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {otpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOtpModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#0b5394]/10 flex items-center justify-center mx-auto mb-3">
                <span className="material-icons-outlined text-[#0b5394] text-xl">pin</span>
              </div>
              <h3 className="font-montserrat font-bold text-slate-800">Verify Buyer's OTP</h3>
              <p className="text-xs text-slate-400 mt-1">Ask {otpModal.name} for the 6-digit OTP from their visit pass.</p>
            </div>
            <input
              value={otpInput} onChange={e => setOtpInput(e.target.value)}
              maxLength={6} placeholder="6-digit OTP" inputMode="numeric"
              className="w-full text-center tracking-[0.4em] font-mono text-xl px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0b5394]/30"
            />
            {otpMsg && (
              <p className={`text-xs text-center font-semibold ${otpMsg.includes('confirmed') ? 'text-emerald-600' : 'text-rose-600'}`}>{otpMsg}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setOtpModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleVerify} disabled={verifying || otpInput.trim().length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-[#0b5394] text-white text-sm font-bold hover:bg-[#08407a] transition disabled:opacity-50">
                {verifying ? 'Verifying…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
