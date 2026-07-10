import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';

const ROLE_OPTS = [
  { v: 'buyer',        l: 'Buyers',        color: 'bg-violet-100 text-violet-700' },
  { v: 'broker',       l: 'Brokers',        color: 'bg-rose-100 text-rose-600' },
  { v: 'developer',    l: 'Developers',     color: 'bg-sky-100 text-sky-700' },
  { v: 'investor',     l: 'Investors',      color: 'bg-emerald-100 text-emerald-700' },
  { v: 'masterBroker', l: 'Master Brokers', color: 'bg-amber-100 text-amber-700' },
];

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30';

function fmtPrice(n) {
  const v = Number(n);
  if (!v) return '—';
  return v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` : `₹${(v / 100000).toFixed(1)} L`;
}

function buildWaText(property, type) {
  const loc = [property.area, property.city, property.pincode].filter(Boolean).join(', ');
  const price = type === 'unit'
    ? fmtPrice(property.price)
    : `₹${Number(property.price).toLocaleString('en-IN')}`;

  if (type === 'unit') {
    return `🏠 *New Property on A1 Deal*\n\n` +
      `*${property.title}*\n` +
      `📍 ${loc}\n` +
      `💰 ${price}\n` +
      `🏡 ${property.propertyType?.replace('_', ' ')} · ${property.bedrooms > 0 ? property.bedrooms + 'BHK · ' : ''}${property.areaSqft || ''}${property.areaSqft ? ' sqft' : ''}\n` +
      `📋 ${property.listingType?.replaceAll('_', ' ')} · ${property.furnishing?.replaceAll('_', ' ')}\n` +
      (property.sellerName ? `👤 Contact: ${property.sellerName}${property.sellerPhone ? ' · ' + property.sellerPhone : ''}\n` : '') +
      `\n_A1 Deal — Enterprise Real Estate_`;
  }

  return `🏦 *Bank Repo / Auction Property — A1 Deal*\n\n` +
    `*${property.title}*\n` +
    `📍 ${loc}\n` +
    `💰 Reserve: ${price}\n` +
    `🏦 Bank: ${property.bankName || 'N/A'}\n` +
    (property.auctionDate ? `📅 Auction: ${new Date(property.auctionDate).toLocaleDateString('en-IN')}\n` : '') +
    (property.contactPhone ? `📞 Contact: ${property.contactPhone}\n` : '') +
    `\n_A1 Deal — Enterprise Real Estate_`;
}

function buildEmailBody(property, type) {
  const loc = [property.area, property.city, property.pincode].filter(Boolean).join(', ');
  const price = type === 'unit'
    ? fmtPrice(property.price)
    : `₹${Number(property.price).toLocaleString('en-IN')}`;

  if (type === 'unit') {
    return `<p>Dear {{name}},</p><br>
<p>We have an exciting new property listing on <strong>A1 Deal</strong>:</p><br>
<table style="border-collapse:collapse;width:100%;max-width:500px">
  <tr><td style="padding:8px;background:#f8f9fa;font-weight:bold;width:40%">Property</td><td style="padding:8px">${property.title}</td></tr>
  <tr><td style="padding:8px;background:#f8f9fa;font-weight:bold">Location</td><td style="padding:8px">${loc}</td></tr>
  <tr><td style="padding:8px;background:#f8f9fa;font-weight:bold">Price</td><td style="padding:8px"><strong>${price}</strong></td></tr>
  <tr><td style="padding:8px;background:#f8f9fa;font-weight:bold">Type</td><td style="padding:8px">${property.propertyType?.replaceAll('_', ' ')}${property.bedrooms > 0 ? ' · ' + property.bedrooms + ' BHK' : ''}${property.areaSqft ? ' · ' + property.areaSqft + ' sqft' : ''}</td></tr>
  <tr><td style="padding:8px;background:#f8f9fa;font-weight:bold">Listing</td><td style="padding:8px">${property.listingType?.replaceAll('_', ' ')} · ${property.furnishing?.replaceAll('_', ' ')}</td></tr>
  ${property.sellerName ? `<tr><td style="padding:8px;background:#f8f9fa;font-weight:bold">Contact</td><td style="padding:8px">${property.sellerName}${property.sellerPhone ? ' · ' + property.sellerPhone : ''}</td></tr>` : ''}
</table><br>
<p>Log in to <strong>A1 Deal</strong> to view more details and connect with the seller.</p><br>
<p>Best regards,<br><strong>A1 Deal Team</strong></p>`;
  }

  return `<p>Dear {{name}},</p><br>
<p>A new <strong>bank repo / auction property</strong> is available on <strong>A1 Deal</strong>:</p><br>
<table style="border-collapse:collapse;width:100%;max-width:500px">
  <tr><td style="padding:8px;background:#fff8e1;font-weight:bold;width:40%">Property</td><td style="padding:8px">${property.title}</td></tr>
  <tr><td style="padding:8px;background:#fff8e1;font-weight:bold">Location</td><td style="padding:8px">${loc}</td></tr>
  <tr><td style="padding:8px;background:#fff8e1;font-weight:bold">Reserve Price</td><td style="padding:8px"><strong>${price}</strong></td></tr>
  <tr><td style="padding:8px;background:#fff8e1;font-weight:bold">Bank</td><td style="padding:8px">${property.bankName || 'N/A'}</td></tr>
  ${property.auctionDate ? `<tr><td style="padding:8px;background:#fff8e1;font-weight:bold">Auction Date</td><td style="padding:8px">${new Date(property.auctionDate).toLocaleDateString('en-IN')}</td></tr>` : ''}
  ${property.contactPhone ? `<tr><td style="padding:8px;background:#fff8e1;font-weight:bold">Contact</td><td style="padding:8px">${property.contactPhone}</td></tr>` : ''}
</table><br>
<p>Log in to <strong>A1 Deal</strong> for full details and to register your interest.</p><br>
<p>Best regards,<br><strong>A1 Deal Team</strong></p>`;
}

export default function SharePropertyModal({ property, type = 'unit', onClose }) {
  const [tab, setTab]         = useState('whatsapp');
  const [waGroups, setWaGroups] = useState([]);
  const [copied, setCopied]   = useState(false);

  // Email form state
  const [toRoles, setToRoles] = useState(property.visibleTo || ['buyer', 'broker']);
  const [toCity, setToCity]   = useState(property.city || '');
  const [toArea, setToArea]   = useState(property.area || '');
  const [toPincode, setToPincode] = useState(property.pincode || '');
  const [subject, setSubject] = useState(`New ${type === 'unit' ? 'Property' : 'Mortgage/Auction'} – ${property.title}`);
  const [body, setBody]       = useState(buildEmailBody(property, type));
  const [sending, setSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [previewCount, setPreviewCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);

  const waText = buildWaText(property, type);

  // Load WhatsApp groups for this city
  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ type: type === 'unit' ? 'unit' : 'mortgage' });
        if (property.city) params.set('city', property.city);
        const { data } = await api.get(`/whatsapp-groups?${params}`);
        setWaGroups(data.groups || []);
      } catch { /* empty */ }
    }
    load();
  }, [property.city, type]);

  function copyText() {
    navigator.clipboard?.writeText(waText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  function openWaPersonal() {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
  }

  function openGroup(link) {
    window.open(link, '_blank');
  }

  const loadPreview = useCallback(async () => {
    setCountLoading(true);
    try {
      const params = new URLSearchParams();
      if (toRoles.length) params.set('toRoles', toRoles.join(','));
      if (toPincode) params.set('toPincode', toPincode);
      if (toArea)    params.set('toArea', toArea);
      if (toCity)    params.set('toCity', toCity);
      const { data } = await api.get(`/email-campaigns/preview-count?${params}`);
      setPreviewCount(data.count);
    } catch { setPreviewCount(null); }
    setCountLoading(false);
  }, [toRoles, toCity, toArea, toPincode]);

  async function sendEmail() {
    if (!subject.trim() || !body.trim() || toRoles.length === 0) {
      setEmailMsg('Subject, body and at least one role are required.'); return;
    }
    setSending(true); setEmailMsg('');
    try {
      const { data } = await api.post('/email-campaigns', {
        subject, body, senderName: 'A1 Deal',
        toRoles, toCity, toArea, toPincode, sendNow: true,
      });
      setEmailMsg(`Queued! Will be sent to ${data.previewCount} recipients.`);
    } catch (err) { setEmailMsg(err.response?.data?.message || 'Failed to send.'); }
    setSending(false);
  }

  function toggleRole(v) {
    setToRoles(r => r.includes(v) ? r.filter(x => x !== v) : [...r, v]);
    setPreviewCount(null);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <p className="font-montserrat font-bold text-slate-800">Share Property</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">{property.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 transition flex-shrink-0">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          <button onClick={() => setTab('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition
              ${tab === 'whatsapp' ? 'border-[#25D366] text-[#25D366]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>
          <button onClick={() => setTab('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition
              ${tab === 'email' ? 'border-tertiary text-tertiary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            <span className="material-icons-outlined text-base">mail</span>
            Email Campaign
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {tab === 'whatsapp' && (
            <>
              {/* Message preview */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message Preview</p>
                <div className="bg-[#25D366]/8 border border-[#25D366]/20 rounded-xl p-3">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{waText}</pre>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={copyText}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition
                    ${copied ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                  <span className="material-icons-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copied!' : 'Copy Message'}
                </button>
                <button onClick={openWaPersonal}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#128C7E] transition">
                  <span className="material-icons-outlined text-base">share</span>
                  Share Personal
                </button>
              </div>

              {/* City WhatsApp Groups */}
              {waGroups.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {type === 'unit' ? 'Unit Partnership' : 'Mortgage Property'} Groups — {property.city || 'All Cities'}
                  </p>
                  <div className="space-y-2">
                    {waGroups.map(g => (
                      <div key={g._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{g.groupName}</p>
                          <p className="text-xs text-slate-400">📍 {g.city}</p>
                        </div>
                        <button onClick={() => openGroup(g.link)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#128C7E] transition flex-shrink-0">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Open Group
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {waGroups.length === 0 && (
                <div className="text-center py-6 bg-slate-50 rounded-xl">
                  <span className="material-icons-outlined text-3xl text-slate-200">groups</span>
                  <p className="text-sm text-slate-400 mt-2">No WhatsApp groups for {property.city || 'this city'} yet</p>
                  <a href="/admin/whatsapp-groups" className="text-xs text-[#25D366] font-semibold hover:underline mt-1 block">
                    Create a group →
                  </a>
                </div>
              )}
            </>
          )}

          {tab === 'email' && (
            <>
              {emailMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${emailMsg.includes('Queued') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {emailMsg}
                </div>
              )}

              {/* Recipient Roles */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Send To (Roles) *</p>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTS.map(r => (
                    <button key={r.v} type="button" onClick={() => toggleRole(r.v)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition
                        ${toRoles.includes(r.v) ? r.color + ' border-transparent' : 'border-slate-200 text-slate-400 hover:border-slate-400'}`}>
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location filters */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location Filter</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">City</label>
                    <input value={toCity} onChange={e => { setToCity(e.target.value); setPreviewCount(null); }}
                      placeholder="Pune" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Area</label>
                    <input value={toArea} onChange={e => { setToArea(e.target.value); setPreviewCount(null); }}
                      placeholder="Baner" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Pincode</label>
                    <input value={toPincode} onChange={e => { setToPincode(e.target.value); setPreviewCount(null); }}
                      placeholder="411045" className={inp} />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} className={inp} />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Body (HTML)</label>
                <textarea rows={6} value={body} onChange={e => setBody(e.target.value)}
                  className={`${inp} resize-none font-mono text-xs`} />
              </div>

              {/* Preview count */}
              <div className="flex items-center gap-3">
                <button onClick={loadPreview} disabled={countLoading || toRoles.length === 0}
                  className="flex-1 py-2 rounded-xl border border-tertiary/30 text-tertiary text-sm font-semibold hover:bg-tertiary/5 transition disabled:opacity-40">
                  {countLoading ? 'Counting…' : 'Preview Recipient Count'}
                </button>
                {previewCount !== null && (
                  <div className="bg-tertiary/5 rounded-xl px-4 py-2 text-center flex-shrink-0">
                    <p className="font-bold text-tertiary text-lg">{previewCount}</p>
                    <p className="text-xs text-slate-400">recipients</p>
                  </div>
                )}
              </div>

              <button onClick={sendEmail} disabled={sending || toRoles.length === 0}
                className="w-full py-3 rounded-xl bg-tertiary text-white font-bold text-sm hover:bg-[#2e3044] transition disabled:opacity-60 flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-base">send</span>
                {sending ? 'Queuing…' : 'Send Email Campaign'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
