import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const STATUS_BADGE = {
  pending:      { label: 'Pending',      cls: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'Under Review', cls: 'bg-blue-100 text-blue-700' },
  approved:     { label: 'Approved',     cls: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',     cls: 'bg-rose-100 text-rose-700' },
};

export default function MasterBrokerReview() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchAssignments(); }, []);

  async function fetchAssignments() {
    try {
      const { data } = await api.get('/master-broker/my-assignments');
      setAssignments(data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/master-broker/${selected._id}/review`, { visitorReport: report });
      setMsg('Report submitted successfully.');
      setSelected(null);
      setReport('');
      fetchAssignments();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-icons-outlined text-4xl text-[#0b5394] animate-spin">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-container mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Master Broker Reviews</h1>
        <p className="text-on-surface-variant text-sm">Cases assigned to you for field verification</p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{msg}</div>
      )}

      {assignments.length === 0 ? (
        <div className="card p-10 text-center text-on-surface-variant">No assignments yet.</div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const badge = STATUS_BADGE[a.status] || {};
            return (
              <div key={a._id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-on-surface">{a.broker?.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{a.broker?.email} · {a.broker?.phone}</p>
                  <p className="text-sm text-on-surface-variant">
                    Location: {[a.broker?.city, a.broker?.area, a.broker?.pincode].filter(Boolean).join(', ') || '—'}
                  </p>
                  {a.motivation && (
                    <p className="text-sm text-on-surface-variant italic">"{a.motivation}"</p>
                  )}
                  {a.requestedAreas?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {a.requestedAreas.map((ar, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#0b5394]/10 text-[#0b5394] rounded-full text-xs">
                          {[ar.city, ar.area, ar.pincode].filter(Boolean).join('/')}
                        </span>
                      ))}
                    </div>
                  )}
                  {a.visitorReport && (
                    <p className="text-xs text-green-700 font-medium">Report submitted ✓</p>
                  )}
                  <p className="text-xs text-on-surface-variant">
                    Assigned: {new Date(a.assignedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {a.status === 'under_review' && !a.visitorReport && (
                  <button
                    onClick={() => { setSelected(a); setReport(''); setMsg(''); }}
                    className="py-2 px-4 rounded-xl bg-[#0b5394] text-white font-bold text-xs hover:bg-[#0b5394]/80 transition"
                  >
                    Submit Report
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-montserrat font-bold text-lg text-on-surface">Submit Review Report</h2>
              <button onClick={() => setSelected(null)}><span className="material-icons-outlined text-on-surface-variant">close</span></button>
            </div>
            <p className="text-sm text-on-surface-variant">Broker: <strong>{selected.broker?.name}</strong></p>
            <form onSubmit={submitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                  Your Field Report
                </label>
                <textarea
                  rows={5}
                  required
                  value={report}
                  onChange={e => setReport(e.target.value)}
                  placeholder="Describe your findings — broker's experience, market knowledge, area presence, recommendation…"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5394]/30 focus:border-[#0b5394] transition resize-none"
                />
              </div>
              <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-[#0b5394] text-white font-bold text-sm hover:bg-[#0b5394]/80 transition disabled:opacity-60">
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
