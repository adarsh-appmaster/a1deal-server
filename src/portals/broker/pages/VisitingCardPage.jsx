import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

// Print-isolation + real business-card sizing. Reshowing only the sheet is the
// robust way to print the cards regardless of the app chrome wrapping them.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  .vc-sheet, .vc-sheet * { visibility: visible !important; }
  .vc-sheet { position: absolute; left: 0; top: 0; }
  .no-print { display: none !important; }
}
@page { size: A4; margin: 16mm; }
.vc-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

// Append the city only when the address doesn't already mention it.
function cityLine(addr = '', city = '') {
  if (city && !new RegExp(`\\b${city}\\b`, 'i').test(addr)) return [addr, city].filter(Boolean).join(', ');
  return addr;
}

export default function VisitingCardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shared, setShared] = useState('');

  useEffect(() => {
    api.get('/broker-card/mine')
      .then((r) => setCard(r.data.card))
      .catch(() => setError('Could not load your visiting card.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-400">Loading…</div>;
  if (!card) return <div className="p-10 text-center text-slate-400">{error || 'No card.'}</div>;

  const brokerName = user?.name || '';
  const businessName = card.businessName || brokerName || 'Your Business';
  const logo = card.logo || card.photo || '';
  const website = (card.social?.website || '').replace(/^https?:\/\//, '');
  const publicUrl = `${window.location.origin}/b/${card.slug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}`;

  async function share() {
    setShared('');
    const payload = { title: businessName, text: `${businessName} — visiting card`, url: publicUrl };
    try {
      if (navigator.share) { await navigator.share(payload); return; }
      await navigator.clipboard.writeText(publicUrl);
      setShared('Link copied!');
      setTimeout(() => setShared(''), 2000);
    } catch { /* user cancelled share — ignore */ }
  }

  const contactRows = [
    card.phone && { icon: 'call', text: card.phone },
    card.whatsapp && card.whatsapp !== card.phone && { icon: 'chat', text: card.whatsapp },
    card.email && { icon: 'mail', text: card.email },
    website && { icon: 'language', text: website },
    (card.officeAddress || user?.city) && { icon: 'location_on', text: cityLine(card.officeAddress, user?.city) },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-100 py-6">
      <style>{PRINT_CSS}</style>

      {/* Controls (hidden in print) */}
      <div className="no-print max-w-[480px] mx-auto px-4 flex items-center justify-between mb-4">
        <button onClick={() => navigate('/broker/card')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-primary">
          <span className="material-icons-outlined text-base">arrow_back</span> Back to card
        </button>
        <div className="flex items-center gap-2">
          <button onClick={share} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
            <span className="material-icons-outlined text-base">{shared ? 'check' : 'share'}</span>{shared || 'Share'}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container">
            <span className="material-icons-outlined text-base">print</span>Download PDF
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="vc-sheet flex flex-col items-center gap-6">
        {/* FRONT */}
        <div className="vc-card bg-gradient-to-br from-primary to-primary-container text-white shadow-lg rounded-xl overflow-hidden flex flex-col justify-between p-5"
          style={{ width: '90mm', height: '54mm' }}>
          <div className="flex items-start justify-between gap-3">
            {logo
              ? <img src={logo} alt={businessName} className="max-h-10 max-w-[42mm] object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              : <span className="font-montserrat font-extrabold text-lg">{businessName}</span>}
            {user?.brokerTier === 'master' && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 border border-white/25">MASTER</span>}
          </div>
          <div>
            <h1 className="font-montserrat font-extrabold text-xl leading-tight">{businessName}</h1>
            {brokerName && businessName !== brokerName && <p className="text-white/85 text-sm">{brokerName}</p>}
            {card.tagline && <p className="text-white/75 text-[11px] italic mt-0.5 line-clamp-1">{card.tagline}</p>}
          </div>
          <div className="flex items-center justify-between text-[10px] text-white/80">
            <span className="flex items-center gap-1"><span className="material-icons-outlined text-[12px]">handshake</span>A1 Deal Verified</span>
            {card.reraNumber && <span>RERA: {card.reraNumber}</span>}
          </div>
        </div>

        {/* BACK */}
        <div className="vc-card bg-white shadow-lg rounded-xl overflow-hidden flex items-center gap-4 p-5"
          style={{ width: '90mm', height: '54mm' }}>
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-montserrat font-bold text-slate-800 text-sm truncate">{businessName}</p>
            {contactRows.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 min-w-0">
                <span className="material-icons-outlined text-[13px] text-primary flex-shrink-0">{r.icon}</span>
                <span className="truncate">{r.text}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center flex-shrink-0">
            <img src={qrSrc} alt="Scan for full profile" className="w-[24mm] h-[24mm]" />
            <p className="text-[8px] text-slate-400 mt-1">Scan for profile</p>
          </div>
        </div>
      </div>
    </div>
  );
}
