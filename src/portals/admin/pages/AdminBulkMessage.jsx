import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../api/axios';

const WA_SVG = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const ROLE_OPTS = [
  { v: 'buyer',        l: 'Buyers',        color: 'bg-violet-100 text-violet-700 border-violet-300',  dot: 'bg-violet-400' },
  { v: 'broker',       l: 'Brokers',       color: 'bg-rose-100 text-rose-600 border-rose-300',        dot: 'bg-rose-400' },
  { v: 'developer',    l: 'Developers',    color: 'bg-sky-100 text-sky-700 border-sky-300',           dot: 'bg-sky-400' },
  { v: 'investor',     l: 'Investors',     color: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-400' },
  { v: 'masterBroker', l: 'Master Brokers',color: 'bg-amber-100 text-amber-700 border-amber-300',    dot: 'bg-amber-400' },
  { v: 'team',         l: 'Team / Sales',  color: 'bg-indigo-100 text-indigo-700 border-indigo-300',  dot: 'bg-indigo-400' },
];

const TYPE_ICONS = { tower:'domain', land:'landscape', farmland:'agriculture', building:'business', commercial:'store', villa:'cottage', other:'category' };

const inp = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30 bg-white';

function fmtPrice(n) {
  const v = Number(n);
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v/100000).toFixed(1)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

// ── Rich message generators ────────────────────────────────────────────────────

function rolePartnerSection(role) {
  if (role === 'broker' || role === 'masterBroker') return `\n🤝 *CHANNEL PARTNER BENEFITS*\n━━━━━━━━━━━━━━━━\n• Competitive broker commission on every closure\n• Dedicated CP support desk & relationship manager\n• Co-branded marketing brochures & flyers\n• Referral bonus on sub-broker leads\n• Regular project updates & priority site visits`;
  if (role === 'investor') return `\n💼 *INVESTMENT ADVANTAGES*\n━━━━━━━━━━━━━━━━\n• High capital appreciation in prime location\n• Strong ROI & rental income potential\n• Clear legal title & RERA compliance\n• Portfolio diversification opportunity\n• A1 Deal post-investment management support`;
  if (role === 'developer') return `\n🏗️ *DEVELOPMENT / JV OPPORTUNITY*\n━━━━━━━━━━━━━━━━\n• Joint venture & collaboration options open\n• Flexible deal structure & payment terms\n• A1 Deal distribution network for project sales\n• Legal & compliance assistance`;
  return `\n🏠 *WHY CHOOSE THIS PROPERTY*\n━━━━━━━━━━━━━━━━\n• Prime location with excellent connectivity\n• Modern amenities & quality construction\n• Home loan documentation ready\n• A1 Deal end-to-end purchase support`;
}

function generateWaMessage(properties, role) {
  if (!properties.length) return '';
  const cards = properties.map(p => {
    const typeLabel = (p.propertyType || 'Property').charAt(0).toUpperCase() + (p.propertyType || '').slice(1);
    const listing = (p.listingType || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const loc = [p.address, p.area, p.city, p.pincode].filter(Boolean).join(', ');
    const features = [
      p.areaSqft   && `• Feature Area: ${Number(p.areaSqft).toLocaleString('en-IN')} sqft`,
      p.landAcres  && `• Land Area: ${p.landAcres} acres`,
      p.totalUnits  && `• Total Units: ${p.totalUnits}`,
      p.totalFloors && `• Total Floors: ${p.totalFloors}`,
      p.bedrooms   && `• Bedrooms: ${p.bedrooms} BHK`,
      p.bathrooms  && `• Bathrooms: ${p.bathrooms}`,
      p.reraNumber && `• RERA No: ${p.reraNumber}`,
      `• Type: ${typeLabel}`,
      listing && `• Status: ${listing}`,
    ].filter(Boolean).join('\n');
    const imgs = (p.images || []).slice(0, 3).map((u, i) => `📷 Photo ${i+1}: ${u}`).join('\n');
    const vid = p.video ? `\n🎥 Video: ${p.video}` : '';
    const desc = p.description ? `\n📋 *ABOUT THE PROJECT*\n━━━━━━━━━━━━━━━━\n${p.description.slice(0, 300)}${p.description.length > 300 ? '…' : ''}` : '';
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
${rolePartnerSection(role)}
${imgs ? `\n📸 *GALLERY*\n━━━━━━━━━━━━━━━━\n${imgs}${vid}` : vid}`;
  });
  return `🏗️ *A1 Deal — Exclusive Investment Projects*\n\n${cards.join('\n\n')}\n\n━━━━━━━━━━━━━━━━━━━━━━\n📞 *Contact A1 Deal — Your Trusted Real Estate Partner*\nSchedule a site visit today! 🏡`;
}

function generateEmailBody(properties, role) {
  if (!properties.length) return '';
  const bg = '#f8fafc'; const border = '#e2e8f0';
  const ft = `padding:6px 12px;border:1px solid ${border};font-size:13px`;
  const fth = `padding:6px 12px;border:1px solid ${border};background:${bg};font-weight:600;font-size:13px`;

  let partnerHtml = '';
  if (role === 'broker' || role === 'masterBroker') {
    partnerHtml = `<div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px;margin:20px 0"><h3 style="margin:0 0 8px;color:#854d0e;font-size:14px">🤝 Channel Partner Benefits</h3><ul style="margin:0;padding-left:20px;color:#713f12;font-size:13px"><li>Competitive broker commission on every closure</li><li>Dedicated CP support desk & relationship manager</li><li>Co-branded marketing brochures & flyers</li><li>Referral bonus on sub-broker leads</li><li>Priority site visit scheduling</li></ul></div>`;
  } else if (role === 'investor') {
    partnerHtml = `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0"><h3 style="margin:0 0 8px;color:#166534;font-size:14px">💼 Investment Advantages</h3><ul style="margin:0;padding-left:20px;color:#15803d;font-size:13px"><li>High capital appreciation in prime location</li><li>Strong ROI & rental income potential</li><li>Clear legal title & RERA compliance</li><li>Portfolio diversification opportunity</li><li>A1 Deal post-investment management support</li></ul></div>`;
  } else if (role === 'developer') {
    partnerHtml = `<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:16px;margin:20px 0"><h3 style="margin:0 0 8px;color:#1e40af;font-size:14px">🏗️ Development Opportunity</h3><ul style="margin:0;padding-left:20px;color:#1d4ed8;font-size:13px"><li>JV & collaboration options available</li><li>Flexible deal structure & payment terms</li><li>A1 Deal distribution network for sales</li><li>Legal & compliance support</li></ul></div>`;
  } else {
    partnerHtml = `<div style="background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:16px;margin:20px 0"><h3 style="margin:0 0 8px;color:#6b21a8;font-size:14px">🏠 Why Choose This Property</h3><ul style="margin:0;padding-left:20px;color:#7e22ce;font-size:13px"><li>Prime location with excellent connectivity</li><li>Modern amenities & quality construction</li><li>Home loan documentation ready</li><li>A1 Deal end-to-end purchase support</li></ul></div>`;
  }

  const cards = properties.map(p => {
    const typeLabel = (p.propertyType || '').charAt(0).toUpperCase() + (p.propertyType || '').slice(1);
    const listing = (p.listingType || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const location = [p.address, p.area, p.city, p.pincode].filter(Boolean).join(', ') || '—';
    const tableRows = [
      p.areaSqft   && ['Feature Area', `${Number(p.areaSqft).toLocaleString('en-IN')} sqft`],
      p.landAcres  && ['Land Area', `${p.landAcres} acres`],
      p.totalUnits  && ['Total Units', p.totalUnits],
      p.totalFloors && ['Total Floors', p.totalFloors],
      p.bedrooms   && ['Bedrooms', `${p.bedrooms} BHK`],
      p.bathrooms  && ['Bathrooms', p.bathrooms],
      p.reraNumber && ['RERA No.', p.reraNumber],
      ['Property Type', typeLabel],
      listing && ['Listing Status', listing],
      ['Asking Price', `<strong>${fmtPrice(p.price)}</strong>`],
      p.ownerType  && ['Owner Type', p.ownerType.charAt(0).toUpperCase() + p.ownerType.slice(1)],
    ].filter(Boolean);
    const galleryImgs = (p.images || []).slice(0, 4).map(u => `<img src="${u}" style="width:calc(50% - 4px);border-radius:8px;object-fit:cover;height:100px;margin:2px" />`).join('');
    return `<div style="border:1px solid ${border};border-radius:12px;overflow:hidden;margin-bottom:24px">
      ${p.images?.[0] ? `<img src="${p.images[0]}" style="width:100%;height:200px;object-fit:cover" alt="${p.title}" />` : `<div style="background:#f1f5f9;height:80px;display:flex;align-items:center;justify-content:center;font-size:32px">🏢</div>`}
      <div style="padding:20px">
        <h2 style="margin:0 0 6px;font-size:20px;color:#1e293b">${p.title}</h2>
        <p style="margin:0 0 4px;color:#64748b;font-size:13px">📍 <strong>Nearby Location & Area:</strong> ${location}</p>
        ${p.description ? `<p style="font-size:13px;color:#475569;margin:12px 0;line-height:1.6">${p.description.slice(0,300)}${p.description.length>300?'…':''}</p>` : ''}
        <h3 style="font-size:14px;color:#334155;margin:16px 0 4px">✨ Key Features</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px">${tableRows.map(([k,v])=>`<tr><th style="${fth}">${k}</th><td style="${ft}">${v}</td></tr>`).join('')}</table>
        ${galleryImgs ? `<h3 style="font-size:14px;color:#334155;margin:16px 0 8px">📸 Property Gallery</h3><div style="display:flex;flex-wrap:wrap;gap:4px">${galleryImgs}</div>` : ''}
        ${p.video ? `<p style="margin:12px 0 0;font-size:13px"><a href="${p.video}" style="color:#484a5a">🎥 Watch Project Video</a></p>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<p style="font-size:15px">Dear {{name}},</p><p>We have <strong>${properties.length} exclusive project${properties.length!==1?'s':''}</strong> for you on A1 Deal:</p>${cards}${partnerHtml}<p>Reach out for site visits, brochures & investment reports.</p><p style="margin-top:24px">Best regards,<br><strong>A1 Deal Team</strong></p>`;
}

// ── Pincode tag input ─────────────────────────────────────────────────────────
function PincodeInput({ pincodes, onChange }) {
  const [val, setVal] = useState('');
  function add(raw) {
    const tags = raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    onChange([...new Set([...pincodes, ...tags])]);
    setVal('');
  }
  function remove(p) { onChange(pincodes.filter(x => x !== p)); }
  return (
    <div className="w-full border border-slate-200 rounded-xl px-3 py-2 flex flex-wrap gap-1.5 min-h-[42px] focus-within:ring-2 focus-within:ring-[#484a5a]/30 bg-white">
      {pincodes.map(p => (
        <span key={p} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {p}<button type="button" onClick={() => remove(p)} className="text-slate-400 hover:text-rose-500 leading-none">×</button>
        </span>
      ))}
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (['Enter',',',' ','Tab'].includes(e.key)) { e.preventDefault(); if (val.trim()) add(val); } }}
        onBlur={() => { if (val.trim()) add(val); }}
        placeholder={pincodes.length ? 'Add another…' : 'Type pincode, press Enter or comma…'}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent" />
    </div>
  );
}

// ── Equal distribution plan ───────────────────────────────────────────────────
// Returns: [{ role, properties: [p1, p2], recipientCount }]
function buildDistributionPlan(properties, roles) {
  if (!properties.length || !roles.length) return [];
  return roles.map((role, ri) => ({
    role,
    properties: properties.filter((_, pi) => pi % roles.length === ri),
  }));
}

export default function AdminBulkMessage() {
  const [tab, setTab] = useState('wa');
  const [channel, setChannel] = useState('wa'); // wa | email (compose channel)

  // ── Targeting ───────────────────────────────────────────────────────────────
  const [roles, setRoles]       = useState(['buyer', 'broker']);
  const [city, setCity]         = useState('');
  const [area, setArea]         = useState('');
  const [pincodes, setPincodes] = useState([]);
  const [recipCount, setRecipCount]   = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingC, setLoadingC] = useState(false);

  // ── Property selector ───────────────────────────────────────────────────────
  const [propSearch, setPropSearch]     = useState('');
  const [propResults, setPropResults]   = useState([]);
  const [propSearching, setPropSearching] = useState(false);
  const [selectedProps, setSelectedProps] = useState([]); // full property objects
  const searchRef = useRef(null);

  // ── Distribution mode ───────────────────────────────────────────────────────
  const [equalDist, setEqualDist] = useState(false);

  // ── Message compose ─────────────────────────────────────────────────────────
  const [msgStyle, setMsgStyle]   = useState('buyer');
  const [message, setMessage]     = useState('🏗️ *A1 Deal — Exclusive Properties*\n\nHello {{name}},\n\nWe have exciting investment opportunities available. Contact us for details!\n\n📞 A1 Deal Team');
  const [subject, setSubject]     = useState('A1 Deal — Exclusive Investment Opportunity');
  const [emailBody, setEmailBody] = useState('<p>Dear {{name}},</p><p>We have exciting investment opportunities at A1 Deal. Please contact us for more details.</p><p>Best regards,<br><strong>A1 Deal Team</strong></p>');
  const [senderName, setSenderName] = useState('A1 Deal');

  // ── Send state ──────────────────────────────────────────────────────────────
  const [waSending, setWaSending]   = useState(false);
  const [waResult, setWaResult]     = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg]     = useState('');
  const [copied, setCopied]         = useState(false);

  // ── Equal dist send state ────────────────────────────────────────────────────
  const [distResults, setDistResults] = useState({});
  const [distSending, setDistSending] = useState({});

  const buildParams = useCallback((overrideRoles) => {
    const p = new URLSearchParams({ roles: (overrideRoles || roles).join(',') });
    if (city)            p.set('city', city);
    if (area)            p.set('area', area);
    if (pincodes.length) p.set('pincode', pincodes.join(','));
    return p;
  }, [roles, city, area, pincodes]);

  // Auto-refresh count
  useEffect(() => {
    if (!roles.length) { setRecipCount(null); return; }
    setCountLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/email-campaigns/preview-count?${buildParams()}`);
        setRecipCount(data.count ?? 0);
      } catch { setRecipCount(null); }
      setCountLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [roles, city, area, pincodes, buildParams]);

  // Property search
  useEffect(() => {
    if (!propSearch.trim()) { setPropResults([]); return; }
    setPropSearching(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/unit-properties?search=${encodeURIComponent(propSearch)}&limit=8`);
        setPropResults(data.properties || []);
      } catch { /* empty */ }
      setPropSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [propSearch]);

  function toggleRole(v) {
    setRoles(r => r.includes(v) ? r.filter(x => x !== v) : [...r, v]);
    setContacts([]); setWaResult(null); setDistResults({});
  }

  function addProp(p) {
    if (!selectedProps.find(x => x._id === p._id)) setSelectedProps(prev => [...prev, p]);
    setPropSearch(''); setPropResults([]);
  }
  function removeProp(id) { setSelectedProps(prev => prev.filter(p => p._id !== id)); }

  function generateMessages(propsToUse, roleToUse) {
    setMessage(generateWaMessage(propsToUse, roleToUse || msgStyle));
    setEmailBody(generateEmailBody(propsToUse, roleToUse || msgStyle));
    setSubject(`A1 Deal — ${propsToUse.length > 1 ? `${propsToUse.length} Exclusive Projects` : propsToUse[0]?.title || 'Exclusive Project'}`);
  }

  async function loadContacts() {
    if (!roles.length) return;
    setLoadingC(true); setContacts([]);
    try {
      const { data } = await api.get(`/bulk-share/contacts?${buildParams()}`);
      setContacts(data.contacts || []);
    } catch { /* empty */ }
    setLoadingC(false);
  }

  async function sendViaApi() {
    if (!roles.length || !message.trim()) return;
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
      setWaResult({ error: err.response?.data?.message || 'Failed to send.' });
    }
    setWaSending(false);
  }

  async function sendDistGroup(role, propsForRole) {
    const msg = generateWaMessage(propsForRole, role);
    setDistSending(s => ({ ...s, [role]: true }));
    try {
      const { data } = await api.post('/bulk-share/whatsapp', {
        roles: [role], message: msg,
        city: city || undefined, area: area || undefined,
        pincode: pincodes.length ? pincodes.join(',') : undefined,
      });
      setDistResults(r => ({ ...r, [role]: data }));
    } catch (err) {
      setDistResults(r => ({ ...r, [role]: { error: err.response?.data?.message || 'Failed.' } }));
    }
    setDistSending(s => ({ ...s, [role]: false }));
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
      setEmailMsg(err.response?.data?.message || 'Failed to send.');
    }
    setEmailSending(false);
  }

  const distPlan = equalDist && selectedProps.length && roles.length
    ? buildDistributionPlan(selectedProps, roles)
    : [];

  const withPhone = contacts.filter(c => c.phone || c.waLink);
  const roleMap = Object.fromEntries(ROLE_OPTS.map(o => [o.v, o]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Bulk Message Broadcast</h1>
        <p className="text-sm text-slate-500 mt-0.5">Send WhatsApp or Email to contacts filtered by role, city, area and pincode</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── LEFT: Targeting + Properties ─────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Recipient count */}
          <div className={`rounded-2xl border p-4 flex items-center gap-3 transition ${recipCount !== null ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${recipCount !== null ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <span className={`material-icons-outlined ${recipCount !== null ? 'text-emerald-600' : 'text-slate-400'}`}>group</span>
            </div>
            <div>
              {countLoading ? <p className="text-sm font-semibold text-slate-500">Counting…</p>
                : recipCount !== null ? <>
                    <p className="font-montserrat font-bold text-2xl text-emerald-700">{recipCount}</p>
                    <p className="text-xs text-emerald-600">recipients matched</p>
                  </>
                : <>
                    <p className="font-semibold text-slate-500 text-sm">Select roles to see count</p>
                    <p className="text-xs text-slate-400">Add filters to narrow down</p>
                  </>
              }
            </div>
          </div>

          {/* Roles */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-sm text-[#484a5a]">people</span>
              <p className="text-sm font-bold text-slate-700">Target Roles <span className="text-rose-500">*</span></p>
            </div>
            <div className="space-y-2">
              {ROLE_OPTS.map(o => (
                <button key={o.v} type="button" onClick={() => toggleRole(o.v)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold transition text-left
                    ${roles.includes(o.v) ? o.color : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50'}`}>
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                    ${roles.includes(o.v) ? 'border-current bg-current/20' : 'border-slate-300'}`}>
                    {roles.includes(o.v) && <span className="material-icons-outlined text-[10px]">check</span>}
                  </span>
                  {o.l}
                </button>
              ))}
            </div>
            {!roles.length && <p className="text-xs text-rose-500 flex items-center gap-1"><span className="material-icons-outlined text-sm">error_outline</span>Select at least one role</p>}
          </div>

          {/* Location filters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-sm text-[#484a5a]">location_on</span>
              <p className="text-sm font-bold text-slate-700">Location Filter <span className="text-slate-400 font-normal text-xs">(optional)</span></p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Pune" className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Area</label>
                <input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Baner" className={inp} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pincodes (multiple)</label>
              <PincodeInput pincodes={pincodes} onChange={setPincodes} />
              <p className="text-xs text-slate-400 mt-1">Press Enter or comma after each pincode</p>
            </div>
          </div>

          {/* Property selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-sm text-[#484a5a]">domain</span>
                <p className="text-sm font-bold text-slate-700">Select Properties <span className="text-slate-400 font-normal text-xs">(to auto-generate message)</span></p>
              </div>
              {selectedProps.length > 0 && (
                <span className="text-xs bg-[#484a5a] text-white rounded-full px-2 py-0.5 font-bold">{selectedProps.length}</span>
              )}
            </div>

            {/* Search */}
            <div className="relative" ref={searchRef}>
              <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
              <input value={propSearch} onChange={e => setPropSearch(e.target.value)}
                placeholder="Search unit properties…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#484a5a]/30 bg-white" />
              {propSearching && <span className="material-icons-outlined text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 text-sm animate-spin">progress_activity</span>}
              {propResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                  {propResults.map(p => (
                    <button key={p._id} onClick={() => addProp(p)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition text-left border-b border-slate-50 last:border-0">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt="" className="w-10 h-8 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <span className="material-icons-outlined text-slate-300 text-sm">{TYPE_ICONS[p.propertyType] || 'domain'}</span>
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{p.title}</p>
                        <p className="text-xs text-slate-400 truncate">{[p.area, p.city].filter(Boolean).join(', ')} · {fmtPrice(p.price)}</p>
                      </div>
                      <span className="material-icons-outlined text-slate-300 text-sm flex-shrink-0">add_circle</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected properties */}
            {selectedProps.length > 0 && (
              <div className="space-y-2">
                {selectedProps.map(p => (
                  <div key={p._id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" className="w-10 h-8 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-10 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="material-icons-outlined text-slate-300 text-sm">{TYPE_ICONS[p.propertyType] || 'domain'}</span>
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{p.title}</p>
                      <p className="text-xs text-slate-400">{fmtPrice(p.price)} · {(p.propertyType||'').charAt(0).toUpperCase()+(p.propertyType||'').slice(1)}</p>
                    </div>
                    <button onClick={() => removeProp(p._id)} className="text-slate-300 hover:text-rose-500 flex-shrink-0">
                      <span className="material-icons-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Generate message buttons */}
            {selectedProps.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Generate message for:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'buyer',     l: 'Buyers' },
                    { v: 'broker',    l: 'Brokers / CP' },
                    { v: 'investor',  l: 'Investors' },
                    { v: 'developer', l: 'Developers' },
                  ].map(o => (
                    <button key={o.v} onClick={() => { setMsgStyle(o.v); generateMessages(selectedProps, o.v); setTab('compose'); }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5
                        ${msgStyle === o.v ? 'bg-[#484a5a] text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-[#484a5a] hover:text-[#484a5a]'}`}>
                      <span className="material-icons-outlined text-sm">auto_awesome</span>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Distribution mode toggle */}
          {selectedProps.length > 1 && roles.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={equalDist} onChange={e => setEqualDist(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#484a5a]" />
                <div>
                  <p className="text-sm font-bold text-slate-700">Equal Distribution Mode</p>
                  <p className="text-xs text-slate-400 mt-0.5">Each role group receives different properties equally distributed — buyers get property 1, brokers get property 2, etc.</p>
                </div>
              </label>
            </div>
          )}

          {/* Preview contacts button */}
          <button onClick={loadContacts} disabled={loadingC || !roles.length}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#484a5a] text-[#484a5a] font-bold text-sm hover:bg-[#484a5a]/5 transition disabled:opacity-50">
            <span className="material-icons-outlined text-base">contacts</span>
            {loadingC ? 'Loading Contacts…' : `Preview Contacts${recipCount !== null ? ` (${recipCount})` : ''}`}
          </button>
        </div>

        {/* ── RIGHT: Compose + Distribution Plan ──────────────────────── */}
        <div className="xl:col-span-3 space-y-4">

          {/* ── Equal Distribution Plan ───────────────────────────────── */}
          {equalDist && distPlan.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <span className="material-icons-outlined text-[#484a5a] text-lg">balance</span>
                <div>
                  <p className="font-bold text-slate-700">Equal Distribution Plan</p>
                  <p className="text-xs text-slate-400">Each role group receives a tailored message with their assigned properties</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {distPlan.map(group => {
                  const roleMeta = roleMap[group.role] || { l: group.role, color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
                  const result = distResults[group.role];
                  const sending = distSending[group.role];
                  return (
                    <div key={group.role} className={`rounded-xl border p-4 ${result?.error ? 'border-rose-200 bg-rose-50' : result ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleMeta.color}`}>{roleMeta.l}</span>
                            <span className="text-xs text-slate-400">→ {group.properties.length} propert{group.properties.length!==1?'ies':'y'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {group.properties.map(p => (
                              <span key={p._id} className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 flex items-center gap-1.5">
                                <span className="material-icons-outlined text-slate-300 text-xs">{TYPE_ICONS[p.propertyType]||'domain'}</span>
                                <span className="truncate max-w-[150px]">{p.title}</span>
                              </span>
                            ))}
                          </div>
                          {result && !result.error && (
                            <p className="text-xs text-emerald-700 mt-2 font-semibold">
                              {result.method === 'api'
                                ? `✓ Sent ${result.sent}/${result.total}`
                                : `${result.total} wa.me links ready`}
                            </p>
                          )}
                          {result?.error && <p className="text-xs text-rose-600 mt-2">{result.error}</p>}
                        </div>
                        <button onClick={() => sendDistGroup(group.role, group.properties)} disabled={sending || !group.properties.length}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1ebe5d] transition disabled:opacity-50 flex-shrink-0">
                          {WA_SVG}
                          {sending ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Compose Panel ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              {[
                { v: 'wa',    icon: WA_SVG,                                                              l: 'WhatsApp' },
                { v: 'email', icon: <span className="material-icons-outlined text-base">mail</span>,     l: 'Email' },
              ].map(t => (
                <button key={t.v} onClick={() => setChannel(t.v)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition border-b-2
                    ${channel === t.v
                      ? (t.v === 'wa' ? 'text-[#25D366] border-[#25D366] bg-[#25D366]/5' : 'text-blue-600 border-blue-600 bg-blue-50/50')
                      : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                  {t.icon} {t.l}
                </button>
              ))}
            </div>

            {/* WhatsApp */}
            {channel === 'wa' && (
              <div className="p-5 space-y-4">
                {/* Message style pills */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Message variant (partner section)</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: 'buyer',     l: 'Buyer' },
                      { v: 'broker',    l: 'Broker / CP' },
                      { v: 'investor',  l: 'Investor' },
                      { v: 'developer', l: 'Developer' },
                    ].map(o => (
                      <button key={o.v} onClick={() => {
                        setMsgStyle(o.v);
                        if (selectedProps.length) setMessage(generateWaMessage(selectedProps, o.v));
                      }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition
                          ${msgStyle === o.v ? 'bg-[#484a5a] text-white border-transparent' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Message</label>
                  <p className="text-xs text-slate-400 mb-2">Use <code className="bg-slate-100 px-1 rounded">{'{{name}}'}</code> for contact name personalisation</p>
                  <textarea rows={10} value={message} onChange={e => setMessage(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 resize-none" />
                  <p className="text-xs text-slate-400 mt-1">{message.length} characters</p>
                </div>

                {/* Quick templates (only when no property selected) */}
                {!selectedProps.length && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Quick Templates</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { l: 'Property Launch',  m: '🏗️ *A1 Deal — New Project Launch!*\n\nHello {{name}},\n\nWe\'re excited to announce a new investment opportunity in our portfolio.\n\n📞 Contact A1 Deal for project details and site visits!\n\n💼 A1 Deal Team' },
                        { l: 'Site Visit Invite', m: '🏢 *A1 Deal — Site Visit Invitation*\n\nDear {{name}},\n\nYou\'re invited to a site visit for one of our premium projects.\n\n📅 Schedule your visit today!\n📞 Call/WhatsApp A1 Deal\n\n— A1 Deal Team' },
                        { l: 'Deal Closing',      m: '💰 *A1 Deal — Limited Time Offer*\n\nHi {{name}},\n\nWe have an exclusive deal closing opportunity for you. Price and terms are highly attractive.\n\nReach out immediately to book your slot!\n\n— A1 Deal' },
                      ].map(t => (
                        <button key={t.l} onClick={() => setMessage(t.m)}
                          className="px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 hover:border-[#484a5a] hover:text-[#484a5a] transition">
                          {t.l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {waResult && (
                  <div className={`p-3 rounded-xl text-sm font-semibold ${waResult.error ? 'bg-rose-50 text-rose-600' : waResult.method==='api' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                    {waResult.error ? waResult.error
                      : waResult.method==='api'
                        ? `✓ Sent to ${waResult.sent}/${waResult.total} contacts via WhatsApp API.${waResult.failed>0?` (${waResult.failed} failed)`:''}`
                        : `WA API not configured — showing wa.me links for ${waResult.total} contacts.`}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition
                      ${copied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <span className="material-icons-outlined text-base">{copied?'check':'content_copy'}</span>
                    {copied?'Copied!':'Copy'}
                  </button>
                  <button onClick={sendViaApi} disabled={waSending || !roles.length || !message.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1ebe5d] transition disabled:opacity-50">
                    {WA_SVG}
                    {waSending ? 'Sending…' : `Send to ${recipCount ?? '?'} Recipients`}
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#25D366] text-[#25D366] font-semibold text-sm hover:bg-[#25D366]/5 transition">
                    {WA_SVG} Personal
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {channel === 'email' && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Sender Name</label>
                    <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="A1 Deal" className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Subject *</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject…" className={inp} />
                  </div>
                </div>
                {selectedProps.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Regenerate email for:</p>
                    <div className="flex flex-wrap gap-2">
                      {[{v:'buyer',l:'Buyers'},{v:'broker',l:'Brokers'},{v:'investor',l:'Investors'},{v:'developer',l:'Developers'}].map(o => (
                        <button key={o.v} onClick={() => { setMsgStyle(o.v); setEmailBody(generateEmailBody(selectedProps, o.v)); }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition
                            ${msgStyle===o.v?'bg-[#484a5a] text-white border-transparent':'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Email Body (HTML)</label>
                  <textarea rows={12} value={emailBody} onChange={e => setEmailBody(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none" />
                </div>
                {emailMsg && (
                  <div className={`p-3 rounded-xl text-sm font-semibold ${emailMsg.toLowerCase().includes('fail')||emailMsg.toLowerCase().includes('error') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {emailMsg}
                  </div>
                )}
                <button onClick={sendEmail} disabled={emailSending || !roles.length || !subject.trim() || !emailBody.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  <span className="material-icons-outlined text-base">send</span>
                  {emailSending ? 'Sending…' : `Send Email to ${recipCount ?? '?'} Recipients`}
                </button>
              </div>
            )}
          </div>

          {/* Contact list preview */}
          {withPhone.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">{withPhone.length} contact{withPhone.length!==1?'s':''} with WhatsApp numbers</p>
                <span className="text-xs text-slate-400">Click to open individual chat</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {withPhone.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition">
                    <div className="w-8 h-8 rounded-full bg-[#484a5a]/10 text-[#484a5a] font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {c.name?.[0]?.toUpperCase()||'?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.phone}{c.role?<span className="ml-1.5 capitalize text-slate-300">· {c.role}</span>:''}{c.city?<span className="ml-1.5 text-slate-300">· {c.city}{c.area?`, ${c.area}`:''}</span>:''}</p>
                    </div>
                    <a href={c.waLink||`https://wa.me/${(c.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(message.replace('{{name}}',c.name||''))}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#1ebe5d] transition flex-shrink-0">
                      {WA_SVG} Chat
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
