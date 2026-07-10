import { useState, useEffect } from 'react';
import BackButton from '../../../components/common/BackButton';

const AUCTIONS = [
  { id: 1, name: 'Bank Recovered Villa', location: 'Andheri East, Mumbai', reserve: '₹1.8 Cr', current: '₹2.1 Cr', bids: 14, ends: new Date(Date.now() + 2*3600*1000), type: 'Villa', urgent: true },
  { id: 2, name: 'Commercial Space G-12', location: 'Connaught Place, Delhi', reserve: '₹4.5 Cr', current: '₹5.0 Cr', bids: 8, ends: new Date(Date.now() + 24*3600*1000), type: 'Commercial', urgent: false },
  { id: 3, name: 'Resort Plot 3A', location: 'Lonavala, Pune', reserve: '₹65 L', current: '₹72 L', bids: 21, ends: new Date(Date.now() + 4*3600*1000), type: 'Plot', urgent: true },
  { id: 4, name: 'Penthouse PH-07', location: 'Worli, Mumbai', reserve: '₹8.2 Cr', current: '₹8.9 Cr', bids: 5, ends: new Date(Date.now() + 48*3600*1000), type: 'Penthouse', urgent: false },
];

function Countdown({ endTime }) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) { setLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return <span className="font-mono font-bold">{left}</span>;
}

export default function AuctionListing() {
  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <BackButton fallback="/buyer" label="Back" className="mb-4" />
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Property Auctions</h1>
        <span className="portal-badge bg-rose-100 text-rose-800 text-xs">{AUCTIONS.length} Live</span>
      </div>
      <p className="text-on-surface-variant mb-8">Bid on bank-recovered and distressed properties at below-market rates</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {AUCTIONS.map(a => (
          <div key={a.id} className={`card overflow-hidden ${a.urgent ? 'ring-2 ring-secondary-container' : ''}`}>
            <div className="h-36 bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center relative">
              <span className="material-icons-outlined text-6xl text-on-surface-variant/20">{a.type === 'Commercial' ? 'business' : a.type === 'Plot' ? 'landscape' : 'apartment'}</span>
              {a.urgent && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-secondary-container text-white text-xs font-bold px-2 py-1 rounded-full">
                  <span className="material-icons-outlined text-sm">bolt</span>Ending Soon
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="text-xs text-on-surface-variant mb-1">{a.type} · {a.location}</p>
              <h3 className="font-montserrat font-bold text-on-surface mb-3">{a.name}</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-surface-container rounded-lg p-2 text-center">
                  <p className="text-xs text-on-surface-variant">Reserve</p>
                  <p className="font-semibold text-sm text-on-surface">{a.reserve}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-2 text-center">
                  <p className="text-xs text-on-surface-variant">Current Bid</p>
                  <p className="font-bold text-sm text-primary-container">{a.current}</p>
                </div>
                <div className="bg-surface-container rounded-lg p-2 text-center">
                  <p className="text-xs text-on-surface-variant">Total Bids</p>
                  <p className="font-semibold text-sm text-on-surface">{a.bids}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant">Time Remaining</p>
                  <p className={`text-sm ${a.urgent ? 'text-secondary-container' : 'text-on-surface'}`}>
                    <Countdown endTime={a.ends} />
                  </p>
                </div>
                <button className="btn-secondary text-sm py-2 px-5">Place Bid</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
