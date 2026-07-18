import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

// Print-isolation + A4 sizing. `body * { visibility: hidden }` + re-showing only
// the sheet is the robust way to print one element regardless of the app chrome
// (BrokerLayout nav, etc.) wrapping it.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  .lh-sheet, .lh-sheet * { visibility: visible !important; }
  .lh-sheet { position: absolute; left: 0; top: 0; margin: 0 !important; box-shadow: none !important; }
  .no-print { display: none !important; }
}
@page { size: A4; margin: 0; }
.lh-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

export default function LetterheadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/broker-card/mine')
      .then((r) => setCard(r.data.card))
      .catch(() => setError('Could not load your letterhead.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-400">Loading…</div>;
  if (!card) return <div className="p-10 text-center text-slate-400">{error || 'No card.'}</div>;

  const brokerName = user?.name || '';
  const businessName = card.businessName || brokerName || 'Your Business';
  const logo = card.logo || card.photo || '';
  const website = card.social?.website || '';
  const contactBits = [
    card.phone && `☎ ${card.phone}`,
    card.whatsapp && card.whatsapp !== card.phone && `WhatsApp ${card.whatsapp}`,
    card.email && `✉ ${card.email}`,
    website && website.replace(/^https?:\/\//, ''),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-100 py-6">
      <style>{PRINT_CSS}</style>

      {/* Controls (hidden in print) */}
      <div className="no-print max-w-[210mm] mx-auto px-4 flex items-center justify-between mb-4">
        <button onClick={() => navigate('/broker/card')} className="flex items-center gap-1 text-sm text-slate-600 hover:text-primary">
          <span className="material-icons-outlined text-base">arrow_back</span> Back to card
        </button>
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400 hidden sm:block">Tip: choose “Save as PDF” in the print dialog.</p>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container">
            <span className="material-icons-outlined text-base">print</span>Print / Save as PDF
          </button>
        </div>
      </div>

      {/* A4 letterhead sheet */}
      <div className="lh-sheet bg-white mx-auto shadow-lg flex flex-col"
        style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="px-12 pt-12 pb-6 flex items-start justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            {logo
              ? <img src={logo} alt={businessName} className="max-h-16 max-w-[220px] object-contain" />
              : <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">{businessName[0]}</div>}
            <div className="min-w-0">
              <h1 className="font-montserrat font-extrabold text-2xl text-slate-800 leading-tight truncate">{businessName}</h1>
              {brokerName && businessName !== brokerName && <p className="text-sm text-slate-500">{brokerName}</p>}
              {card.tagline && <p className="text-xs text-slate-400 italic mt-0.5">{card.tagline}</p>}
            </div>
          </div>
          {card.reraNumber && (
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">RERA Reg.</p>
              <p className="text-xs font-semibold text-slate-700">{card.reraNumber}</p>
            </div>
          )}
        </div>

        {/* Brand rule */}
        <div className="mx-12 h-1 rounded-full bg-primary" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />

        {/* Blank body (the writable area) */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="mt-auto">
          <div className="mx-12 h-px bg-slate-200" />
          <div className="px-12 py-5 text-center space-y-1">
            {contactBits.length > 0 && (
              <p className="text-xs text-slate-600">{contactBits.join('   •   ')}</p>
            )}
            {(() => {
              // Append the city only if the address doesn't already mention it.
              const addr = card.officeAddress || '';
              const city = user?.city || '';
              const line = city && !new RegExp(`\\b${city}\\b`, 'i').test(addr)
                ? [addr, city].filter(Boolean).join(', ')
                : addr;
              return line ? <p className="text-[11px] text-slate-400">{line}</p> : null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
