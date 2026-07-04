import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket, negoRoom } from '../../context/SocketContext';
import api from '../../api/axios';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

function Avatar({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const colors = ['bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-fuchsia-500'];
  const color  = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ── Offer card shown in chat for BOTH broker and master broker ────────────────
function PendingListingCard({ room, onDecided }) {
  const { user } = useAuth();
  const uid = String(user?.id || user?._id || '');

  const [listing, setListing] = useState(undefined); // undefined = loading, null = none
  const [mode, setMode]       = useState('idle');     // 'idle'|'accept'|'challenge'|'broker-challenge'|'re-offer'
  const [rate, setRate]       = useState('');
  const [rateType, setRateType] = useState('percent');
  const [reOfferNote, setReOfferNote] = useState('');
  const [working, setWorking] = useState(false);
  const [err, setErr]         = useState('');

  const fetchListing = useCallback(() => {
    api.get(`/chat/${room}/pending-listing`)
      .then(r => setListing(r.data?.listing || null))
      .catch(() => setListing(null));
  }, [room]);

  // Initial load
  useEffect(() => {
    setMode('idle'); setErr(''); setRate(''); setReOfferNote('');
    setListing(undefined);
    fetchListing();
  }, [room, fetchListing]);

  // Re-fetch whenever a chat message arrives — any action (challenge/accept/reject)
  // sends a message, so this keeps both sides in sync without a manual refresh
  const { socket } = useSocket();
  useEffect(() => {
    const s = socket?.current;
    if (!s) return;
    const handler = (msg) => { if (msg.room === room) fetchListing(); };
    s.on('new_message', handler);
    return () => s.off('new_message', handler);
  }, [room, socket, fetchListing]);

  if (listing === undefined || listing === null) return null;

  const status   = listing.approvalStatus;
  const brokerId = String(listing.broker?._id || listing.broker || '');
  const mbId     = String(listing.commissionRequest?.masterBroker?._id || listing.commissionRequest?.masterBroker || '');

  // Determine role from listing data — not from stale user object fields
  const isOwn = uid && brokerId === uid;   // current user is the listing's broker
  const isMb  = uid && mbId === uid;       // current user is the master broker for this listing

  // Hide if unrelated
  if (!isOwn && !isMb) return null;

  // ── master broker actions ──────────────────────────────────────────────────
  async function masterAccept() {
    if (!rate) { setErr('Enter commission rate first.'); return; }
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/commission-requests/${listing._id}/approve`, { rate: Number(rate), rateType });
      await api.post('/chat/message', { room, text: `✅ Approved at ${rate}${rateType === 'percent' ? '%' : '₹ flat'} commission. Listing is now live.` }).catch(() => {});
      setListing(l => ({ ...l, approvalStatus: 'approved', commissionRequest: { ...l.commissionRequest, rate: Number(rate), rateType, counterRate: null, counterRateType: '', counterBy: '' } }));
      setMode('idle'); onDecided?.();
    } catch (e) { setErr(e.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  // Accept broker's counter-proposal directly (no rate input needed)
  async function masterAcceptCounter() {
    const cr = listing.commissionRequest;
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/commission-requests/${listing._id}/approve`, { rate: cr.counterRate, rateType: cr.counterRateType });
      await api.post('/chat/message', { room, text: `✅ Accepted your proposal of ${cr.counterRate}${cr.counterRateType === 'percent' ? '%' : '₹ flat'} commission. Listing is now live.` }).catch(() => {});
      setListing(l => ({ ...l, approvalStatus: 'approved', commissionRequest: { ...l.commissionRequest, rate: cr.counterRate, rateType: cr.counterRateType, counterRate: null, counterRateType: '', counterBy: '' } }));
      setMode('idle'); onDecided?.();
    } catch (e) { setErr(e.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  async function masterReject() {
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/commission-requests/${listing._id}/reject`, {});
      await api.post('/chat/message', { room, text: `❌ Rejected this listing. You may edit and re-offer.` }).catch(() => {});
      setListing(l => ({ ...l, approvalStatus: 'rejected' }));
      setMode('idle'); onDecided?.();
    } catch (e) { setErr(e.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  async function masterChallenge() {
    if (!rate) { setErr('Enter your proposed rate to challenge.'); return; }
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/listings/${listing._id}/counter-propose`, { rate: Number(rate), rateType });
      await api.post('/chat/message', { room, text: `⚡ I propose ${rate}${rateType === 'percent' ? '%' : '₹ flat'} commission. Please accept or counter-propose.` });
      setListing(l => ({ ...l, commissionRequest: { ...l.commissionRequest, counterRate: Number(rate), counterRateType: rateType, counterBy: 'master' } }));
      setMode('idle'); setRate('');
    } catch { setErr('Failed to send.'); }
    setWorking(false);
  }

  // ── broker (non-master) actions ────────────────────────────────────────────
  async function brokerAcceptTerms() {
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/listings/${listing._id}/accept-offer`);
      await api.post('/chat/message', { room, text: `✅ I accept the commission terms for "${listing.title}". Please finalise.` }).catch(() => {});
      setListing(l => ({ ...l, commissionRequest: { ...l.commissionRequest, brokerAccepted: true } }));
    } catch (e) { setErr('Failed.'); }
    setWorking(false);
  }

  // Accept master broker's counter-proposal directly (from pending state)
  async function brokerAcceptMasterProposal() {
    const cr = listing.commissionRequest;
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/listings/${listing._id}/accept-offer`);
      await api.post('/chat/message', { room, text: `✅ I accept the proposed ${cr.counterRate}${cr.counterRateType === 'percent' ? '%' : '₹ flat'} commission. Please finalise.` }).catch(() => {});
      setListing(l => ({ ...l, commissionRequest: { ...l.commissionRequest, brokerAccepted: true, counterRate: null, counterRateType: '', counterBy: '' } }));
    } catch (e) { setErr('Failed.'); }
    setWorking(false);
  }

  async function brokerReOffer() {
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/listings/${listing._id}/re-offer`, { note: reOfferNote });
      await api.post('/chat/message', { room, text: `🔄 Re-submitted listing for review${reOfferNote ? `: "${reOfferNote}"` : '.'}` }).catch(() => {});
      setListing(l => ({ ...l, approvalStatus: 'pending', commissionRequest: { ...l.commissionRequest, brokerAccepted: false, masterNote: '', rate: null, rateType: '', counterRate: null, counterRateType: '', counterBy: '' } }));
      setMode('idle'); setReOfferNote('');
    } catch (e) { setErr(e.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  async function brokerReject() {
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/listings/${listing._id}/withdraw`);
      await api.post('/chat/message', { room, text: `❌ I've rejected/withdrawn this listing.` }).catch(() => {});
      setListing(l => ({ ...l, approvalStatus: 'withdrawn' }));
      setMode('idle');
    } catch (e) { setErr('Failed.'); }
    setWorking(false);
  }

  // Challenge from approved state — resets listing to pending + saves counter rate
  async function brokerChallenge() {
    if (!rate) { setErr('Enter your proposed rate to challenge.'); return; }
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/listings/${listing._id}/re-offer`, { counterRate: Number(rate), counterRateType: rateType });
      await api.post('/chat/message', {
        room,
        text: `⚡ I challenge the commission of ${listing.commissionRequest?.rate ?? '?'}${listing.commissionRequest?.rateType === 'percent' ? '%' : '₹'}. I propose ${rate}${rateType === 'percent' ? '%' : '₹ flat'} instead. Please review.`,
      });
      setListing(l => ({ ...l, approvalStatus: 'pending', commissionRequest: { ...l.commissionRequest, rate: null, rateType: '', brokerAccepted: false, masterNote: '', counterRate: Number(rate), counterRateType: rateType, counterBy: 'broker' } }));
      setMode('idle'); setRate('');
    } catch (e) { setErr(e.response?.data?.message || 'Failed.'); }
    setWorking(false);
  }

  // Challenge from pending state — saves counter rate + sends message (no status change)
  async function brokerChallengePending() {
    if (!rate) { setErr('Enter your proposed rate to challenge.'); return; }
    setWorking(true); setErr('');
    try {
      await api.patch(`/broker/listings/${listing._id}/counter-propose`, { rate: Number(rate), rateType });
      await api.post('/chat/message', {
        room,
        text: `⚡ I propose ${rate}${rateType === 'percent' ? '%' : '₹ flat'} commission. Please review and respond.`,
      });
      setListing(l => ({ ...l, commissionRequest: { ...l.commissionRequest, counterRate: Number(rate), counterRateType: rateType, counterBy: 'broker' } }));
      setMode('idle'); setRate('');
    } catch { setErr('Failed to send.'); }
    setWorking(false);
  }

  // ── status config ──────────────────────────────────────────────────────────
  const statusCfg = {
    pending:   { border: 'border-amber-200',   bg: 'bg-amber-50/50',   badge: 'bg-amber-100 text-amber-700',   label: 'Awaiting Approval' },
    approved:  { border: 'border-emerald-200', bg: 'bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    rejected:  { border: 'border-rose-200',    bg: 'bg-rose-50/50',    badge: 'bg-rose-100 text-rose-600',     label: 'Rejected' },
    withdrawn: { border: 'border-slate-200',   bg: 'bg-slate-50/50',   badge: 'bg-slate-100 text-slate-500',   label: 'Withdrawn' },
  };
  const sc = statusCfg[status] || statusCfg.pending;
  const INP = 'px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-violet-400 bg-white';

  return (
    <div className={`mx-3 mt-3 rounded-2xl border p-3 space-y-2.5 ${sc.border} ${sc.bg}`}>
      {/* Property summary */}
      <div className="flex items-start gap-2">
        <span className="material-icons-outlined text-amber-500 text-base mt-0.5 flex-shrink-0">home_work</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-700 truncate">{listing.title}</p>
          <p className="text-[11px] text-slate-500">
            {[listing.address, listing.city, listing.pincode].filter(Boolean).join(' · ')} · ₹{Number(listing.price).toLocaleString('en-IN')}
          </p>
          {isMb && <p className="text-[11px] text-slate-400">by {listing.broker?.name}</p>}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sc.badge}`}>{sc.label}</span>
      </div>

      {/* Approved: show commission rate */}
      {status === 'approved' && listing.commissionRequest?.rate != null && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <span className="material-icons-outlined text-sm">percent</span>
          Commission: {listing.commissionRequest.rate}
          {listing.commissionRequest.rateType === 'percent' ? '%' : '₹ flat'}
        </div>
      )}

      {/* Counter-proposal badge — visible to both sides whenever a challenge is pending */}
      {listing.commissionRequest?.counterRate != null && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-800 text-xs font-semibold">
          <span className="material-icons-outlined text-sm">price_change</span>
          {listing.commissionRequest.counterBy === 'master' ? 'Master broker' : 'Broker'} proposes:&nbsp;
          <span className="text-violet-900 font-bold">
            {listing.commissionRequest.counterRate}
            {listing.commissionRequest.counterRateType === 'percent' ? '%' : '₹ flat'}
          </span>
        </div>
      )}

      {/* Master note */}
      {listing.commissionRequest?.masterNote && (
        <p className="text-[11px] text-slate-500 italic">"{listing.commissionRequest.masterNote}"</p>
      )}

      {err && <p className="text-[11px] text-rose-500">{err}</p>}

      {/* ══ MASTER BROKER ACTIONS ══ */}
      {isMb && status === 'pending' && (
        <>
          {mode === 'idle' && (
            <div className="grid grid-cols-3 gap-1.5">
              {listing.commissionRequest?.counterRate != null ? (
                <button onClick={masterAcceptCounter} disabled={working}
                  className="py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                  {working ? '…' : `Accept ${listing.commissionRequest.counterRate}${listing.commissionRequest.counterRateType === 'percent' ? '%' : '₹'}`}
                </button>
              ) : (
                <button onClick={() => { setMode('accept'); setErr(''); }}
                  className="py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition">
                  Accept
                </button>
              )}
              <button onClick={() => { setMode('challenge'); setErr(''); }}
                className="py-1.5 rounded-xl border border-violet-300 text-violet-700 text-xs font-bold hover:bg-violet-50 transition">
                Challenge
              </button>
              <button onClick={masterReject} disabled={working}
                className="py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition disabled:opacity-50">
                {working ? '…' : 'Reject'}
              </button>
            </div>
          )}

          {mode === 'accept' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 font-semibold">Set commission rate to approve:</p>
              <div className="flex gap-2">
                <input type="number" min="0" placeholder="Rate" value={rate}
                  onChange={e => setRate(e.target.value)} className={`flex-1 ${INP}`} />
                <select value={rateType} onChange={e => setRateType(e.target.value)} className={INP}>
                  <option value="percent">%</option>
                  <option value="flat">₹ flat</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={masterAccept} disabled={working}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                  {working ? '…' : 'Confirm Accept'}
                </button>
                <button onClick={() => { setMode('idle'); setRate(''); }}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'challenge' && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 font-semibold">Propose your counter-rate via chat:</p>
              <div className="flex gap-2">
                <input type="number" min="0" placeholder="Your rate" value={rate}
                  onChange={e => setRate(e.target.value)} className={`flex-1 ${INP}`} />
                <select value={rateType} onChange={e => setRateType(e.target.value)} className={INP}>
                  <option value="percent">%</option>
                  <option value="flat">₹ flat</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={masterChallenge} disabled={working}
                  className="flex-1 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition disabled:opacity-50">
                  {working ? '…' : 'Send Challenge'}
                </button>
                <button onClick={() => { setMode('idle'); setRate(''); }}
                  className="py-1.5 px-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ BROKER (non-master) ACTIONS ══ */}
      {isOwn && (
        <>
          {/* Approved — Challenge / Accept / Reject */}
          {status === 'approved' && !listing.commissionRequest?.brokerAccepted && (
            <>
              {mode === 'idle' && (
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={() => { setMode('broker-challenge'); setErr(''); }}
                    className="py-1.5 rounded-xl border border-violet-300 text-violet-700 text-xs font-bold hover:bg-violet-50 transition">
                    Challenge
                  </button>
                  <button onClick={brokerAcceptTerms} disabled={working}
                    className="py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                    {working ? '…' : 'Accept'}
                  </button>
                  <button onClick={brokerReject} disabled={working}
                    className="py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition disabled:opacity-50">
                    {working ? '…' : 'Reject'}
                  </button>
                </div>
              )}

              {mode === 'broker-challenge' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Counter-propose your rate — this reopens the offer for the master broker:
                  </p>
                  <div className="flex gap-2">
                    <input type="number" min="0" placeholder="Your rate" value={rate}
                      onChange={e => setRate(e.target.value)} className={`flex-1 ${INP}`} />
                    <select value={rateType} onChange={e => setRateType(e.target.value)} className={INP}>
                      <option value="percent">%</option>
                      <option value="flat">₹ flat</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={brokerChallenge} disabled={working}
                      className="flex-1 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition disabled:opacity-50">
                      {working ? '…' : 'Send Challenge'}
                    </button>
                    <button onClick={() => { setMode('idle'); setRate(''); }}
                      className="py-1.5 px-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {status === 'approved' && listing.commissionRequest?.brokerAccepted && (
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
              <span className="material-icons-outlined text-sm">check_circle</span>You accepted the terms
            </div>
          )}

          {/* Pending — broker can counter-propose or withdraw */}
          {status === 'pending' && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin flex-shrink-0" />
                <p className="text-[11px] text-amber-700 font-semibold flex-1">Awaiting master broker's decision</p>
              </div>
              {listing.commissionRequest?.brokerAccepted ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                  <span className="material-icons-outlined text-sm">check_circle</span>
                  You accepted — waiting for master broker to formally approve
                </div>
              ) : mode === 'idle' && (
                <div className="flex gap-1.5">
                  {listing.commissionRequest?.counterRate != null && listing.commissionRequest?.counterBy === 'master' && (
                    <button onClick={brokerAcceptMasterProposal} disabled={working}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                      {working ? '…' : `Accept ${listing.commissionRequest.counterRate}${listing.commissionRequest.counterRateType === 'percent' ? '%' : '₹'}`}
                    </button>
                  )}
                  <button onClick={() => { setMode('broker-challenge'); setErr(''); }}
                    className="flex-1 py-1.5 rounded-xl border border-violet-300 text-violet-700 text-xs font-bold hover:bg-violet-50 transition">
                    Challenge
                  </button>
                  <button onClick={brokerReject} disabled={working}
                    className="flex-1 py-1.5 rounded-xl border border-rose-200 text-rose-500 text-xs font-bold hover:bg-rose-50 transition disabled:opacity-50">
                    {working ? '…' : 'Withdraw'}
                  </button>
                </div>
              )}
              {mode === 'broker-challenge' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 font-semibold">Propose your commission rate:</p>
                  <div className="flex gap-2">
                    <input type="number" min="0" placeholder="Your rate" value={rate}
                      onChange={e => setRate(e.target.value)} className={`flex-1 ${INP}`} />
                    <select value={rateType} onChange={e => setRateType(e.target.value)} className={INP}>
                      <option value="percent">%</option>
                      <option value="flat">₹ flat</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={brokerChallengePending} disabled={working}
                      className="flex-1 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition disabled:opacity-50">
                      {working ? '…' : 'Send Challenge'}
                    </button>
                    <button onClick={() => { setMode('idle'); setRate(''); }}
                      className="py-1.5 px-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Rejected / withdrawn → re-offer */}
          {(status === 'rejected' || status === 'withdrawn') && (
            <>
              {mode !== 're-offer' && (
                <button onClick={() => { setMode('re-offer'); setErr(''); }}
                  className="w-full py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition">
                  Edit Commission &amp; Re-offer
                </button>
              )}
              {mode === 're-offer' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 font-semibold">Add a note about your offer (optional):</p>
                  <input
                    placeholder="e.g. I can offer 1.5% as this is a referral client"
                    value={reOfferNote} onChange={e => setReOfferNote(e.target.value)}
                    className={`w-full ${INP}`}
                  />
                  <div className="flex gap-2">
                    <button onClick={brokerReOffer} disabled={working}
                      className="flex-1 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition disabled:opacity-50">
                      {working ? '…' : 'Re-submit for Approval'}
                    </button>
                    <button onClick={() => setMode('idle')}
                      className="py-1.5 px-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Single chat room ──────────────────────────────────────────────────────────
function ChatRoom({ room, otherName, onBack }) {
  const { user }    = useAuth();
  const { socket }  = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/chat/${room}/history`)
      .then(r => setMessages(r.data?.messages || []))
      .catch(() => {})
      .finally(() => { setLoading(false); });
  }, [room]);

  useEffect(() => {
    const s = socket.current;
    if (!s) return;
    s.emit('join_room', room);
    const saved = JSON.parse(sessionStorage.getItem('chat_rooms') || '[]');
    if (!saved.includes(room)) sessionStorage.setItem('chat_rooms', JSON.stringify([...saved, room]));
    const handler = (msg) => { if (msg.room === room) setMessages(prev => [...prev, msg]); };
    s.on('new_message', handler);
    return () => s.off('new_message', handler);
  }, [room, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, [room]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    try {
      await api.post('/chat/message', { room, text: msg });
    } catch {
      setText(msg); // restore on failure
    }
  }

  function handleDecided() {
    // Refresh messages so both parties see the updated state immediately
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white flex-shrink-0">
        <button onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <span className="material-icons-outlined text-[20px]">arrow_back</span>
        </button>
        <Avatar name={otherName} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 truncate">{otherName || 'Chat'}</p>
          <p className="text-[11px] text-slate-400">Commission negotiation</p>
        </div>
      </div>

      {/* Pending listing card — master broker can approve/reject directly from chat */}
      <PendingListingCard room={room} onDecided={handleDecided} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
              <span className="material-icons-outlined text-violet-500 text-2xl">chat_bubble_outline</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">Start negotiating</p>
            <p className="text-xs text-slate-400 mt-1">Discuss commission terms with {otherName}</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender?.toString() === user?.id?.toString();
            const showDate = i === 0 || new Date(messages[i-1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            return (
              <div key={m._id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(m.createdAt).toLocaleDateString()}</p>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                )}
                <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                  {!mine && <Avatar name={m.senderName} size="sm" />}
                  <div className={`max-w-[72%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!mine && <p className="text-[10px] font-semibold text-violet-600 ml-1">{m.senderName}</p>}
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                      mine
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-white border border-slate-100 text-slate-800 shadow-sm rounded-bl-sm'
                    }`}>
                      {m.text}
                    </div>
                    <p className={`text-[10px] px-1 ${mine ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                      {timeAgo(m.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 bg-white flex-shrink-0">
        <input
          ref={inputRef}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-violet-400 focus:bg-white transition-colors placeholder:text-slate-400"
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" disabled={!text.trim()}
          className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-30 hover:bg-violet-700 transition-colors flex-shrink-0 shadow-sm" aria-label="Send">
          <span className="material-icons-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  );
}

// ── Room list ─────────────────────────────────────────────────────────────────
function RoomList({ onSelect }) {
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket }            = useSocket();

  function fetchRooms() {
    api.get('/chat/rooms')
      .then(r => setRooms(r.data?.rooms || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchRooms(); }, []);

  // Refresh room list whenever another user starts a new chat with us
  useEffect(() => {
    const s = socket?.current;
    if (!s) return;
    const handler = () => fetchRooms();
    s.on('new_chat_room', handler);
    return () => s.off('new_chat_room', handler);
  }, [socket]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-40 gap-2">
      <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-slate-400">Loading chats…</p>
    </div>
  );

  if (rooms.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
        <span className="material-icons-outlined text-violet-400 text-3xl">forum</span>
      </div>
      <p className="font-semibold text-slate-700 text-sm">No negotiations yet</p>
      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
        When you try to post a listing in a master broker's pincode, a chat option will appear to negotiate commission terms.
      </p>
    </div>
  );

  return (
    <div className="overflow-y-auto flex-1">
      {rooms.map(r => (
        <button key={r._id} onClick={() => onSelect(r._id, r.otherName)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0">
          <Avatar name={r.otherName} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{r.otherName}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{r.lastMsg}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-[10px] text-slate-300">{timeAgo(r.lastAt)}</p>
            <span className="material-icons-outlined text-slate-200 text-sm mt-1">chevron_right</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function ChatPanel({ open, onClose, initialRoom, initialOtherName }) {
  const [activeRoom, setActiveRoom] = useState(initialRoom || null);
  const [otherName,  setOtherName]  = useState(initialOtherName || '');
  const { socket }                  = useSocket();

  useEffect(() => {
    const s = socket?.current;
    if (!s) return;
    const saved = sessionStorage.getItem('chat_rooms');
    if (saved) JSON.parse(saved).forEach(r => s.emit('join_room', r));
  }, [socket]);

  useEffect(() => {
    if (initialRoom) { setActiveRoom(initialRoom); setOtherName(initialOtherName || ''); }
  }, [initialRoom, initialOtherName]);

  // Close panel → reset to room list
  function handleClose() {
    onClose();
    setTimeout(() => setActiveRoom(null), 300);
  }

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] flex flex-col bg-white shadow-2xl border-l border-slate-100
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <span className="material-icons-outlined text-violet-600 text-[18px]">forum</span>
          </div>
          <div>
            <h2 className="font-montserrat font-bold text-slate-800 text-sm">Negotiations</h2>
            <p className="text-[10px] text-slate-400">Pincode commission chats</p>
          </div>
        </div>
        <button onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <span className="material-icons-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeRoom ? (
          <ChatRoom room={activeRoom} otherName={otherName} onBack={() => setActiveRoom(null)} />
        ) : (
          <RoomList onSelect={(room, name) => { setActiveRoom(room); setOtherName(name || ''); }} />
        )}
      </div>
    </div>
  );
}

export { negoRoom };
