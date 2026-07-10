import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { validateForm } from '../../validation/validate';
import { bulkWhatsAppSchema } from '../../validation/schemas';

const WA_SVG = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const ROLE_OPTS = [
  { v: 'buyer',        l: 'Buyers',        color: 'bg-violet-100 text-violet-700 border-violet-300' },
  { v: 'broker',       l: 'Brokers',       color: 'bg-rose-100 text-rose-600 border-rose-300' },
  { v: 'developer',    l: 'Developers',    color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { v: 'investor',     l: 'Investors',     color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { v: 'masterBroker', l: 'Master Brokers',color: 'bg-amber-100 text-amber-700 border-amber-300' },
];

function fmtPrice(n) {
  const v = Number(n);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function rolePartnerSection(role) {
  if (role === 'broker' || role === 'masterBroker') return `\n🤝 *CHANNEL PARTNER BENEFITS*\n━━━━━━━━━━━━━━━━\n• Competitive broker commission on every closure\n• Dedicated CP support desk & relationship manager\n• Co-branded marketing brochures & flyers\n• Referral bonus on sub-broker leads\n• Regular project updates & priority site visits`;
  if (role === 'investor') return `\n💼 *INVESTMENT ADVANTAGES*\n━━━━━━━━━━━━━━━━\n• High capital appreciation in prime location\n• Strong ROI & rental income potential\n• Clear legal title & RERA compliance\n• Portfolio diversification opportunity\n• A1 Deal post-investment management support`;
  if (role === 'developer') return `\n🏗️ *DEVELOPMENT / JV OPPORTUNITY*\n━━━━━━━━━━━━━━━━\n• Joint venture & collaboration options open\n• Flexible deal structure & payment terms\n• A1 Deal distribution network for project sales\n• Legal & compliance assistance`;
  return `\n🏠 *WHY CHOOSE THIS PROPERTY*\n━━━━━━━━━━━━━━━━\n• Prime location with excellent connectivity\n• Modern amenities & quality construction\n• Ready documentation for home loan\n• A1 Deal end-to-end purchase support`;
}

function buildWaMessage(properties, type, role) {
  if (!properties.length) return '';
  if (type === 'mortgage') {
    const cards = properties.map(p => {
      const loc = [p.address, p.area, p.city, p.pincode].filter(Boolean).join(', ');
      return `━━━━━━━━━━━━━━━━━━━━━━
🏦 *${p.title}*

📍 *LOCATION*
${loc || '—'}

✨ *FEATURES*
• Bank: ${p.bankName || '—'}
• Price: *${fmtPrice(p.price)}*
• Contact: ${p.contactPhone || '—'}
${p.description ? `\n📋 *DETAILS*\n${p.description.slice(0, 200)}${p.description.length > 200 ? '…' : ''}` : ''}
${(p.images || []).slice(0, 2).map((u, i) => `📷 Photo ${i + 1}: ${u}`).join('\n')}`;
    });
    return `🏦 *A1 Deal — Mortgage & Auction Properties*\n\n${cards.join('\n\n')}\n\n━━━━━━━━━━━━━━━━━━━━━━\n📞 *Contact A1 Deal — Your Trusted Real Estate Partner*`;
  }

  const cards = properties.map(p => {
    const typeLabel = (p.propertyType || 'Property').charAt(0).toUpperCase() + (p.propertyType || '').slice(1);
    const listing = (p.listingType || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const loc = [p.address, p.area, p.city, p.pincode].filter(Boolean).join(', ');
    const features = [
      p.areaSqft  && `• Feature Area: ${Number(p.areaSqft).toLocaleString('en-IN')} sqft`,
      p.landAcres && `• Land Area: ${p.landAcres} acres`,
      p.totalUnits  && `• Total Units: ${p.totalUnits}`,
      p.totalFloors && `• Total Floors: ${p.totalFloors}`,
      p.bedrooms  && `• Bedrooms: ${p.bedrooms} BHK`,
      p.bathrooms && `• Bathrooms: ${p.bathrooms}`,
      p.reraNumber && `• RERA No: ${p.reraNumber}`,
      `• Type: ${typeLabel}`,
      listing && `• Status: ${listing}`,
    ].filter(Boolean).join('\n');
    const imgs = (p.images || []).slice(0, 3).map((u, i) => `📷 Photo ${i + 1}: ${u}`).join('\n');
    const vid = p.video ? `\n🎥 Video: ${p.video}` : '';
    const desc = p.description
      ? `\n📋 *ABOUT THE PROJECT*\n━━━━━━━━━━━━━━━━\n${p.description.slice(0, 300)}${p.description.length > 300 ? '…' : ''}`
      : '';
    const partnerSection = rolePartnerSection(role);
    return `━━━━━━━━━━━━━━━━━━━━━━
🏢 *${p.title}*

📍 *NEARBY LOCATION & AREA*
━━━━━━━━━━━━━━━━
${loc || p.city || '—'}
${desc}
✨ *KEY FEATURES*
━━━━━━━━━━━━━━━━
${features}

💰 *INVESTMENT DETAILS*
━━━━━━━━━━━━━━━━
• Price: *${fmtPrice(p.price)}*
• Owner: ${p.ownerType ? p.ownerType.charAt(0).toUpperCase() + p.ownerType.slice(1) : 'Developer'}
${partnerSection}
${imgs ? `\n📸 *GALLERY*\n━━━━━━━━━━━━━━━━\n${imgs}${vid}` : vid}`;
  });
  return `🏗️ *A1 Deal — Exclusive Investment Projects*\n\n${cards.join('\n\n')}\n\n━━━━━━━━━━━━━━━━━━━━━━\n📞 *Contact A1 Deal — Your Trusted Real Estate Partner*\nSchedule a site visit today! 🏡`;
}

function buildEmailBody(properties, type, role) {
  const bg = '#f8fafc'; const border = '#e2e8f0';
  const featureTd = `padding:6px 12px;border:1px solid ${border};font-size:13px`;
  const featureTh = `padding:6px 12px;border:1px solid ${border};background:${bg};font-weight:600;font-size:13px`;

  let partnerHtml = '';
  if (role === 'broker' || role === 'masterBroker') {
    partnerHtml = `<div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px;margin:16px 0"><h3 style="margin:0 0 8px;color:#854d0e;font-size:14px">🤝 Channel Partner Benefits</h3><ul style="margin:0;padding-left:20px;color:#713f12;font-size:13px"><li>Competitive broker commission on every closure</li><li>Dedicated CP support desk & relationship manager</li><li>Co-branded marketing brochures & flyers</li><li>Referral bonus on sub-broker leads</li><li>Priority site visit scheduling</li></ul></div>`;
  } else if (role === 'investor') {
    partnerHtml = `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0"><h3 style="margin:0 0 8px;color:#166534;font-size:14px">💼 Investment Advantages</h3><ul style="margin:0;padding-left:20px;color:#15803d;font-size:13px"><li>High capital appreciation in prime location</li><li>Strong ROI & rental income potential</li><li>Clear legal title & RERA compliance</li><li>Portfolio diversification opportunity</li><li>A1 Deal post-investment management support</li></ul></div>`;
  } else if (role === 'developer') {
    partnerHtml = `<div style="background:#f7f3fc;border:1px solid #d1b8ef;border-radius:8px;padding:16px;margin:16px 0"><h3 style="margin:0 0 8px;color:#441a74;font-size:14px">🏗️ Development Opportunity</h3><ul style="margin:0;padding-left:20px;color:#542191;font-size:13px"><li>JV & collaboration options available</li><li>Flexible deal structure & payment terms</li><li>A1 Deal distribution network for sales</li><li>Legal & compliance support</li></ul></div>`;
  } else {
    partnerHtml = `<div style="background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:16px;margin:16px 0"><h3 style="margin:0 0 8px;color:#6b21a8;font-size:14px">🏠 Why Choose This Property</h3><ul style="margin:0;padding-left:20px;color:#7e22ce;font-size:13px"><li>Prime location with excellent connectivity</li><li>Modern amenities & quality construction</li><li>Home loan documentation ready</li><li>A1 Deal end-to-end purchase support</li></ul></div>`;
  }

  if (type === 'mortgage') {
    const rows = properties.map(p => `
      <div style="border:1px solid ${border};border-radius:12px;overflow:hidden;margin-bottom:20px">
        ${p.images?.[0] ? `<img src="${p.images[0]}" style="width:100%;height:180px;object-fit:cover" alt="${p.title}" />` : ''}
        <div style="padding:16px">
          <h2 style="margin:0 0 6px;font-size:18px;color:#1e293b">${p.title}</h2>
          <p style="margin:0 0 12px;color:#64748b;font-size:13px">📍 ${[p.area, p.city].filter(Boolean).join(', ') || '—'}</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
            <tr><th style="${featureTh}">Bank</th><td style="${featureTd}">${p.bankName || '—'}</td>
                <th style="${featureTh}">Price</th><td style="${featureTd}"><strong>${fmtPrice(p.price)}</strong></td></tr>
            <tr><th style="${featureTh}">Contact</th><td style="${featureTd}" colspan="3">${p.contactPhone || '—'}</td></tr>
          </table>
          ${p.description ? `<p style="font-size:13px;color:#475569;margin:0">${p.description.slice(0, 200)}${p.description.length > 200 ? '…' : ''}</p>` : ''}
        </div>
      </div>`).join('');
    return `<p style="font-size:15px">Dear {{name}},</p><p>We have <strong>${properties.length} mortgage / auction propert${properties.length !== 1 ? 'ies' : 'y'}</strong> for you:</p>${rows}${partnerHtml}<p>Please reach out for a viewing or more information.</p><p style="margin-top:24px">Best regards,<br><strong>A1 Deal Team</strong></p>`;
  }

  const cards = properties.map(p => {
    const typeLabel = (p.propertyType || '').charAt(0).toUpperCase() + (p.propertyType || '').slice(1);
    const listing = (p.listingType || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const location = [p.address, p.area, p.city, p.pincode].filter(Boolean).join(', ') || '—';
    const rows = [
      p.areaSqft   && ['Feature Area', `${Number(p.areaSqft).toLocaleString('en-IN')} sqft`],
      p.landAcres  && ['Land Area', `${p.landAcres} acres`],
      p.totalUnits && ['Total Units', p.totalUnits],
      p.totalFloors && ['Total Floors', p.totalFloors],
      p.bedrooms   && ['Bedrooms', `${p.bedrooms} BHK`],
      p.bathrooms  && ['Bathrooms', p.bathrooms],
      p.reraNumber && ['RERA No.', p.reraNumber],
      ['Property Type', typeLabel],
      listing && ['Listing Status', listing],
      ['Asking Price', `<strong>${fmtPrice(p.price)}</strong>`],
      p.ownerType  && ['Owner Type', p.ownerType.charAt(0).toUpperCase() + p.ownerType.slice(1)],
    ].filter(Boolean);
    const featureTable = `<table style="width:100%;border-collapse:collapse;margin:12px 0">${rows.map(([k, v]) => `<tr><th style="${featureTh}">${k}</th><td style="${featureTd}">${v}</td></tr>`).join('')}</table>`;
    const galleryImgs = (p.images || []).slice(0, 4).map(u => `<img src="${u}" style="width:calc(50% - 4px);border-radius:8px;object-fit:cover;height:100px;margin:2px" />`).join('');
    return `
      <div style="border:1px solid ${border};border-radius:12px;overflow:hidden;margin-bottom:24px">
        ${p.images?.[0] ? `<img src="${p.images[0]}" style="width:100%;height:200px;object-fit:cover" alt="${p.title}" />` : `<div style="background:#f1f5f9;height:80px;display:flex;align-items:center;justify-content:center;font-size:32px">🏢</div>`}
        <div style="padding:20px">
          <h2 style="margin:0 0 6px;font-size:20px;color:#1e293b">${p.title}</h2>
          <p style="margin:0 0 4px;color:#64748b;font-size:13px">📍 <strong>Nearby Location & Area:</strong> ${location}</p>
          ${p.description ? `<p style="font-size:13px;color:#475569;margin:12px 0;line-height:1.6">${p.description.slice(0, 300)}${p.description.length > 300 ? '…' : ''}</p>` : ''}
          <h3 style="font-size:14px;color:#334155;margin:16px 0 4px">✨ Key Features</h3>
          ${featureTable}
          ${galleryImgs ? `<h3 style="font-size:14px;color:#334155;margin:16px 0 8px">📸 Property Gallery</h3><div style="display:flex;flex-wrap:wrap;gap:4px">${galleryImgs}</div>` : ''}
          ${p.video ? `<p style="margin:12px 0 0;font-size:13px"><a href="${p.video}" style="color:#484a5a">🎥 Watch Project Video</a></p>` : ''}
        </div>
      </div>`;
  }).join('');

  return `<p style="font-size:15px">Dear {{name}},</p><p>We have <strong>${properties.length} exclusive investment project${properties.length !== 1 ? 's' : ''}</strong> available on A1 Deal:</p>${cards}${partnerHtml}<p>Reach out for project brochures, site visits & investment reports.</p><p style="margin-top:24px">Best regards,<br><strong>A1 Deal Team</strong></p>`;
}

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30';

// Pincode tag input
function PincodeInput({ pincodes, onChange }) {
  const [val, setVal] = useState('');
  function add(raw) {
    const tags = raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    const next = [...new Set([...pincodes, ...tags])];
    onChange(next);
    setVal('');
  }
  function remove(p) { onChange(pincodes.filter(x => x !== p)); }
  return (
    <div className="w-full border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap gap-1.5 min-h-[42px] focus-within:ring-2 focus-within:ring-tertiary/30">
      {pincodes.map(p => (
        <span key={p} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {p}
          <button type="button" onClick={() => remove(p)} className="text-slate-400 hover:text-rose-500 leading-none">×</button>
        </span>
      ))}
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',' || e.key === ' ') { e.preventDefault(); if (val.trim()) add(val); } }}
        onBlur={() => { if (val.trim()) add(val); }}
        placeholder={pincodes.length ? '' : 'Type pincode, press Enter…'}
        className="flex-1 min-w-[100px] text-sm outline-none bg-transparent"
      />
    </div>
  );
}

export default function BulkShareModal({ properties, type, onClose }) {
  const [tab, setTab]           = useState('wa');

  // ── Targeting ───────────────────────────────────────────────────────────────
  const [roles, setRoles]       = useState(['buyer', 'broker']);
  const [city, setCity]         = useState('');
  const [area, setArea]         = useState('');
  const [pincodes, setPincodes] = useState([]);   // multiple pincodes
  const [contacts, setContacts] = useState([]);
  const [loadingC, setLoadingC] = useState(false);
  const [recipCount, setRecipCount] = useState(null);

  // ── Message style (determines which partner-benefits section is generated) ──
  const [msgStyle, setMsgStyle] = useState('buyer');

  // ── WA ──────────────────────────────────────────────────────────────────────
  const [message, setMessage]   = useState(() => buildWaMessage(properties, type, 'buyer'));
  const [waSending, setWaSending] = useState(false);
  const [waResult, setWaResult] = useState(null);
  const [copied, setCopied]     = useState(false);

  // ── Email ────────────────────────────────────────────────────────────────────
  const [subject, setSubject]   = useState(
    type === 'mortgage'
      ? `A1 Deal — ${properties.length} Mortgage / Auction Propert${properties.length!==1?'ies':'y'}`
      : `A1 Deal — ${properties.length} Investment Project${properties.length!==1?'s':''} (Towers · Land · Commercial)`
  );
  const [emailBody, setEmailBody] = useState(() => buildEmailBody(properties, type, 'buyer'));
  const [senderName, setSenderName] = useState('A1 Deal');
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  function toggleRole(v) {
    setRoles(r => r.includes(v) ? r.filter(x => x !== v) : [...r, v]);
    setContacts([]); setWaResult(null); setRecipCount(null);
  }

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ roles: roles.join(',') });
    if (city)             p.set('city', city);
    if (area)             p.set('area', area);
    if (pincodes.length)  p.set('pincode', pincodes.join(','));
    return p;
  }, [roles, city, area, pincodes]);

  // Auto-fetch count when targeting changes
  useEffect(() => {
    if (!roles.length) { setRecipCount(null); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/email-campaigns/preview-count?${buildParams()}`);
        setRecipCount(data.count ?? 0);
      } catch { setRecipCount(null); }
    }, 600);
    return () => clearTimeout(t);
  }, [roles, city, area, pincodes, buildParams]);

  const loadContacts = useCallback(async () => {
    if (!roles.length) return;
    setLoadingC(true); setContacts([]); setWaResult(null);
    try {
      const { data } = await api.get(`/bulk-share/contacts?${buildParams()}`);
      setContacts(data.contacts || []);
    } catch { /* empty */ }
    setLoadingC(false);
  }, [buildParams, roles.length]);

  async function sendViaApi() {
    const { errors } = validateForm(bulkWhatsAppSchema, { message, roles });
    if (errors) { setWaResult({ error: Object.values(errors)[0] }); return; }
    setWaSending(true); setWaResult(null);
    try {
      const { data } = await api.post('/bulk-share/whatsapp', {
        roles, message,
        city: city || undefined, area: area || undefined,
        pincode: pincodes.length ? pincodes.join(',') : undefined,
      });
      setWaResult(data);
      if (data.method === 'wame') setContacts(data.contacts || []);
    } catch (err) {
      setWaResult({ error: err.response?.data?.message || 'Failed.' });
    }
    setWaSending(false);
  }

  async function sendEmail() {
    if (!roles.length || !subject.trim() || !emailBody.trim()) return;
    setEmailSending(true); setEmailMsg('');
    try {
      const { data } = await api.post('/bulk-share/email', {
        roles, subject, body: emailBody, senderName,
        city: city || undefined, area: area || undefined,
        pincode: pincodes.length ? pincodes.join(',') : undefined,
      });
      setEmailMsg(data.message);
    } catch (err) {
      setEmailMsg(err.response?.data?.message || 'Failed.');
    }
    setEmailSending(false);
  }

  const withPhone = contacts.filter(c => c.phone || c.waLink);
  const waPersonalLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-montserrat font-bold text-lg text-slate-800">Bulk Message</h2>
            <p className="text-xs text-slate-400 mt-0.5">{properties.length} propert{properties.length!==1?'ies':'y'} selected</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Target Audience (always visible) ─────────────────────────── */}
          <div className="px-5 pt-5 pb-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-icons-outlined text-sm">group</span>
                Target Audience
              </p>
              {recipCount !== null && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  {recipCount} recipient{recipCount !== 1 ? 's' : ''} matched
                </span>
              )}
            </div>

            {/* Role chips */}
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-1.5 font-medium">Roles <span className="text-rose-400">*</span></p>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTS.map(o => (
                  <button key={o.v} type="button" onClick={() => toggleRole(o.v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                      ${roles.includes(o.v) ? o.color : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                    {roles.includes(o.v) && <span className="material-icons-outlined text-xs">check</span>}
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Location filters — always visible */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium">City</p>
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Pune" className={inp} />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium">Area</p>
                <input value={area} onChange={e => setArea(e.target.value)}
                  placeholder="e.g. Baner" className={inp} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 font-medium">Pincodes (add multiple)</p>
              <PincodeInput pincodes={pincodes} onChange={setPincodes} />
            </div>

            {!roles.length && (
              <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                <span className="material-icons-outlined text-sm">error_outline</span>
                Select at least one role to send to.
              </p>
            )}

            {/* Message variant */}
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-400 mb-2 font-medium flex items-center gap-1">
                <span className="material-icons-outlined text-sm">tune</span>
                Message Variant (partner benefits section)
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: 'buyer',        l: 'Buyer Edition' },
                  { v: 'broker',       l: 'Broker / CP Edition' },
                  { v: 'investor',     l: 'Investor Edition' },
                  { v: 'developer',    l: 'Developer Edition' },
                ].map(o => (
                  <button key={o.v} type="button"
                    onClick={() => {
                      setMsgStyle(o.v);
                      setMessage(buildWaMessage(properties, type, o.v));
                      setEmailBody(buildEmailBody(properties, type, o.v));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                      ${msgStyle === o.v ? 'bg-tertiary text-white border-transparent' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex border-b border-slate-100 flex-shrink-0">
            <button onClick={() => setTab('wa')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2
                ${tab==='wa' ? 'text-[#25D366] border-[#25D366]' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              {WA_SVG} WhatsApp
            </button>
            <button onClick={() => setTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2
                ${tab==='email' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              <span className="material-icons-outlined text-base">mail</span> Email
            </button>
          </div>

          {/* ── WhatsApp Tab ──────────────────────────────────────────────── */}
          {tab === 'wa' && (
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message Preview</p>
                <textarea rows={6} value={message} onChange={e => setMessage(e.target.value)}
                  className={`${inp} resize-none font-mono text-xs leading-relaxed`} />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={loadContacts} disabled={loadingC || !roles.length}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <span className="material-icons-outlined text-base">contacts</span>
                  {loadingC ? 'Loading…' : `Load Recipients${recipCount !== null ? ` (${recipCount})` : ''}`}
                </button>
                <button onClick={sendViaApi} disabled={waSending || !roles.length || !message.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {WA_SVG}
                  {waSending ? 'Sending…' : 'Send via API'}
                </button>
              </div>

              {waResult && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${waResult.error ? 'bg-rose-50 text-rose-700' : waResult.method==='api' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                  {waResult.error
                    ? waResult.error
                    : waResult.method==='api'
                      ? `✓ Sent ${waResult.sent}/${waResult.total} via WhatsApp API.${waResult.failed>0?` (${waResult.failed} failed)`:''}`
                      : `No WA API — showing wa.me links for ${waResult.total} contacts. Set WHATSAPP_API_TOKEN in server .env to enable direct sending.`
                  }
                </div>
              )}

              {/* Recipients list with individual send links */}
              {withPhone.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    {withPhone.length} contact{withPhone.length!==1?'s':''} — click to open WhatsApp individually
                  </p>
                  <div className="max-h-52 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                    {withPhone.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
                        <div className="w-7 h-7 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] text-xs font-bold flex-shrink-0">
                          {c.name?.[0]?.toUpperCase()||'?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.phone}
                            {c.city ? <span className="ml-1 text-slate-300">· {c.city}{c.area?`, ${c.area}`:''}</span> : null}
                          </p>
                        </div>
                        <a href={c.waLink||`https://wa.me/${c.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:bg-[#1ebe5d] flex-shrink-0">
                          {WA_SVG}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition
                    ${copied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  {copied ? '✓ Copied!' : 'Copy Message'}
                </button>
                <a href={waPersonalLink} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#25D366] text-[#25D366] text-sm font-semibold hover:bg-[#25D366]/5 transition">
                  {WA_SVG} Share Personally
                </a>
              </div>
            </div>
          )}

          {/* ── Email Tab ─────────────────────────────────────────────────── */}
          {tab === 'email' && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Sender Name</label>
                  <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="A1 Deal" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject *</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" className={inp} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Body (HTML)</label>
                <textarea rows={8} value={emailBody} onChange={e => setEmailBody(e.target.value)}
                  className={`${inp} resize-none font-mono text-xs leading-relaxed`} />
              </div>

              {recipCount !== null && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <span className="material-icons-outlined text-emerald-600 text-base">group</span>
                  <span className="text-sm font-semibold text-emerald-700">
                    Will send to <strong>{recipCount}</strong> matched recipient{recipCount!==1?'s':''}
                  </span>
                </div>
              )}

              {emailMsg && (
                <div className={`p-3 rounded-xl text-sm font-semibold ${emailMsg.includes('queued')||emailMsg.includes('Campaign') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {emailMsg}
                </div>
              )}

              <button onClick={sendEmail} disabled={emailSending || !roles.length || !subject.trim() || !emailBody.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                <span className="material-icons-outlined text-base">send</span>
                {emailSending ? 'Sending…' : `Send Email${recipCount !== null ? ` (${recipCount})` : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
