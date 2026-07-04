import { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { SearchFilter } from '../../../components/common/SearchFilter';
import { Pagination } from '../../../components/common/Pagination';

const ROLE_OPTS = [
  { v: 'buyer',         l: 'Buyers',        color: 'bg-violet-100 text-violet-700' },
  { v: 'broker',        l: 'Brokers',        color: 'bg-rose-100 text-rose-600' },
  { v: 'developer',     l: 'Developers',     color: 'bg-sky-100 text-sky-700' },
  { v: 'investor',      l: 'Investors',      color: 'bg-emerald-100 text-emerald-700' },
  { v: 'masterBroker',  l: 'Master Brokers', color: 'bg-amber-100 text-amber-700' },
  { v: 'team',          l: 'Team Members',   color: 'bg-slate-100 text-slate-600' },
];

const STATUS_STYLE = {
  draft:      { label: 'Draft',      color: 'bg-slate-100 text-slate-500', icon: 'edit_note' },
  queued:     { label: 'Queued',     color: 'bg-blue-100 text-blue-600',   icon: 'schedule' },
  processing: { label: 'Sending…',   color: 'bg-amber-100 text-amber-700', icon: 'sync' },
  sent:       { label: 'Sent',       color: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
  failed:     { label: 'Failed',     color: 'bg-rose-100 text-rose-600',   icon: 'error' },
};

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30';

const EMPTY_FORM = {
  subject: '', body: '', senderName: 'A1 Deal',
  toRoles: [], toCity: '', toArea: '', toPincode: '',
};

const DEFAULT_TEMPLATE = `<p>Dear {{name}},</p>
<br>
<p>We have exciting new property listings available in your area.</p>
<br>
<p>Visit <strong>A1 Deal</strong> to explore the latest opportunities.</p>
<br>
<p>Best regards,<br><strong>A1 Deal Team</strong></p>`;

export default function AdminEmailCampaign() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('compose');    // 'compose' | 'history'
  const [form, setForm]           = useState({ ...EMPTY_FORM, body: DEFAULT_TEMPLATE });
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [previewCount, setPreviewCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_LIMIT = 10;

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/email-campaigns');
      setCampaigns(data.campaigns || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const filteredCampaigns = campaigns.filter(c => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (c.subject?.toLowerCase().includes(q) || c.senderName?.toLowerCase().includes(q) ||
      c.toCity?.toLowerCase().includes(q) || c.toArea?.toLowerCase().includes(q) ||
      c.createdBy?.name?.toLowerCase().includes(q) ||
      c.toRoles?.some(r => r.toLowerCase().includes(q)));
  });
  const historyTotalPages = Math.ceil(filteredCampaigns.length / HISTORY_LIMIT);
  const paginatedCampaigns = filteredCampaigns.slice((historyPage - 1) * HISTORY_LIMIT, historyPage * HISTORY_LIMIT);

  useEffect(() => { setHistoryPage(1); }, [historySearch]);

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  function toggleRole(v) {
    setForm(f => ({
      ...f,
      toRoles: f.toRoles.includes(v) ? f.toRoles.filter(r => r !== v) : [...f.toRoles, v],
    }));
    setPreviewCount(null);
  }

  async function loadPreviewCount() {
    setCountLoading(true);
    try {
      const params = new URLSearchParams();
      if (form.toRoles.length) params.set('toRoles', form.toRoles.join(','));
      if (form.toCity)    params.set('toCity', form.toCity);
      if (form.toArea)    params.set('toArea', form.toArea);
      if (form.toPincode) params.set('toPincode', form.toPincode);
      const { data } = await api.get(`/email-campaigns/preview-count?${params}`);
      setPreviewCount(data.count);
    } catch { setPreviewCount(null); }
    setCountLoading(false);
  }

  async function handleSend(sendNow) {
    if (!form.subject.trim() || !form.body.trim()) {
      setMsg('Subject and email body are required.'); return;
    }
    if (form.toRoles.length === 0) {
      setMsg('Select at least one recipient role.'); return;
    }
    setSaving(true); setMsg('');
    try {
      const { data } = await api.post('/email-campaigns', { ...form, sendNow });
      setMsg(sendNow
        ? `Campaign queued! Will be sent to ${data.previewCount} recipients.`
        : `Draft saved (${data.previewCount} recipients).`);
      setForm({ ...EMPTY_FORM, body: DEFAULT_TEMPLATE });
      setPreviewCount(null);
      fetchCampaigns();
      if (!sendNow) setTab('history');
    } catch (err) { setMsg(err.response?.data?.message || 'Failed.'); }
    setSaving(false);
  }

  async function queueDraft(id) {
    try { await api.patch(`/email-campaigns/${id}/queue`); fetchCampaigns(); } catch { /* empty */ }
  }

  async function deleteDraft(id) {
    if (!window.confirm('Delete this draft?')) return;
    try { await api.delete(`/email-campaigns/${id}`); fetchCampaigns(); } catch { /* empty */ }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Email Campaigns</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Compose and send bulk emails to users by role, city, area or pincode. Emails are sent via an async queue — the server won't slow down.
        </p>
      </div>

      {/* Queue info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <span className="material-icons-outlined text-blue-500 flex-shrink-0 mt-0.5">queue</span>
        <div className="text-sm text-slate-700">
          <span className="font-semibold text-blue-700">Queue-based delivery:</span> Emails are processed in the background, one batch at a time.
          Large campaigns run without blocking the server. Check <strong>Campaign History</strong> for real-time progress.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[{ k: 'compose', l: 'Compose Email', icon: 'edit' }, { k: 'history', l: 'Campaign History', icon: 'history' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition
              ${tab === t.k ? 'bg-white text-[#484a5a] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span className="material-icons-outlined text-base">{t.icon}</span>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            {msg && (
              <div className={`p-3 rounded-xl text-sm font-semibold ${msg.includes('queue') || msg.includes('saved') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                {msg}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h3 className="font-semibold text-slate-700 text-sm">Email Content</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Sender Name</label>
                <input name="senderName" value={form.senderName} onChange={handleChange} placeholder="A1 Deal" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Subject *</label>
                <input name="subject" value={form.subject} onChange={handleChange}
                  placeholder="New Properties Available in Your Area — A1 Deal" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Email Body (HTML) *</label>
                <textarea name="body" rows={10} value={form.body} onChange={handleChange}
                  className={`${inp} resize-y font-mono text-xs`} />
                <p className="text-xs text-slate-400 mt-1">Use HTML tags for formatting. Use <code className="bg-slate-100 px-1 rounded">{"{{name}}"}</code> as a placeholder (future personalization).</p>
              </div>
            </div>

            {/* Preview card */}
            {form.body && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-icons-outlined text-slate-400 text-sm">preview</span>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Preview</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: form.body }} />
              </div>
            )}
          </div>

          {/* Recipients panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h3 className="font-semibold text-slate-700 text-sm">Recipients</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Roles *</label>
                <div className="space-y-2">
                  {ROLE_OPTS.map(r => (
                    <label key={r.v} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={form.toRoles.includes(r.v)} onChange={() => toggleRole(r.v)} className="accent-[#484a5a]" />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${form.toRoles.includes(r.v) ? r.color : 'text-slate-400'}`}>{r.l}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location Filter (optional)</p>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">City</label>
                  <input name="toCity" value={form.toCity} onChange={handleChange} placeholder="Pune" className={inp} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Area</label>
                  <input name="toArea" value={form.toArea} onChange={handleChange} placeholder="Baner" className={inp} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Pincode</label>
                  <input name="toPincode" value={form.toPincode} onChange={handleChange} placeholder="411045" className={inp} />
                </div>
                <p className="text-xs text-slate-400">If multiple location fields are set, recipients matching <em>any</em> of them are included.</p>
              </div>

              {/* Recipient count preview */}
              <div className="border-t border-slate-100 pt-4">
                <button type="button" onClick={loadPreviewCount} disabled={countLoading || form.toRoles.length === 0}
                  className="w-full py-2 rounded-xl border border-[#484a5a]/30 text-[#484a5a] text-sm font-semibold hover:bg-[#484a5a]/5 transition disabled:opacity-40">
                  {countLoading ? 'Counting…' : 'Preview Recipient Count'}
                </button>
                {previewCount !== null && (
                  <div className="mt-2 text-center bg-[#484a5a]/5 rounded-xl p-3">
                    <p className="font-montserrat font-bold text-2xl text-[#484a5a]">{previewCount}</p>
                    <p className="text-xs text-slate-400">matching active users</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button onClick={() => handleSend(true)} disabled={saving}
                className="w-full py-3 rounded-xl bg-[#484a5a] text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60 flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-base">send</span>
                {saving ? 'Sending…' : 'Send Now (Queue)'}
              </button>
              <button onClick={() => handleSend(false)} disabled={saving}
                className="w-full py-3 rounded-xl border border-[#484a5a]/30 text-[#484a5a] font-semibold text-sm hover:bg-[#484a5a]/5 transition disabled:opacity-60 flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-base">save</span>
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <SearchFilter
            searchTerm={historySearch}
            onSearchChange={setHistorySearch}
            placeholder="Search campaigns by subject, sender, role, city..."
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}</p>
            <button onClick={fetchCampaigns}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition">
              <span className="material-icons-outlined text-base">refresh</span> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="material-icons-outlined text-3xl animate-spin text-[#484a5a]">progress_activity</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <span className="material-icons-outlined text-5xl text-slate-200">mail_outline</span>
              <p className="text-slate-400 mt-3">No campaigns yet</p>
              <button onClick={() => setTab('compose')} className="mt-4 px-4 py-2 rounded-xl bg-[#484a5a] text-white text-sm font-semibold hover:bg-[#2e3044] transition">
                Compose First Email
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedCampaigns.map(c => {
                const st = STATUS_STYLE[c.status] || STATUS_STYLE.draft;
                return (
                  <div key={c._id} className="bg-white rounded-2xl border border-slate-100 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${st.color}`}>
                            <span className={`material-icons-outlined text-sm ${c.status === 'processing' ? 'animate-spin' : ''}`}>{st.icon}</span>
                            {st.label}
                          </span>
                          {c.toRoles?.map(r => {
                            const opt = ROLE_OPTS.find(o => o.v === r);
                            return <span key={r} className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${opt?.color || 'bg-slate-100 text-slate-500'}`}>{opt?.l || r}</span>;
                          })}
                        </div>
                        <p className="font-montserrat font-bold text-slate-800">{c.subject}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[c.toCity, c.toArea, c.toPincode].filter(Boolean).join(' · ') || 'All locations'}
                          {' · '}Sender: {c.senderName}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                        {c.createdBy && <p className="text-xs text-slate-300">{c.createdBy.name}</p>}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-slate-50 rounded-xl p-2 text-center">
                        <p className="font-bold text-slate-700 text-sm">{c.recipientCount}</p>
                        <p className="text-xs text-slate-400">Recipients</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-2 text-center">
                        <p className="font-bold text-emerald-600 text-sm">{c.sentCount}</p>
                        <p className="text-xs text-slate-400">Sent</p>
                      </div>
                      <div className="bg-rose-50 rounded-xl p-2 text-center">
                        <p className="font-bold text-rose-500 text-sm">{c.failedCount || 0}</p>
                        <p className="text-xs text-slate-400">Failed</p>
                      </div>
                    </div>

                    {c.status === 'processing' && c.recipientCount > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Sending…</span>
                          <span>{Math.round((c.sentCount / c.recipientCount) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 transition-all duration-500"
                            style={{ width: `${Math.round((c.sentCount / c.recipientCount) * 100)}%` }} />
                        </div>
                      </div>
                    )}

                    {c.error && (
                      <div className="mb-3 text-xs text-rose-600 bg-rose-50 rounded-lg p-2">{c.error}</div>
                    )}

                    <div className="flex gap-2">
                      {c.status === 'draft' && (
                        <>
                          <button onClick={() => queueDraft(c._id)}
                            className="flex-1 py-2 rounded-xl bg-[#484a5a] text-white text-xs font-semibold hover:bg-[#2e3044] transition flex items-center justify-center gap-1">
                            <span className="material-icons-outlined text-sm">send</span> Send Now
                          </button>
                          <button onClick={() => deleteDraft(c._id)}
                            className="px-3 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs font-semibold hover:bg-rose-50 transition">
                            <span className="material-icons-outlined text-sm">delete_outline</span>
                          </button>
                        </>
                      )}
                      {c.status === 'failed' && (
                        <button onClick={() => queueDraft(c._id)}
                          className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition flex items-center justify-center gap-1">
                          <span className="material-icons-outlined text-sm">replay</span> Retry
                        </button>
                      )}
                      {c.status === 'sent' && (
                        <div className="flex-1 py-2 text-center text-xs text-emerald-600 font-semibold">
                          Completed {c.completedAt ? new Date(c.completedAt).toLocaleString('en-IN') : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {historyTotalPages > 1 && (
            <Pagination
              currentPage={historyPage}
              totalPages={historyTotalPages}
              totalItems={filteredCampaigns.length}
              itemsPerPage={HISTORY_LIMIT}
              onPageChange={setHistoryPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
