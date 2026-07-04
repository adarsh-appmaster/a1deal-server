import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../../api/axios';
import { STATE_LIST, getCities } from '../../../data/indiaLocations';
import { useAuth } from '../../../context/AuthContext';

/* ─── status badges ──────────────────────────────────────────────────────── */
const STATUS_BADGE = {
  pending:      { label: 'Under Review',    cls: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'Visitor Assigned', cls: 'bg-blue-100 text-blue-700' },
  approved:     { label: 'Approved',         cls: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',         cls: 'bg-rose-100 text-rose-700' },
};

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function fmtPrice(n) {
  if (!n) return '—';
  const l = Number(n);
  return l >= 10000000 ? `₹${(l / 10000000).toFixed(2)} Cr` : `₹${(l / 100000).toFixed(1)} L`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── message generators ─────────────────────────────────────────────────── */
function buildUnitWaMsg(props) {
  if (!props.length) return '';
  const lines = [
    `🏢 *Property Update from Your Master Broker*`,
    `Hello! Here are the latest properties curated just for you:`,
    '',
  ];
  props.forEach((p, i) => {
    lines.push(`*${i + 1}. ${p.title}*`);
    lines.push(`📍 ${[p.area, p.city, p.pincode].filter(Boolean).join(', ')}`);
    if (p.areaSqft)    lines.push(`📐 ${p.areaSqft.toLocaleString()} sqft`);
    if (p.totalUnits)  lines.push(`🏗 ${p.totalUnits} units | ${p.totalFloors || '—'} floors`);
    if (p.bedrooms)    lines.push(`🛏 ${p.bedrooms}BHK | 🚿 ${p.bathrooms || p.bedrooms} Bath`);
    lines.push(`💰 ${fmtPrice(p.price)}`);
    lines.push(`📋 ${(p.listingType || '').replace(/_/g, ' ')}`);
    if (p.reraNumber)  lines.push(`✅ RERA: ${p.reraNumber}`);
    lines.push(`📞 Contact: ${p.sellerPhone || 'TBD'}`);
    lines.push('');
  });
  lines.push(`🤝 *Broker Partner Benefits*`);
  lines.push(`✔ Site visit support & client handling`);
  lines.push(`✔ Priority leads in your pincode`);
  lines.push(`✔ Brokerage on every closed deal`);
  lines.push(`✔ Marketing materials provided`);
  lines.push('');
  lines.push(`📲 Connect with us to know more!`);
  return lines.join('\n');
}

function buildMortgageWaMsg(props) {
  if (!props.length) return '';
  const lines = [
    `🏦 *Bank Auction Opportunity — Exclusive for Brokers*`,
    `Top mortgage & auction properties ready for your clients:`,
    '',
  ];
  props.forEach((p, i) => {
    lines.push(`*${i + 1}. ${p.title}*`);
    lines.push(`📍 ${[p.area, p.city, p.pincode].filter(Boolean).join(', ')}`);
    if (p.bankName)  lines.push(`🏦 Bank: ${p.bankName}`);
    if (p.area_sqft) lines.push(`📐 ${p.area_sqft.toLocaleString()} sqft`);
    if (p.bedrooms)  lines.push(`🛏 ${p.bedrooms} BHK`);
    lines.push(`💰 Reserve: ${fmtPrice(p.price)}`);
    if (p.auctionDate) lines.push(`📅 Auction: ${fmtDate(p.auctionDate)}`);
    lines.push(`📞 ${p.contactPhone || 'Contact us'}`);
    lines.push('');
  });
  lines.push(`💡 *Why act now?*`);
  lines.push(`✔ Below-market reserve prices`);
  lines.push(`✔ Clear legal title from bank`);
  lines.push(`✔ Fast possession`);
  lines.push(`✔ Brokerage paid on successful deal`);
  lines.push('');
  lines.push(`📲 Reply to get full details & documents!`);
  return lines.join('\n');
}

function buildUnitEmailBody(props) {
  const cards = props.map(p => `
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;background:#fff;">
      <h3 style="margin:0 0 8px;color:#1e293b;font-size:15px;">${p.title}</h3>
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
        📍 ${[p.area, p.city, p.pincode].filter(Boolean).join(', ')}
      </p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="padding:3px 8px 3px 0;color:#94a3b8;">Price</td><td style="font-weight:600;color:#1e293b;">${fmtPrice(p.price)}</td>
            <td style="padding:3px 8px 3px 12px;color:#94a3b8;">Type</td><td style="color:#1e293b;text-transform:capitalize;">${(p.propertyType||'').replace(/_/g,' ')}</td></tr>
        ${p.areaSqft ? `<tr><td style="padding:3px 8px 3px 0;color:#94a3b8;">Area</td><td style="color:#1e293b;">${p.areaSqft.toLocaleString()} sqft</td>
            ${p.totalUnits ? `<td style="padding:3px 8px 3px 12px;color:#94a3b8;">Units</td><td style="color:#1e293b;">${p.totalUnits}</td>` : '<td></td><td></td>'}</tr>` : ''}
        ${p.bedrooms ? `<tr><td style="padding:3px 8px 3px 0;color:#94a3b8;">Bedrooms</td><td style="color:#1e293b;">${p.bedrooms}BHK</td>
            <td style="padding:3px 8px 3px 12px;color:#94a3b8;">Listing</td><td style="color:#1e293b;text-transform:capitalize;">${(p.listingType||'').replace(/_/g,' ')}</td></tr>` : ''}
        ${p.reraNumber ? `<tr><td style="padding:3px 8px 3px 0;color:#94a3b8;">RERA</td><td colspan="3" style="color:#1e293b;">${p.reraNumber}</td></tr>` : ''}
      </table>
      ${p.sellerPhone ? `<p style="margin:8px 0 0;font-size:13px;color:#475569;">📞 ${p.sellerPhone}</p>` : ''}
    </div>`).join('');

  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
      <h2 style="margin:0;font-size:20px;">Property Update</h2>
      <p style="margin:4px 0 0;opacity:.85;font-size:14px;">Exclusive listings from your Master Broker</p>
    </div>
    ${cards}
    <div style="background:#ede9fe;border-radius:12px;padding:16px;margin-top:8px;">
      <h4 style="margin:0 0 8px;color:#4f46e5;">Broker Partner Benefits</h4>
      <ul style="margin:0;padding-left:18px;color:#5b21b6;font-size:13px;">
        <li>Site visit support &amp; client handling</li>
        <li>Priority leads in your pincode</li>
        <li>Brokerage on every closed deal</li>
        <li>Marketing materials provided</li>
      </ul>
    </div>
  </div>`;
}

function buildMortgageEmailBody(props) {
  const cards = props.map(p => `
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;background:#fff;">
      <h3 style="margin:0 0 8px;color:#1e293b;font-size:15px;">${p.title}</h3>
      <p style="color:#64748b;font-size:13px;margin:0 0 8px;">
        📍 ${[p.area, p.city, p.pincode].filter(Boolean).join(', ')}
      </p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="padding:3px 8px 3px 0;color:#94a3b8;">Reserve Price</td><td style="font-weight:600;color:#1e293b;">${fmtPrice(p.price)}</td>
            <td style="padding:3px 8px 3px 12px;color:#94a3b8;">Bank</td><td style="color:#1e293b;">${p.bankName||'—'}</td></tr>
        ${p.area_sqft ? `<tr><td style="padding:3px 8px 3px 0;color:#94a3b8;">Area</td><td style="color:#1e293b;">${p.area_sqft.toLocaleString()} sqft</td>
            ${p.bedrooms ? `<td style="padding:3px 8px 3px 12px;color:#94a3b8;">Bedrooms</td><td style="color:#1e293b;">${p.bedrooms}BHK</td>` : '<td></td><td></td>'}</tr>` : ''}
        ${p.auctionDate ? `<tr><td style="padding:3px 8px 3px 0;color:#94a3b8;">Auction Date</td><td colspan="3" style="color:#dc2626;font-weight:600;">${fmtDate(p.auctionDate)}</td></tr>` : ''}
      </table>
      ${p.contactPhone ? `<p style="margin:8px 0 0;font-size:13px;color:#475569;">📞 ${p.contactPhone}</p>` : ''}
    </div>`).join('');

  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:20px;">
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
      <h2 style="margin:0;font-size:20px;">Bank Auction Opportunities</h2>
      <p style="margin:4px 0 0;opacity:.85;font-size:14px;">Below-market properties from your Master Broker</p>
    </div>
    ${cards}
    <div style="background:#fee2e2;border-radius:12px;padding:16px;margin-top:8px;">
      <h4 style="margin:0 0 8px;color:#dc2626;">Why These Are Special</h4>
      <ul style="margin:0;padding-left:18px;color:#991b1b;font-size:13px;">
        <li>Below-market reserve prices</li>
        <li>Clear legal title from bank</li>
        <li>Fast possession</li>
        <li>Brokerage paid on successful deal</li>
      </ul>
    </div>
  </div>`;
}

/* ─── Coverage pincode picker modal ───────────────────────────────────────
   restrictToCities: limits picker to those cities only.
   ownedPincodes:    Set of pincodes belonging to the current master broker —
                     pulled out of "reserved/taken" and shown as selectable
                     "Your Territory" chips so the master can assign their own pincodes. */
function CoveragePickerModal({ onClose, onConfirm, restrictToCities, ownedPincodes }) {
  const restricted  = restrictToCities && restrictToCities.length > 0;
  const myPins      = ownedPincodes instanceof Set ? ownedPincodes : new Set(ownedPincodes || []);
  const [state, setState]       = useState(STATE_LIST[0] || '');
  const [city, setCity]         = useState(restricted && restrictToCities.length === 1 ? restrictToCities[0] : '');
  const [area, setArea]         = useState('');
  const [coverage, setCoverage] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState([]);
  const debounce                = useRef(null);
  const pickerCities            = getCities(state);

  useEffect(() => {
    if (!city.trim()) { setCoverage([]); return; }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ city });
        if (area.trim()) params.set('area', area);
        const { data } = await api.get(`/master-broker/coverage-map?${params}`);
        setCoverage(data.coverage || []);
      } catch { setCoverage([]); }
      setLoading(false);
    }, 500);
  }, [city, area]);

  // My own pincodes — always selectable regardless of coverage-map "taken" status
  const mine      = coverage.filter(c => myPins.has(c.pincode));
  // Also include owned pincodes that don't appear in coverage-map yet (pre-populate)
  const mineExtra = [...myPins].filter(p => !coverage.some(c => c.pincode === p)).map(p => ({ pincode: p, available: false }));
  const allMine   = [...mine, ...mineExtra];

  const available = coverage.filter(c => c.available && !myPins.has(c.pincode));
  const reserved  = coverage.filter(c => !c.available && c.takenBy?.pending  && !myPins.has(c.pincode));
  const taken     = coverage.filter(c => !c.available && !c.takenBy?.pending && !myPins.has(c.pincode));

  function toggle(pincode) {
    setSelected(prev => prev.includes(pincode) ? prev.filter(x => x !== pincode) : [...prev, pincode]);
  }

  function handleConfirm() {
    if (!city.trim()) return;
    const areas = selected.length
      ? selected.map(p => ({ city: city.trim(), area: area.trim(), pincode: p }))
      : [{ city: city.trim(), area: area.trim(), pincode: '' }];
    onConfirm(areas);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">Select Coverage Area</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {restricted
                ? `Restricted to your own coverage — ${restrictToCities.join(', ')}`
                : 'Green = available · Amber = reserved · Gray = taken'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* State / City / Area inputs */}
        <div className="px-6 py-4 border-b border-slate-50 space-y-3">
          {restricted ? (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">City *</label>
              {restrictToCities.length === 1 ? (
                <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span className="material-icons-outlined text-sm text-[#4900e5]">location_on</span>
                  {restrictToCities[0]}
                </div>
              ) : (
                <select
                  autoFocus
                  value={city}
                  onChange={e => { setCity(e.target.value); setSelected([]); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] bg-white"
                >
                  <option value="">Select your city…</option>
                  {restrictToCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">State</label>
                <select
                  autoFocus
                  value={state}
                  onChange={e => { setState(e.target.value); setCity(''); setSelected([]); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5] bg-white"
                >
                  <option value="">Select state…</option>
                  {STATE_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">City *</label>
                <input
                  value={city}
                  onChange={e => { setCity(e.target.value); setSelected([]); }}
                  placeholder="e.g. Pune"
                  list="picker-modal-cities"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5]"
                />
                <datalist id="picker-modal-cities">
                  {pickerCities.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Area <span className="text-slate-300 normal-case font-normal">(optional)</span></label>
            <input
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder="e.g. Baner"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 focus:border-[#4900e5]"
            />
          </div>
        </div>

        {/* Pincode grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <span className="material-icons-outlined text-3xl animate-spin text-[#4900e5]">progress_activity</span>
            </div>
          )}

          {!loading && city.trim() && coverage.length === 0 && (
            <div className="text-center py-10">
              <span className="material-icons-outlined text-4xl text-slate-200">location_off</span>
              <p className="text-slate-400 text-sm mt-2">No pincodes found for "{city}"</p>
              <p className="text-slate-300 text-xs mt-1">You can still submit — our team will define your zone.</p>
            </div>
          )}

          {/* Your Territory — master broker's own approved/requested pincodes, always selectable */}
          {!loading && allMine.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#4900e5] inline-block" />
                <p className="text-xs font-bold text-[#4900e5] uppercase tracking-wide">Your Territory ({allMine.length})</p>
                <button type="button" onClick={() => setSelected(allMine.map(c => c.pincode))}
                  className="ml-auto text-[10px] text-[#4900e5] font-semibold hover:underline">
                  Select all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allMine.map(c => (
                  <button
                    type="button"
                    key={c.pincode}
                    onClick={() => toggle(c.pincode)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                      ${selected.includes(c.pincode)
                        ? 'bg-[#4900e5] text-white border-[#4900e5] shadow-md'
                        : 'bg-[#4900e5]/10 text-[#4900e5] border-[#4900e5]/30 hover:border-[#4900e5] hover:bg-[#4900e5]/20'}`}
                  >
                    {selected.includes(c.pincode) ? '✓ ' : ''}{c.pincode}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && available.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Available ({available.length})</p>
                {available.length > 0 && (
                  <button type="button" onClick={() => setSelected(available.map(c => c.pincode))}
                    className="ml-auto text-[10px] text-[#4900e5] font-semibold hover:underline">
                    Select all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {available.map(c => (
                  <button
                    type="button"
                    key={c.pincode}
                    onClick={() => toggle(c.pincode)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                      ${selected.includes(c.pincode)
                        ? 'bg-[#4900e5] text-white border-[#4900e5] shadow-md'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-[#4900e5] hover:text-[#4900e5]'}`}
                  >
                    {selected.includes(c.pincode) ? '✓ ' : ''}{c.pincode}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && reserved.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Reserved — Pending Approval ({reserved.length})</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {reserved.map(c => (
                  <div key={c.pincode} title={`Reserved for ${c.takenBy?.name || 'a pending applicant'}`}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-600 cursor-not-allowed flex items-center gap-1">
                    <span className="material-icons-outlined text-[10px]">schedule</span>
                    {c.pincode}
                    <span className="text-[9px] text-amber-400 ml-0.5">{c.takenBy?.name ? `· ${c.takenBy.name}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && taken.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Already Taken ({taken.length})</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {taken.map(c => (
                  <div
                    key={c.pincode}
                    title={`Taken by ${c.takenBy?.name || 'a master broker'}`}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed flex items-center gap-1"
                  >
                    <span className="material-icons-outlined text-[10px]">lock</span>
                    {c.pincode}
                    <span className="text-[9px] text-slate-300 ml-0.5">{c.takenBy?.name ? `· ${c.takenBy.name}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 space-y-3">
          {selected.length > 0 && (
            <p className="text-xs text-[#4900e5] font-semibold">
              {selected.length} pincode{selected.length > 1 ? 's' : ''} selected: {selected.join(', ')}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={!city.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-50">
              {selected.length > 0 ? `Add ${selected.length} Pincode${selected.length > 1 ? 's' : ''}` : city.trim() ? 'Add City (no pincode)' : 'Enter a city'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── pin-code tag input ────────────────────────────────────────────────── */
function PincodeInput({ values, onChange }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  function add(raw) {
    const v = raw.trim().replace(/[^0-9]/g, '');
    if (v.length >= 4 && !values.includes(v)) onChange([...values, v]);
    setInput('');
  }
  function onKey(e) {
    if (['Enter', ',', ' ', 'Tab'].includes(e.key)) { e.preventDefault(); add(input); }
    if (e.key === 'Backspace' && !input && values.length) onChange(values.slice(0, -1));
  }
  function remove(v) { onChange(values.filter(x => x !== v)); }

  return (
    <div
      className="flex flex-wrap gap-1.5 items-center border border-slate-200 rounded-xl px-3 py-2 min-h-[38px] cursor-text bg-white"
      onClick={() => inputRef.current?.focus()}
    >
      {values.map(v => (
        <span key={v} className="flex items-center gap-1 bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold px-2 py-0.5 rounded-full">
          {v}
          <button type="button" onClick={e => { e.stopPropagation(); remove(v); }} className="hover:text-rose-500">×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => input && add(input)}
        placeholder={values.length ? '' : 'Add pincode…'}
        className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
      />
    </div>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function areasFromZone(zone) {
  const out = [];
  if (zone?.homeArea?.city) {
    out.push({ city: zone.homeArea.city, area: zone.homeArea.area || '', pincode: zone.homeArea.pincode || '' });
  }
  for (const a of zone?.additionalAreas || []) {
    if (a.city) out.push({ city: a.city, area: a.area || '', pincode: a.pincode || '' });
  }
  return out;
}

/* ─── inline zone editor component ──────────────────────────────────────── */
function ZoneEditor({ initial, brokerZone, onSave, onCancel, saving, msg, applyMode = false }) {
  const [editAreas, setEditAreas] = useState(initial || []);
  const [showPicker, setShowPicker] = useState(false);

  // In apply mode: sync parent → editor when initial changes (e.g. brokerZone pre-fill arrives)
  useEffect(() => {
    if (applyMode && initial?.length > 0 && editAreas.length === 0) {
      setEditAreas(initial);
    }
  }, [initial]); // eslint-disable-line

  // In apply mode: keep parent state in sync when editor changes
  useEffect(() => {
    if (applyMode) onSave(editAreas);
  }, [editAreas]); // eslint-disable-line

  const registeredZoneAreas = useMemo(() => areasFromZone(brokerZone), [brokerZone]);

  function addZoneArea(a) {
    setEditAreas(prev => {
      const dup = prev.find(x => x.city === a.city && x.area === a.area && x.pincode === a.pincode);
      return dup ? prev : [...prev, a];
    });
  }

  function handlePickerConfirm(newAreas) {
    setEditAreas(prev => {
      const combined = [...prev];
      for (const a of newAreas) {
        const dup = combined.find(x => x.city === a.city && x.area === a.area && x.pincode === a.pincode);
        if (!dup) combined.push(a);
      }
      return combined;
    });
  }

  // Group for display
  const grouped = useMemo(() => {
    const map = {};
    editAreas.forEach(a => {
      const key = `${a.city}||${a.area}`;
      if (!map[key]) map[key] = { city: a.city, area: a.area, pincodes: [] };
      if (a.pincode) map[key].pincodes.push(a.pincode);
    });
    return Object.values(map);
  }, [editAreas]);

  return (
    <div className="space-y-4">
      {/* Quick-pick from registered zone */}
      {registeredZoneAreas.length > 0 && (
        <div className="p-3 bg-[#4900e5]/5 border border-[#4900e5]/10 rounded-xl">
          <p className="text-xs font-semibold text-[#4900e5] mb-2 uppercase tracking-wide">Your registered zone — click to add</p>
          <div className="flex flex-wrap gap-2">
            {registeredZoneAreas.map((a, i) => {
              const already = editAreas.some(x => x.city === a.city && x.pincode === a.pincode);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={already}
                  onClick={() => addZoneArea(a)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                    ${already
                      ? 'bg-[#4900e5] text-white border-[#4900e5] cursor-default'
                      : 'bg-white border-[#4900e5]/30 text-[#4900e5] hover:bg-[#4900e5]/10'}`}
                >
                  {already && <span className="material-icons-outlined text-xs">check</span>}
                  <span className="material-icons-outlined text-xs">location_on</span>
                  {a.city}{a.pincode ? ` — ${a.pincode}` : ''}{a.area ? ` (${a.area})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected areas */}
      {grouped.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 text-sm">
          No zone selected yet — pick from above or use the picker
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map((g, gi) => (
            <div key={gi} className="flex items-start gap-3 p-3 rounded-xl bg-[#4900e5]/5 border border-[#4900e5]/10">
              <span className="material-icons-outlined text-[#4900e5] text-base mt-0.5">location_on</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">{g.city}{g.area ? ` — ${g.area}` : ''}</p>
                {g.pincodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {g.pincodes.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditAreas(prev => prev.filter(a => !(a.city === g.city && a.area === g.area && a.pincode === p)))}
                        className="px-2.5 py-0.5 rounded-full bg-[#4900e5]/15 text-[#4900e5] text-xs font-semibold hover:bg-rose-100 hover:text-rose-600 transition group flex items-center gap-1"
                      >
                        {p}
                        <span className="material-icons-outlined text-[10px] opacity-0 group-hover:opacity-100">close</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button"
                onClick={() => setEditAreas(prev => prev.filter(a => `${a.city}||${a.area}` !== `${g.city}||${g.area}`))}
                className="text-slate-300 hover:text-rose-500 transition">
                <span className="material-icons-outlined text-lg">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4900e5]/10 text-[#4900e5] text-xs font-bold hover:bg-[#4900e5]/20 transition">
          <span className="material-icons-outlined text-sm">add_location_alt</span>
          Pick from Map
        </button>
        {editAreas.length > 0 && (
          <button type="button" onClick={() => setEditAreas([])}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition">
            Clear All
          </button>
        )}
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm border ${msg.includes('updated') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
          {msg}
        </div>
      )}

      {/* In apply mode: just update parent state live, no Save/Cancel buttons */}
      {!applyMode && (
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(editAreas)} disabled={saving || editAreas.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Zone'}
          </button>
        </div>
      )}

      {showPicker && (
        <CoveragePickerModal onClose={() => setShowPicker(false)} onConfirm={handlePickerConfirm} />
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */
export default function MasterBroker() {
  const { user } = useAuth();
  const [myRequest, setMyRequest] = useState(null);
  const [myInquiry, setMyInquiry] = useState(null);
  // Source of truth is the user's own brokerTier — a formal MasterBrokerRequest
  // record isn't the only path to master tier (e.g. approval via public inquiry,
  // or an admin-granted tier), so don't gate on that record's status.
  const isMaster = user?.brokerTier === 'master';
  const [loading, setLoading]     = useState(true);
  const [brokerZone, setBrokerZone] = useState({ homeArea: null, additionalAreas: [] });

  // Apply form
  const [motivation, setMotivation]   = useState('');
  const [areas, setAreas]             = useState([]);
  const [submitting, setSubmitting]   = useState(false);
  const [msg, setMsg]                 = useState('');

  // Edit zone (for pending inquiry / request)
  const [editingZone, setEditingZone] = useState(false);
  const [savingZone, setSavingZone]   = useState(false);
  const [zoneMsg, setZoneMsg]         = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    // Load broker's registered zone (for pre-filling)
    api.get('/mortgage-properties/my-areas')
      .then(r => setBrokerZone(r.data || { homeArea: null, additionalAreas: [] }))
      .catch(() => {});

    try {
      const { data } = await api.get('/master-broker/my-request');
      setMyRequest(data.request);
    } catch { /* no formal application yet — check for a signup inquiry */ }

    // If no formal application, check if they signed up via the master broker form
    try {
      const { data } = await api.get('/master-broker/my-inquiry');
      if (data.inquiry) setMyInquiry(data.inquiry);
    } catch { /* no inquiry either */ }

    setLoading(false);
  }

  // Pre-fill apply form areas from broker's registered zone (only when form is empty)
  useEffect(() => {
    if (brokerZone?.homeArea?.city && areas.length === 0) {
      setAreas(areasFromZone(brokerZone));
    }
  }, [brokerZone]); // eslint-disable-line

  async function handleSubmit(e) {
    e.preventDefault();
    if (areas.length === 0) { setMsg('Please add at least one coverage area.'); return; }
    setSubmitting(true); setMsg('');
    try {
      await api.post('/master-broker/apply', { motivation, requestedAreas: areas });
      setMsg('Application submitted! The visit team will review and contact you.');
      fetchData();
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to submit.'); }
    finally { setSubmitting(false); }
  }

  async function saveInquiryZone(editAreas) {
    setSavingZone(true); setZoneMsg('');
    try {
      const { data } = await api.patch('/master-broker/my-inquiry', { requestedAreas: editAreas });
      setMyInquiry(data.inquiry);
      setZoneMsg('Zone updated!');
      setEditingZone(false);
    } catch (err) { setZoneMsg(err.response?.data?.message || 'Update failed.'); }
    setSavingZone(false);
  }

  async function saveRequestZone(editAreas) {
    setSavingZone(true); setZoneMsg('');
    try {
      const { data } = await api.patch('/master-broker/my-request', { requestedAreas: editAreas });
      setMyRequest(data.request);
      setZoneMsg('Zone updated!');
      setEditingZone(false);
    } catch (err) { setZoneMsg(err.response?.data?.message || 'Update failed.'); }
    setSavingZone(false);
  }


  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-icons-outlined text-4xl text-[#4900e5] animate-spin">progress_activity</span>
    </div>
  );

  if (isMaster) return <MasterPanel request={myRequest} />;

  // Show signup inquiry status (user registered directly as master broker)
  if (!myRequest && myInquiry) {
    const INQ_STATUS = {
      new:       { label: 'Received',         cls: 'bg-amber-100 text-amber-700',   icon: 'hourglass_top' },
      assigned:  { label: 'Team Assigned',    cls: 'bg-blue-100 text-blue-700',     icon: 'person_check' },
      contacted: { label: 'Team Contacted',   cls: 'bg-sky-100 text-sky-700',       icon: 'phone_in_talk' },
      converted: { label: 'Accepted',         cls: 'bg-emerald-100 text-emerald-700', icon: 'verified' },
      rejected:  { label: 'Not Accepted',     cls: 'bg-rose-100 text-rose-700',     icon: 'cancel' },
      cancelled: { label: 'Cancelled',        cls: 'bg-slate-100 text-slate-500',   icon: 'block' },
    };
    const s = INQ_STATUS[myInquiry.status] || INQ_STATUS['new'];
    return (
      <div className="max-w-container mx-auto px-6 py-8">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-6">Master Broker Signup</h1>
        <div className="card p-6 space-y-5 max-w-xl">

          {/* Status header */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.cls.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
              <span className="material-icons-outlined text-2xl">{s.icon}</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface">Your signup is under review</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${s.cls}`}>{s.label}</span>
            </div>
          </div>

          <p className="text-sm text-on-surface-variant leading-relaxed">
            You registered as a <strong>Master Broker</strong>. Our team will verify your details
            and coverage zone, then reach out to activate your account.
          </p>

          {/* Requested areas + edit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Your Requested Zone</p>
              {/* Only allow edit while not yet assigned to team */}
              {!editingZone && ['new', 'contacted'].includes(myInquiry.status) && (
                <button onClick={() => { setEditingZone(true); setZoneMsg(''); }}
                  className="flex items-center gap-1 text-xs text-[#4900e5] font-semibold hover:underline">
                  <span className="material-icons-outlined text-sm">edit_location_alt</span>
                  Change Zone
                </button>
              )}
            </div>

            {editingZone ? (
              <ZoneEditor
                initial={myInquiry.requestedAreas || []}
                brokerZone={brokerZone}
                onSave={saveInquiryZone}
                onCancel={() => { setEditingZone(false); setZoneMsg(''); }}
                saving={savingZone}
                msg={zoneMsg}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(myInquiry.requestedAreas?.length > 0) ? myInquiry.requestedAreas.map((a, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
                    {[a.city, a.area, a.pincode].filter(Boolean).join(' / ') || 'Zone TBD'}
                  </span>
                )) : (
                  <span className="text-xs text-slate-400 italic">No zone selected yet —
                    <button onClick={() => setEditingZone(true)} className="text-[#4900e5] font-semibold ml-1 hover:underline">Add zone</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Assigned team member */}
          {myInquiry.assignedTo && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm">
              <span className="material-icons-outlined text-blue-400 text-base">person_check</span>
              <span className="text-blue-700 font-medium">
                {myInquiry.assignedTo.name || 'A team member'} is handling your request
              </span>
            </div>
          )}

          {/* Accepted — next step */}
          {myInquiry.status === 'converted' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                <span className="material-icons-outlined text-base">verified</span>
                Your signup has been accepted!
              </p>
              <p className="text-xs text-emerald-600">
                Our team will contact you to complete the formal Master Broker application and payment.
              </p>
            </div>
          )}

          {myInquiry.adminNote && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
              {myInquiry.adminNote}
            </div>
          )}

          <p className="text-xs text-slate-400">Submitted: {fmtDate(myInquiry.createdAt)}</p>
        </div>
      </div>
    );
  }

  if (myRequest) {
    const badge = STATUS_BADGE[myRequest.status] || {};
    return (
      <div className="max-w-container mx-auto px-6 py-8">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-6">Master Broker Application</h1>
        <div className="card p-6 space-y-4 max-w-xl">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-on-surface">Application Status</p>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.cls}`}>{badge.label}</span>
          </div>
          <div className="text-sm text-on-surface-variant space-y-1">
            <p>Applied: {fmtDate(myRequest.createdAt)}</p>
            {myRequest.assignedVisitor && <p>Reviewer: {myRequest.assignedVisitor.name}</p>}
            {myRequest.adminNote && <p className="mt-2 p-3 bg-surface-container rounded-lg">{myRequest.adminNote}</p>}
          </div>

          {/* Requested areas + edit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Requested Areas</p>
              {/* Only allow edit while application is still pending (not yet reviewed) */}
              {!editingZone && myRequest.status === 'pending' && (
                <button onClick={() => { setEditingZone(true); setZoneMsg(''); }}
                  className="flex items-center gap-1 text-xs text-[#4900e5] font-semibold hover:underline">
                  <span className="material-icons-outlined text-sm">edit_location_alt</span>
                  Change Zone
                </button>
              )}
            </div>

            {editingZone ? (
              <ZoneEditor
                initial={myRequest.requestedAreas || []}
                brokerZone={brokerZone}
                onSave={saveRequestZone}
                onCancel={() => { setEditingZone(false); setZoneMsg(''); }}
                saving={savingZone}
                msg={zoneMsg}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(myRequest.requestedAreas?.length > 0) ? myRequest.requestedAreas.map((a, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
                    {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                  </span>
                )) : (
                  <span className="text-xs text-slate-400 italic">No areas on record</span>
                )}
              </div>
            )}
          </div>

          {myRequest.status === 'approved' && !myRequest.subscriptionPaid && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-1">Payment Pending</p>
              <p>Your application is approved. Please pay the ₹50,000 subscription fee to activate Master Broker status.</p>
            </div>
          )}
          {myRequest.status === 'rejected' && (
            <button onClick={() => setMyRequest(null)} className="btn-primary text-sm py-2 px-4">Apply Again</button>
          )}
        </div>
      </div>
    );
  }

  // Apply form
  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="font-montserrat font-bold text-2xl text-on-surface">Become a Master Broker</h1>
          <p className="text-on-surface-variant text-sm mt-1">Get access to manage brokers in your area, priority listings, and professional marketing support.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: 'camera_alt',  label: 'Professional Photoshoot' },
            { icon: 'campaign',    label: 'Digital Marketing' },
            { icon: 'people',      label: 'Manage Sub-Brokers' },
            { icon: 'star',        label: 'Priority Listings' },
            { icon: 'payments',    label: '₹50k Plan (Refundable)' },
            { icon: 'verified',    label: 'Verified Badge' },
          ].map(b => (
            <div key={b.icon} className="card p-3 flex items-center gap-2 text-sm">
              <span className="material-icons-outlined text-[#4900e5] text-lg">{b.icon}</span>
              <span className="text-on-surface font-medium">{b.label}</span>
            </div>
          ))}
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-xl text-sm border ${msg.includes('submitted') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
              Why do you want to become a Master Broker?
            </label>
            <textarea rows={3} value={motivation}
              onChange={e => setMotivation(e.target.value)}
              placeholder="Describe your experience and why you'd like to lead in your area…"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 resize-none" />
          </div>

          {/* Coverage areas — uses ZoneEditor with registered zone quick-pick */}
          <div>
            <div className="mb-3">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Coverage Areas *</label>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Your registered city/pincodes are shown below — click to add, or pick new ones from the map
              </p>
            </div>
            <ZoneEditor
              initial={areas}
              brokerZone={brokerZone}
              onSave={(newAreas) => setAreas(newAreas)}
              onCancel={() => {}}
              saving={false}
              msg=""
              applyMode
            />
          </div>

          <button type="submit" disabled={submitting || areas.length === 0}
            className="w-full py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-60">
            {submitting ? 'Submitting…' : `Submit Application${areas.length > 0 ? ` (${areas.length} area${areas.length > 1 ? 's' : ''})` : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MASTER PANEL — full management interface
═══════════════════════════════════════════════════════════════════════════ */
const INP = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 bg-white';

function MasterPanel({ request }) {
  const { user } = useAuth();
  const [tab, setTab]             = useState('brokers');
  const [subBrokers, setSubBrokers] = useState([]);
  const [brokersLoading, setBrokersLoading] = useState(true);

  // The cities this master broker actually covers — sub-brokers can only be
  // added within these, never an arbitrary city.
  const myCities = useMemo(() => {
    const areas = [...(user?.coverageAreas || []), ...(request?.requestedAreas || [])];
    const cities = [...new Set(areas.map(a => a.city).filter(Boolean))];
    if (cities.length === 0 && user?.city) cities.push(user.city);
    return cities;
  }, [user, request]);

  // All pincodes owned by this master broker (approved + requested) —
  // passed to CoveragePickerModal so own pincodes are always selectable.
  const myPincodeSet = useMemo(() => new Set([
    ...(user?.coverageAreas || []).map(a => a.pincode),
    ...(request?.requestedAreas || []).map(a => a.pincode),
  ].filter(Boolean)), [user, request]);

  // Assign area modal
  const [assignBroker, setAssignBroker] = useState(null);
  const [assignForm, setAssignForm]     = useState({ city: '', area: '', pincodes: [] });
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignMsg, setAssignMsg]       = useState('');
  const [showAssignPicker, setShowAssignPicker] = useState(false);

  // Add broker modal
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', city: '', area: '', pincodes: [] });
  const [addSaving, setAddSaving] = useState(false);
  const [addMsg, setAddMsg]       = useState('');
  const [showAddPicker, setShowAddPicker] = useState(false);

  useEffect(() => { fetchBrokers(); }, []);

  async function fetchBrokers() {
    setBrokersLoading(true);
    try {
      const { data } = await api.get('/master-broker/sub-brokers');
      setSubBrokers(data.subBrokers || []);
    } catch { /* empty */ }
    setBrokersLoading(false);
  }

  function openAssign(broker) {
    setAssignBroker(broker);
    const existingPincodes = [broker.pincode, ...(broker.additionalAreas || []).map(a => a.pincode)].filter(Boolean);
    setAssignForm({ city: broker.city || '', area: broker.area || '', pincodes: existingPincodes });
    setAssignMsg('');
  }

  function handleAssignPickerConfirm(areas) {
    if (!areas.length) return;
    const pincodes = areas.map(a => a.pincode).filter(Boolean);
    setAssignForm(f => ({ ...f, city: areas[0].city, area: areas[0].area, pincodes }));
  }

  async function saveAssign(e) {
    e.preventDefault();
    setAssignSaving(true); setAssignMsg('');
    try {
      const { data } = await api.patch(`/master-broker/sub-brokers/${assignBroker._id}`, assignForm);
      setSubBrokers(prev => prev.map(b => b._id === assignBroker._id ? { ...b, ...data.broker } : b));
      setAssignMsg('Saved!');
      setTimeout(() => setAssignBroker(null), 800);
    } catch (err) { setAssignMsg(err.response?.data?.message || 'Failed.'); }
    setAssignSaving(false);
  }

  function openAddBroker() {
    setAddForm({ name: '', email: '', phone: '', city: '', area: '', pincodes: [] });
    setAddMsg('');
    setShowAddBroker(true);
  }

  function handleAddPickerConfirm(areas) {
    if (!areas.length) return;
    const pincodes = areas.map(a => a.pincode).filter(Boolean);
    setAddForm(f => ({ ...f, city: areas[0].city, area: areas[0].area, pincodes }));
  }

  async function saveAddBroker(e) {
    e.preventDefault();
    setAddSaving(true); setAddMsg('');
    try {
      const { data } = await api.post('/master-broker/sub-brokers', {
        name: addForm.name, email: addForm.email, phone: addForm.phone,
        city: addForm.city, area: addForm.area, pincodes: addForm.pincodes,
      });
      setSubBrokers(prev => [data.subBroker, ...prev]);
      setAddMsg('Broker added — login details emailed to them!');
      setTimeout(() => setShowAddBroker(false), 1200);
    } catch (err) { setAddMsg(err.response?.data?.message || 'Failed to add broker.'); }
    setAddSaving(false);
  }

  // ── Pincode expansion ──────────────────────────────────────────────────────
  const [expansions, setExpansions]         = useState([]);
  const [expLoading, setExpLoading]         = useState(false);
  const [showExpForm, setShowExpForm]       = useState(false);
  const [expAreas, setExpAreas]             = useState([]);
  const [expReason, setExpReason]           = useState('');
  const [expSubmitting, setExpSubmitting]   = useState(false);
  const [expMsg, setExpMsg]                 = useState({ text: '', ok: true });
  const [showExpPicker, setShowExpPicker]   = useState(false);

  const coverageCount = user?.coverageAreas?.length ?? 0;
  const pincodeLimit  = user?.approvedPincodeLimit ?? null;

  useEffect(() => { if (tab === 'expansions') fetchExpansions(); }, [tab]);

  async function fetchExpansions() {
    setExpLoading(true);
    try {
      const { data } = await api.get('/master-broker/my-expansions');
      setExpansions(data.requests || []);
    } catch { /* empty */ }
    setExpLoading(false);
  }

  function handleExpPickerConfirm(areas) {
    setExpAreas(prev => {
      const existing = new Set(prev.map(a => a.pincode));
      const toAdd = areas.filter(a => a.pincode && !existing.has(a.pincode));
      return [...prev, ...toAdd];
    });
  }

  function removeExpArea(pincode) {
    setExpAreas(prev => prev.filter(a => a.pincode !== pincode));
  }

  async function submitExpansion(e) {
    e.preventDefault();
    if (!expAreas.length) { setExpMsg({ text: 'Add at least one pincode.', ok: false }); return; }
    setExpSubmitting(true); setExpMsg({ text: '', ok: true });
    try {
      await api.post('/master-broker/expansion', { requestedAreas: expAreas, reason: expReason });
      setExpMsg({ text: 'Request submitted!', ok: true });
      setExpAreas([]); setExpReason(''); setShowExpForm(false);
      fetchExpansions();
    } catch (err) {
      setExpMsg({ text: err.response?.data?.message || 'Failed to submit request.', ok: false });
    }
    setExpSubmitting(false);
  }

  const EXP_STATUS = {
    pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700',   icon: 'hourglass_top' },
    approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700', icon: 'check_circle' },
    rejected: { label: 'Rejected', cls: 'bg-rose-100 text-rose-700',     icon: 'cancel' },
  };

  const pendingExpCount = expansions.filter(r => r.status === 'pending').length;

  const TABS = [
    { key: 'brokers',    icon: 'people',           label: 'My Brokers' },
    { key: 'unit',       icon: 'domain',           label: 'Unit Properties' },
    { key: 'mortgage',   icon: 'account_balance',  label: 'Mortgage Properties' },
    { key: 'expansions', icon: 'add_location_alt', label: 'Pincode Expansion', count: pendingExpCount },
  ];

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="material-icons-outlined text-3xl text-[#4900e5]">verified</span>
          <div>
            <h1 className="font-montserrat font-bold text-2xl text-on-surface">Master Broker Panel</h1>
            <p className="text-on-surface-variant text-sm">Manage your brokers and distribute properties</p>
          </div>
        </div>
        <div className="sm:ml-auto flex flex-wrap gap-2">
          {request?.subscriptionPaid && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
              <span className="material-icons-outlined text-sm">check_circle</span> Active
            </span>
          )}
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            <span className="material-icons-outlined text-sm">people</span> {subBrokers.length} Brokers
          </span>
          <button onClick={openAddBroker}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#4900e5] text-white text-xs font-semibold hover:bg-[#6236ff] transition">
            <span className="material-icons-outlined text-sm">person_add</span> Add Broker
          </button>
        </div>
      </div>

      {/* Coverage areas */}
      {request?.requestedAreas?.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 font-semibold">Coverage:</span>
          {request.requestedAreas.map((a, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-medium">
              {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
            </span>
          ))}
        </div>
      )}

      {/* Pincode usage banner */}
      {pincodeLimit !== null && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
          ${coverageCount >= pincodeLimit ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-[#4900e5]/8 text-[#4900e5] border border-[#4900e5]/20'}`}>
          <span className="material-icons-outlined text-lg">
            {coverageCount >= pincodeLimit ? 'warning' : 'location_on'}
          </span>
          <span>
            Pincode Usage: <strong>{coverageCount} / {pincodeLimit}</strong>
            {coverageCount >= pincodeLimit ? ' — Limit reached. Request expansion to add more.' : ` — ${pincodeLimit - coverageCount} slots remaining`}
          </span>
          {coverageCount >= pincodeLimit && (
            <button onClick={() => setTab('expansions')}
              className="ml-auto text-xs underline hover:no-underline">Request Expansion</button>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap
              ${tab === t.key ? 'border-[#4900e5] text-[#4900e5]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <span className="material-icons-outlined text-base">{t.icon}</span>
            {t.label}
            {t.count > 0 && (
              <span className="ml-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'brokers' && (
        <BrokersTab
          subBrokers={subBrokers}
          loading={brokersLoading}
          onAssign={openAssign}
        />
      )}
      {tab === 'unit' && <PropertySendTab type="unit" subBrokers={subBrokers} />}
      {tab === 'mortgage' && <PropertySendTab type="mortgage" subBrokers={subBrokers} />}

      {/* Expansions tab */}
      {tab === 'expansions' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Pincode Expansion Requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Request admin approval to cover additional pincodes beyond your current limit.
              </p>
            </div>
            <button
              onClick={() => { setShowExpForm(true); setExpMsg({ text: '', ok: true }); setExpAreas([]); setExpReason(''); }}
              disabled={pendingExpCount > 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="material-icons-outlined text-sm">add_location_alt</span>
              Request Expansion
            </button>
          </div>

          {pendingExpCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <span className="material-icons-outlined text-sm">info</span>
              You have a pending expansion request. Wait for admin decision before submitting another.
            </div>
          )}

          {expLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="material-icons-outlined text-3xl animate-spin text-[#4900e5]">progress_activity</span>
            </div>
          ) : expansions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <span className="material-icons-outlined text-5xl text-slate-200">add_location_alt</span>
              <p className="text-slate-400 mt-3 text-sm">No expansion requests yet.</p>
              <p className="text-slate-300 text-xs mt-1">Click "Request Expansion" to apply for more pincodes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expansions.map(req => {
                const s = EXP_STATUS[req.status] || EXP_STATUS['pending'];
                return (
                  <div key={req._id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`material-icons-outlined text-lg ${s.cls.includes('amber') ? 'text-amber-600' : s.cls.includes('emerald') ? 'text-emerald-600' : 'text-rose-500'}`}>{s.icon}</span>
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{fmtDate(req.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        {req.requestedAreas?.length} pincode{req.requestedAreas?.length !== 1 ? 's' : ''} requested
                      </div>
                    </div>

                    {req.requestedAreas?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {req.requestedAreas.map((a, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {req.reason && (
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
                        <span className="text-xs font-semibold text-slate-400 block mb-0.5">Reason</span>
                        {req.reason}
                      </p>
                    )}

                    {req.adminNote && (
                      <p className={`text-sm rounded-xl px-3 py-2 ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <span className="text-xs font-semibold block mb-0.5">Admin Note</span>
                        {req.adminNote}
                      </p>
                    )}

                    {req.status === 'approved' && req.newLimit && (
                      <p className="text-xs text-emerald-600 font-semibold">
                        New pincode limit: {req.newLimit}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Expansion request form modal */}
      {showExpForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Request Pincode Expansion</h3>
              <button onClick={() => setShowExpForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5 mb-4">
              <span className="material-icons-outlined text-sm">info</span>
              Current: <strong>{coverageCount}</strong> pincodes
              {pincodeLimit !== null ? <> / Limit: <strong>{pincodeLimit}</strong></> : ' (no limit set)'}
            </div>

            <form onSubmit={submitExpansion} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Pincodes to Add *
                </label>
                {expAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {expAreas.map((a, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-medium">
                        {[a.city, a.area, a.pincode].filter(Boolean).join(' / ')}
                        <button type="button" onClick={() => removeExpArea(a.pincode)} className="ml-0.5 hover:text-rose-500">
                          <span className="material-icons-outlined text-xs">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setShowExpPicker(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-[#4900e5] hover:text-[#4900e5] transition">
                  <span className="material-icons-outlined text-sm">add_location_alt</span>
                  {expAreas.length > 0 ? 'Add More Pincodes' : 'Select Pincodes'}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Reason (optional)</label>
                <textarea rows={3} className={INP} placeholder="Why do you need more pincodes? e.g. expanding business into new area..."
                  value={expReason} onChange={e => setExpReason(e.target.value)} />
              </div>

              {expMsg.text && (
                <p className={`text-sm ${expMsg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{expMsg.text}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowExpForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={expSubmitting || !expAreas.length}
                  className="flex-1 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-60">
                  {expSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpPicker && (
        <CoveragePickerModal
          onClose={() => setShowExpPicker(false)}
          onConfirm={areas => { handleExpPickerConfirm(areas); setShowExpPicker(false); }}
        />
      )}

      {/* Assign area modal */}
      {assignBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Assign Area — {assignBroker.name}</h3>
              <button onClick={() => setAssignBroker(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <form onSubmit={saveAssign} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">City &amp; Pincode(s)</label>
                {assignForm.city ? (
                  <div className="flex flex-wrap items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                    <span className="text-sm font-semibold text-slate-700">
                      {[assignForm.area, assignForm.city].filter(Boolean).join(', ')}
                    </span>
                    {assignForm.pincodes.map(p => (
                      <span key={p} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#4900e5]/10 text-[#4900e5]">{p}</span>
                    ))}
                    <button type="button" onClick={() => setShowAssignPicker(true)}
                      className="ml-auto text-xs font-semibold text-[#4900e5] hover:underline">Change</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAssignPicker(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-[#4900e5] hover:text-[#4900e5] transition">
                    <span className="material-icons-outlined text-sm">add_location_alt</span>
                    Select City &amp; Pincode(s)
                  </button>
                )}
              </div>
              {assignMsg && (
                <p className={`text-sm ${assignMsg === 'Saved!' ? 'text-emerald-600' : 'text-rose-500'}`}>{assignMsg}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setAssignBroker(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={assignSaving || !assignForm.city}
                  className="flex-1 py-2 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-60">
                  {assignSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignPicker && (
        <CoveragePickerModal
          onClose={() => setShowAssignPicker(false)}
          onConfirm={handleAssignPickerConfirm}
          restrictToCities={myCities}
          ownedPincodes={myPincodeSet}
        />
      )}

      {/* Add broker modal */}
      {showAddBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Add Broker to Your Team</h3>
              <button onClick={() => setShowAddBroker(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              A login password will be auto-generated and emailed to the broker along with their assigned pincode(s).
            </p>
            <form onSubmit={saveAddBroker} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Name *</label>
                <input required className={INP} placeholder="Broker's full name" value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Email *</label>
                <input required type="email" className={INP} placeholder="broker@example.com" value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Phone</label>
                <input className={INP} placeholder="9876543210" value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">City &amp; Pincode(s)</label>
                {addForm.city ? (
                  <div className="flex flex-wrap items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5">
                    <span className="text-sm font-semibold text-slate-700">
                      {[addForm.area, addForm.city].filter(Boolean).join(', ')}
                    </span>
                    {addForm.pincodes.map(p => (
                      <span key={p} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#4900e5]/10 text-[#4900e5]">{p}</span>
                    ))}
                    <button type="button" onClick={() => setShowAddPicker(true)}
                      className="ml-auto text-xs font-semibold text-[#4900e5] hover:underline">Change</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddPicker(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-semibold hover:border-[#4900e5] hover:text-[#4900e5] transition">
                    <span className="material-icons-outlined text-sm">add_location_alt</span>
                    Select City &amp; Pincode(s)
                  </button>
                )}
              </div>
              {addMsg && (
                <p className={`text-sm ${addMsg.includes('emailed') ? 'text-emerald-600' : 'text-rose-500'}`}>{addMsg}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowAddBroker(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={addSaving || !addForm.city}
                  className="flex-1 py-2 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-60">
                  {addSaving ? 'Adding…' : 'Add Broker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPicker && (
        <CoveragePickerModal
          onClose={() => setShowAddPicker(false)}
          onConfirm={handleAddPickerConfirm}
          restrictToCities={myCities}
          ownedPincodes={myPincodeSet}
        />
      )}
    </div>
  );
}

/* ─── Brokers tab ─────────────────────────────────────────────────────────── */
function BrokersTab({ subBrokers, loading, onAssign }) {
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <span className="material-icons-outlined text-3xl animate-spin text-[#4900e5]">progress_activity</span>
    </div>
  );

  // Split into pincode-assigned vs normal
  const pincodeBrokers = subBrokers.filter(b => b.pincode);
  const normalBrokers  = subBrokers.filter(b => !b.pincode);

  if (!subBrokers.length) return (
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
      <span className="material-icons-outlined text-5xl text-slate-200">people_outline</span>
      <p className="text-slate-400 mt-3 text-sm">No sub-brokers assigned yet.</p>
      <p className="text-slate-300 text-xs mt-1">New brokers who join under your coverage area will appear here.</p>
    </div>
  );

  const BrokerRow = ({ b }) => (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4">
        <div className="font-semibold text-slate-800 text-sm">{b.name}</div>
        <div className="text-xs text-slate-400">{b.email}</div>
      </td>
      <td className="py-3 px-4 text-slate-500 text-sm">{b.phone || '—'}</td>
      <td className="py-3 px-4">
        {b.pincode ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#4900e5]/10 text-[#4900e5] text-xs font-semibold">
            <span className="material-icons-outlined text-xs">location_on</span>
            {[b.area, b.city, b.pincode].filter(Boolean).join(', ')}
          </span>
        ) : (
          <span className="text-slate-300 text-xs italic">Not assigned</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {b.status}
        </span>
      </td>
      <td className="py-3 px-4 text-slate-400 text-xs">{fmtDate(b.createdAt)}</td>
      <td className="py-3 px-4">
        <button onClick={() => onAssign(b)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:border-[#4900e5] hover:text-[#4900e5] transition">
          <span className="material-icons-outlined text-sm">edit_location_alt</span>
          {b.pincode ? 'Edit Area' : 'Assign Area'}
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Brokers',   value: subBrokers.length,    icon: 'people',        color: 'text-slate-700' },
          { label: 'Pincode Brokers', value: pincodeBrokers.length, icon: 'location_on',   color: 'text-[#4900e5]' },
          { label: 'Normal Brokers',  value: normalBrokers.length,  icon: 'person_outline', color: 'text-slate-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
            <span className={`material-icons-outlined text-2xl ${s.color}`}>{s.icon}</span>
            <p className={`font-montserrat font-bold text-2xl mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/60">
          <h3 className="font-semibold text-slate-700 text-sm">All Sub-Brokers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Broker', 'Phone', 'Assigned Area', 'Status', 'Joined', 'Action'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subBrokers.map(b => <BrokerRow key={b._id} b={b} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Property Send tab (unit + mortgage) ─────────────────────────────────── */
function PropertySendTab({ type, subBrokers }) {
  const isUnit = type === 'unit';

  // Properties list
  const [props, setProps]       = useState([]);
  const [propsLoading, setPropsLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds]   = useState(new Set());

  // Compose panel
  const [channel, setChannel]   = useState('whatsapp');
  const [filterPincodes, setFilterPincodes] = useState([]);
  const [message, setMessage]   = useState('');
  const [subject, setSubject]   = useState('Property Update from Your Master Broker');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending]   = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendErr, setSendErr]   = useState('');

  // WA result contacts
  const [waLinks, setWaLinks]   = useState([]);

  const fetchProps = useCallback(async (q = '') => {
    setPropsLoading(true);
    try {
      const params = new URLSearchParams({ limit: 40 });
      if (q) params.set('search', q);
      if (!isUnit) params.set('masterView', 'true');
      const endpoint = isUnit ? `/unit-properties?${params}` : `/mortgage-properties?${params}`;
      const { data } = await api.get(endpoint);
      setProps(data.properties || []);
    } catch { /* empty */ }
    setPropsLoading(false);
  }, [isUnit]);

  useEffect(() => { fetchProps(); }, [fetchProps]);

  const selectedProps = props.filter(p => selectedIds.has(p._id));

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function generateMessage() {
    const msg  = isUnit ? buildUnitWaMsg(selectedProps) : buildMortgageWaMsg(selectedProps);
    const html = isUnit ? buildUnitEmailBody(selectedProps) : buildMortgageEmailBody(selectedProps);
    setMessage(msg);
    setEmailBody(html);
    setSubject(isUnit ? 'Exclusive Property Listings — A1 Deal' : 'Bank Auction Opportunities — Act Now');
    setSendResult(null); setSendErr(''); setWaLinks([]);
  }

  async function handleSend() {
    if (!message.trim() && channel === 'whatsapp') return;
    if ((!subject.trim() || !emailBody.trim()) && channel === 'email') return;
    setSending(true); setSendResult(null); setSendErr(''); setWaLinks([]);
    try {
      const pincode = filterPincodes[0] || undefined;
      if (channel === 'whatsapp') {
        const { data } = await api.post('/master-broker/bulk-whatsapp', { message, pincode });
        if (data.method === 'wame') {
          setWaLinks(data.contacts || []);
          setSendResult({ method: 'wame', total: data.total });
        } else {
          setSendResult(data);
        }
      } else {
        const { data } = await api.post('/master-broker/bulk-email', {
          subject, body: emailBody, pincode,
        });
        setSendResult(data);
      }
    } catch (err) { setSendErr(err.response?.data?.message || 'Send failed.'); }
    setSending(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    fetchProps(searchInput);
  }

  // Unique pincodes from sub-brokers
  const brokerPincodes = [...new Set(subBrokers.map(b => b.pincode).filter(Boolean))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Left: property selection */}
      <div className="lg:col-span-3 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-icons-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder={`Search ${isUnit ? 'unit' : 'mortgage'} properties…`}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 bg-white" />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); fetchProps(); }}
              className="px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
              <span className="material-icons-outlined text-sm">close</span>
            </button>
          )}
        </form>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#4900e5]/5 rounded-xl border border-[#4900e5]/20">
            <span className="text-sm text-[#4900e5] font-semibold">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-rose-500">Clear</button>
            <button onClick={generateMessage}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#4900e5] text-white text-xs font-semibold hover:bg-[#6236ff] transition">
              <span className="material-icons-outlined text-sm">auto_awesome</span>
              Generate Message
            </button>
          </div>
        )}

        {propsLoading ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-icons-outlined text-3xl animate-spin text-[#4900e5]">progress_activity</span>
          </div>
        ) : props.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <span className="material-icons-outlined text-4xl text-slate-200">{isUnit ? 'domain' : 'account_balance'}</span>
            <p className="text-slate-400 mt-2 text-sm">No properties found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {props.map(p => (
              <PropCard key={p._id} prop={p} isUnit={isUnit} selected={selectedIds.has(p._id)} onToggle={() => toggleSelect(p._id)} />
            ))}
          </div>
        )}
      </div>

      {/* Right: compose & send */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 sticky top-4">
          <h3 className="font-semibold text-slate-800">Compose & Send</h3>

          {/* Channel */}
          <div className="flex gap-2">
            {[{ k: 'whatsapp', icon: 'chat', label: 'WhatsApp' }, { k: 'email', icon: 'email', label: 'Email' }].map(c => (
              <button key={c.k} onClick={() => setChannel(c.k)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border transition
                  ${channel === c.k ? 'bg-[#4900e5] text-white border-[#4900e5]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#4900e5]/40'}`}>
                <span className="material-icons-outlined text-base">{c.icon}</span>{c.label}
              </button>
            ))}
          </div>

          {/* Recipient filter */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
              Filter by Pincode (leave empty for all)
            </label>
            {brokerPincodes.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {brokerPincodes.map(pc => (
                  <button key={pc} type="button"
                    onClick={() => setFilterPincodes(prev => prev.includes(pc) ? prev.filter(x => x !== pc) : [pc])}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition
                      ${filterPincodes.includes(pc) ? 'bg-[#4900e5] text-white border-[#4900e5]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#4900e5]/40'}`}>
                    {pc}
                  </button>
                ))}
              </div>
            ) : null}
            <PincodeInput values={filterPincodes} onChange={setFilterPincodes} />
            <p className="text-xs text-slate-400 mt-1">
              {filterPincodes.length > 0
                ? `Sending to brokers in pincode: ${filterPincodes[0]}`
                : `Sending to all ${subBrokers.length} sub-broker(s)`}
            </p>
          </div>

          {channel === 'whatsapp' ? (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">WhatsApp Message</label>
              <textarea rows={10} value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Select properties above and click Generate Message…"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 resize-y font-mono" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Subject</label>
                <input className={INP} value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Email Body (HTML)</label>
                <textarea rows={8} value={emailBody} onChange={e => setEmailBody(e.target.value)}
                  placeholder="Select properties above and click Generate Message…"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4900e5]/30 resize-y font-mono text-xs" />
              </div>
            </div>
          )}

          {sendErr && <p className="text-sm text-rose-500">{sendErr}</p>}

          {sendResult && (
            <div className={`p-3 rounded-xl text-sm ${sendResult.method === 'wame' ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
              {sendResult.method === 'wame'
                ? `${sendResult.total} wa.me link(s) ready below ↓`
                : sendResult.recipientCount !== undefined
                  ? `Email queued for ${sendResult.recipientCount} broker(s).`
                  : `Sent: ${sendResult.sent} | Failed: ${sendResult.failed}`}
            </div>
          )}

          <button onClick={handleSend} disabled={sending || (!message.trim() && channel === 'whatsapp')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4900e5] text-white text-sm font-semibold hover:bg-[#6236ff] transition disabled:opacity-40">
            {sending ? (
              <><span className="material-icons-outlined text-base animate-spin">progress_activity</span> Sending…</>
            ) : (
              <><span className="material-icons-outlined text-base">{channel === 'whatsapp' ? 'send' : 'mail'}</span>
                Send {channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </>
            )}
          </button>
        </div>

        {/* wa.me links */}
        {waLinks.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">WhatsApp Links ({waLinks.length})</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {waLinks.map((c, i) => (
                <a key={i} href={c.waLink} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition text-sm">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-emerald-600 flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="font-medium text-emerald-800">{c.name}</span>
                  <span className="text-emerald-600 text-xs ml-1">{c.phone}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Property card ───────────────────────────────────────────────────────── */
function PropCard({ prop: p, isUnit, selected, onToggle }) {
  return (
    <div onClick={onToggle}
      className={`bg-white rounded-xl border cursor-pointer transition-all hover:shadow-md select-none overflow-hidden
        ${selected ? 'border-[#4900e5] ring-2 ring-[#4900e5]/20' : 'border-slate-100'}`}>

      {/* Image */}
      {p.images?.[0] ? (
        <div className="relative h-28 bg-slate-100">
          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
          {selected && (
            <div className="absolute inset-0 bg-[#4900e5]/20 flex items-center justify-center">
              <span className="material-icons-outlined text-white text-3xl">check_circle</span>
            </div>
          )}
        </div>
      ) : (
        <div className={`h-12 flex items-center justify-center ${selected ? 'bg-[#4900e5]/10' : 'bg-slate-50'}`}>
          <span className={`material-icons-outlined text-2xl ${selected ? 'text-[#4900e5]' : 'text-slate-200'}`}>
            {isUnit ? 'domain' : 'account_balance'}
          </span>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-1">{p.title}</p>
          {selected && <span className="material-icons-outlined text-[#4900e5] text-lg flex-shrink-0">check_circle</span>}
        </div>
        <p className="text-xs text-slate-400 flex items-center gap-0.5 mb-2">
          <span className="material-icons-outlined text-xs">location_on</span>
          {[p.area, p.city].filter(Boolean).join(', ')}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">{fmtPrice(p.price)}</span>
          {isUnit
            ? <span className="text-xs text-slate-400 capitalize">{(p.propertyType||'').replace(/_/g,' ')}</span>
            : <span className="text-xs text-slate-400">{p.bankName || '—'}</span>
          }
        </div>
        {!isUnit && p.auctionDate && (
          <p className="text-xs text-rose-500 font-semibold mt-1">Auction: {fmtDate(p.auctionDate)}</p>
        )}
      </div>
    </div>
  );
}
