import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupportChatAuth } from '../../hooks/useSupportChatAuth';
import { useSocket, supportRoom } from '../../context/SocketContext';
import { SUPPORT_TOPICS } from '../../data/supportChatTopics';
import { validateForm } from '../../validation/validate';
import { supportChatContactSchema } from '../../validation/schemas';
import { timeAgo } from '../../utils/timeAgo';
import EmptyState from './EmptyState';
import EnquiryModal from './EnquiryModal';
import api from '../../api/axios';

const ACTIVE_KEY = 'a1deal_support_chat_active';
const INP = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

const PROPERTY_TYPES = ['all', 'Apartment', 'Villa', 'Penthouse', 'Studio', 'Plot', 'Commercial'];

// Same slot/date options as the full SiteVisitFlow page — kept in sync manually
// since this is a compact in-widget booking, not a shared component.
const VISIT_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
];
const VISIT_DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return { label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }), value: d.toISOString().split('T')[0] };
});

const TRACK_STATUS = {
  new:         { label: 'Received',    cls: 'bg-slate-100 text-slate-600' },
  assigned:    { label: 'Assigned',    cls: 'bg-blue-50 text-blue-700' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-50 text-amber-700' },
  closed:      { label: 'Closed',      cls: 'bg-emerald-50 text-emerald-700' },
  rejected:    { label: 'Rejected',    cls: 'bg-rose-50 text-rose-700' },
};

function formatPrice(n) {
  if (!n) return null;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// Floating buyer-facing support chat — a fixed launcher on every buyer page.
// Works for both guests (mints a lightweight identity via useSupportChatAuth
// on first contact) and logged-in buyers (uses their real session).
export default function SupportChatWidget() {
  const { identity, token, isGuest, mintGuest } = useSupportChatAuth();
  const { socket, connected } = useSocket() || {};
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState('topics'); // 'topics' | 'contact' | 'thread' | 'bot_search' | 'bot_track' | 'bot_visit_slot' | 'bot_visit_done'
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '' });
  const [contactErr, setContactErr] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // Bot: browse & enquire / book a visit — share one search step, `searchIntent`
  // decides which action button each result card shows.
  const [searchIntent, setSearchIntent] = useState('enquire'); // 'enquire' | 'visit'
  const [searchForm, setSearchForm] = useState({ city: '', type: 'all', maxBudget: '' });
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [enquireProperty, setEnquireProperty] = useState(null);

  // Bot: book a visit — slot-picking step, once a property is chosen
  const [visitProperty, setVisitProperty] = useState(null);
  const [visitForm, setVisitForm] = useState({ date: '', slot: '' });
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookedVisit, setBookedVisit] = useState(null);

  // Bot: track my enquiry
  const [trackPhone, setTrackPhone] = useState('');
  const [trackResults, setTrackResults] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [showGeneralEnquiry, setShowGeneralEnquiry] = useState(false);

  // Admin-configured customer care number, shown on the "talk to a human" screen
  const [supportPhone, setSupportPhone] = useState('');
  useEffect(() => {
    api.get('/settings').then(({ data }) => setSupportPhone(data.supportPhone || '')).catch(() => {});
  }, []);

  const room = identity ? supportRoom(identity.id) : null;
  const scrollRef = useRef(null);
  const roomRef = useRef(room);
  roomRef.current = room;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Live updates while a thread is open — the same room already has us
  // joined server-side (via join_room / broadcastMessage), just listen.
  // Depends on `connected` too: a guest's socket is often still mid-handshake
  // (freshly opened by connectAsGuest) the instant this effect first runs, so
  // it must re-attach once the connection actually completes.
  useEffect(() => {
    const s = socket?.current;
    if (!s || !room || !connected) return;
    function onMessage(msg) {
      if (msg.room !== roomRef.current) return;
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    }
    s.on('new_message', onMessage);
    s.emit('join_room', room);
    return () => s.off('new_message', onMessage);
  }, [socket, room, connected]);

  async function loadHistory(targetRoom, authToken) {
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/chat/${targetRoom}/history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setMessages(data.messages || []);
    } catch { /* silent */ }
    setLoadingHistory(false);
  }

  async function sendMessage(targetRoom, authToken, msgText) {
    if (!targetRoom || !authToken || !msgText?.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(
        '/chat/message',
        { room: targetRoom, text: msgText.trim() },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, data.message]);
      sessionStorage.setItem(ACTIVE_KEY, '1');
    } catch { /* silent */ }
    setSending(false);
  }

  // Bot: search live listings across both inventory types — reuses the exact
  // same public endpoints the buyer portal's own search pages call.
  async function runSearch(e) {
    e?.preventDefault();
    if (!searchForm.city.trim()) { setSearchError('Enter a city to search.'); return; }
    setSearchError('');
    setSearching(true);
    setSearchResults(null);
    try {
      const params = { city: searchForm.city.trim(), limit: 5 };
      if (searchForm.type !== 'all') params.type = searchForm.type;
      if (searchForm.maxBudget) params.maxPrice = searchForm.maxBudget;
      const [units, mortgages, auctionUnits] = await Promise.all([
        api.get('/unit-properties/public', { params }),
        api.get('/mortgage-properties/public', { params: { city: params.city, limit: 5 } }),
        api.get('/auction-unit-properties/public', { params }),
      ]);
      const tagged = [
        ...units.data.properties.map(p => ({ ...p, _model: 'UnitProperty', _badge: 'Property Partner' })),
        ...mortgages.data.properties.map(p => ({ ...p, _model: 'MortgageProperty', _badge: 'Property Deal' })),
        ...auctionUnits.data.properties.map(p => ({ ...p, _model: 'AuctionUnitProperty', _badge: 'Auction Unit' })),
      ];
      setSearchResults(tagged);
    } catch (ex) {
      setSearchError(ex.response?.data?.message || 'Search failed. Please try again.');
    }
    setSearching(false);
  }

  // Bot: look up status of previously-submitted enquiries by phone. Accepts
  // an optional override so a logged-in buyer's own number can be searched
  // immediately on open, without waiting on the trackPhone state update.
  async function runTrack(e, phoneOverride) {
    e?.preventDefault();
    const phoneToUse = (phoneOverride ?? trackPhone).trim();
    if (!phoneToUse) { setTrackError('Enter the phone number you enquired with.'); return; }
    setTrackError('');
    setTracking(true);
    setTrackResults(null);
    try {
      const { data } = await api.get('/enquiry/track', { params: { phone: phoneToUse } });
      setTrackResults(data.enquiries);
    } catch (ex) {
      setTrackError(ex.response?.data?.message || 'Lookup failed. Please try again.');
    }
    setTracking(false);
  }

  // Logged-in buyers already have a registered number — search it right away
  // instead of making them type it in again. Guests still enter it manually.
  function openTrackMyEnquiry() {
    setTrackResults(null);
    setTrackError('');
    setView('bot_track');
    if (!isGuest && identity?.phone) {
      setTrackPhone(identity.phone);
      runTrack(null, identity.phone);
    } else {
      setTrackPhone('');
    }
  }

  // Bot: move from a chosen search result into the date/slot step. Site visits
  // require a real buyer account (same rule the rest of the app enforces via
  // PrivateRoute on /buyer/visit/:id) — a guest identity can't book one.
  function pickVisitProperty(property) {
    setVisitProperty(property);
    setVisitForm({ date: '', slot: '' });
    setBookError('');
    setBookedVisit(null);
    setView('bot_visit_slot');
  }

  async function runBookVisit() {
    if (!visitForm.date || !visitForm.slot) { setBookError('Pick a date and time slot.'); return; }
    setBookError('');
    setBooking(true);
    try {
      const { data } = await api.post('/site-visits', {
        name: identity.name, phone: identity.phone, email: identity.email || '',
        propertyId: visitProperty._id,
        propertyModel: visitProperty._model,
        propertyTitle: visitProperty.title,
        city: visitProperty.city, area: visitProperty.area,
        date: visitForm.date, slot: visitForm.slot,
      });
      setBookedVisit(data.visit);
      setView('bot_visit_done');
    } catch (ex) {
      setBookError(ex.response?.data?.message || 'Could not schedule the visit. Please try again.');
    }
    setBooking(false);
  }

  // "Talk to a human" now opens a choice screen (call vs. chat) instead of
  // dropping straight into the chat thread.
  function goToHuman() {
    setView('human_options');
  }

  function openWidget() {
    setOpen(true);
    if (identity && sessionStorage.getItem(ACTIVE_KEY) === '1') {
      setView('thread');
      loadHistory(room, token);
    } else {
      setView('topics');
    }
  }

  async function pickTopic(topic) {
    setSelectedTopic(topic);
    if (identity) {
      setView('thread');
      await loadHistory(room, token);
      await sendMessage(room, token, topic.seedText);
    } else {
      setContactForm(f => ({ ...f, name: '', phone: '', email: '' }));
      setContactErr('');
      setView('contact');
    }
  }

  // Selecting a tracked enquiry opens a human chat pre-seeded with its context
  // (title/status), reusing pickTopic's identity branching but pre-filling the
  // phone number the buyer already typed into the track form.
  function selectTrackedEnquiry(e) {
    const status = (TRACK_STATUS[e.status] || TRACK_STATUS.new).label;
    const seedText = `Hi, I'd like an update on my enquiry${e.propertyTitle ? ` for "${e.propertyTitle}"` : ''} — currently showing as "${status}".`;
    setSelectedTopic({ label: e.propertyTitle || e.city || 'your enquiry', seedText });
    if (identity) {
      setView('thread');
      loadHistory(room, token);
      sendMessage(room, token, seedText);
    } else {
      setContactForm(f => ({ ...f, name: '', phone: trackPhone.trim(), email: '' }));
      setContactErr('');
      setView('contact');
    }
  }

  async function handleContactSubmit(e) {
    e.preventDefault();
    setContactErr('');
    const { value, errors } = validateForm(supportChatContactSchema, contactForm);
    if (errors) {
      setContactErr(errors.name || errors.phone || errors.email || Object.values(errors)[0]);
      return;
    }
    setSubmittingContact(true);
    try {
      const newUser = await mintGuest(value.name.trim(), value.phone.trim(), value.email?.trim());
      const newRoom = supportRoom(newUser.id);
      const newToken = localStorage.getItem('a1deal_guest_token');
      setView('thread');
      await loadHistory(newRoom, newToken);
      await sendMessage(newRoom, newToken, selectedTopic?.seedText);
    } catch (err) {
      setContactErr(err.response?.data?.message || 'Something went wrong. Try again.');
    }
    setSubmittingContact(false);
  }

  function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(room, token, text);
    setText('');
  }

  return (
    <div className="fixed bottom-20 md:bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div className="fixed top-4 left-3 right-3 bottom-4 md:static md:top-auto md:left-auto md:right-auto md:bottom-auto md:mb-3 w-auto md:w-[calc(100vw-2.5rem)] md:max-w-96 h-auto md:h-[min(28rem,70vh)] bg-white rounded-2xl shadow-level-3 border border-outline-variant flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {(view === 'thread' || view === 'bot_search' || view === 'bot_track' || view === 'bot_visit_slot' || view === 'human_options') && (
                <button
                  onClick={() => setView(view === 'bot_visit_slot' ? 'bot_search' : 'topics')}
                  aria-label="Back to topics"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 transition flex-shrink-0"
                >
                  <span className="material-icons-outlined text-lg">arrow_back</span>
                </button>
              )}
              <span className="font-montserrat font-bold text-sm truncate">A1 Deal Support</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/15 transition flex-shrink-0">
              <span className="material-icons-outlined text-lg">close</span>
            </button>
          </div>

          {/* Topics */}
          {view === 'topics' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <p className="text-sm text-on-surface-variant mb-2">How can we help you today?</p>

              <button
                onClick={() => { setSearchIntent('enquire'); setSearchResults(null); setSearchError(''); setView('bot_search'); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition text-left"
              >
                <span className="material-icons-outlined text-primary text-xl flex-shrink-0">search</span>
                <div>
                  <span className="block text-sm font-semibold text-on-surface">Browse Properties</span>
                  <span className="block text-xs text-on-surface-variant">Instant results, no waiting</span>
                </div>
              </button>
              <button
                onClick={() => { setSearchIntent('visit'); setSearchResults(null); setSearchError(''); setView('bot_search'); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition text-left"
              >
                <span className="material-icons-outlined text-primary text-xl flex-shrink-0">event</span>
                <div>
                  <span className="block text-sm font-semibold text-on-surface">Book a Site Visit</span>
                  <span className="block text-xs text-on-surface-variant">Pick a property, date & time</span>
                </div>
              </button>
              <button
                onClick={openTrackMyEnquiry}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition text-left"
              >
                <span className="material-icons-outlined text-primary text-xl flex-shrink-0">manage_search</span>
                <div>
                  <span className="block text-sm font-semibold text-on-surface">Track My Enquiry</span>
                  <span className="block text-xs text-on-surface-variant">Check status by phone number</span>
                </div>
              </button>
            </div>
          )}

          {/* Human options — call or chat */}
          {view === 'human_options' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <p className="text-sm text-on-surface-variant mb-2">Reach us however's easiest for you.</p>

              {supportPhone && (
                <a
                  href={`tel:${supportPhone.replace(/\s+/g, '')}`}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition text-left"
                >
                  <span className="material-icons-outlined text-primary text-xl flex-shrink-0">call</span>
                  <div>
                    <span className="block text-sm font-semibold text-on-surface">Call Customer Care</span>
                    <span className="block text-xs text-on-surface-variant">{supportPhone}</span>
                  </div>
                </a>
              )}

              <button
                onClick={() => pickTopic(SUPPORT_TOPICS.find(t => t.id === 'talk_to_agent'))}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition text-left"
              >
                <span className="material-icons-outlined text-primary text-xl flex-shrink-0">chat</span>
                <div>
                  <span className="block text-sm font-semibold text-on-surface">Chat With Us Instead</span>
                  <span className="block text-xs text-on-surface-variant">We'll reply as soon as we can</span>
                </div>
              </button>
            </div>
          )}

          {/* Bot: browse & enquire */}
          {view === 'bot_search' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <form onSubmit={runSearch} className="space-y-2">
                <input
                  type="text" placeholder="City (e.g. Jaipur)" autoFocus
                  value={searchForm.city}
                  onChange={e => setSearchForm(f => ({ ...f, city: e.target.value }))}
                  className={INP}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={searchForm.type}
                    onChange={e => setSearchForm(f => ({ ...f, type: e.target.value }))}
                    className={INP}
                  >
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'Any type' : t}</option>)}
                  </select>
                  <input
                    type="number" placeholder="Max budget ₹"
                    value={searchForm.maxBudget}
                    onChange={e => setSearchForm(f => ({ ...f, maxBudget: e.target.value }))}
                    className={INP}
                  />
                </div>
                {searchError && (
                  <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs">{searchError}</div>
                )}
                <button type="submit" disabled={searching}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition disabled:opacity-60">
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </form>

              {searchResults && (
                searchResults.length === 0 ? (
                  <EmptyState icon="search_off" label="No matches" hint="Try a different city or widen your budget." className="py-6" />
                ) : (
                  <div className="space-y-2 pt-1">
                    {searchResults.map(p => (
                      <div key={p._id} className="p-3 rounded-xl border border-outline-variant">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">{p.title}</p>
                            <p className="text-xs text-on-surface-variant">{[p.area, p.city].filter(Boolean).join(', ')}</p>
                          </div>
                          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {p._badge}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-primary">{formatPrice(p.price) || 'Price on request'}</span>
                          {searchIntent === 'visit' ? (
                            isGuest ? (
                              <button
                                onClick={() => navigate('/login')}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-container transition"
                              >
                                Sign In to Book
                              </button>
                            ) : (
                              <button
                                onClick={() => pickVisitProperty(p)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-container transition"
                              >
                                Schedule Visit
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => setEnquireProperty(p)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-container transition"
                            >
                              Enquire
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              <button onClick={goToHuman} className="w-full text-center text-xs text-on-surface-variant hover:text-primary underline pt-1">
                Can't find it? Talk to a human
              </button>
            </div>
          )}

          {/* Bot: book a visit — step 2, date & slot */}
          {view === 'bot_visit_slot' && visitProperty && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="p-3 rounded-xl bg-surface-container">
                <p className="text-sm font-semibold text-on-surface truncate">{visitProperty.title}</p>
                <p className="text-xs text-on-surface-variant">{[visitProperty.area, visitProperty.city].filter(Boolean).join(', ')}</p>
              </div>

              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Select Date</p>
              <div className="grid grid-cols-4 gap-1.5">
                {VISIT_DATES.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setVisitForm(f => ({ ...f, date: d.value }))}
                    className={`p-1.5 rounded-lg text-center text-[11px] font-semibold border transition-colors ${visitForm.date === d.value ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Select Time</p>
              <div className="grid grid-cols-3 gap-1.5">
                {VISIT_SLOTS.map(s => (
                  <button
                    key={s}
                    onClick={() => setVisitForm(f => ({ ...f, slot: s }))}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-colors ${visitForm.slot === s ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {bookError && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs">{bookError}</div>
              )}

              <button
                onClick={runBookVisit}
                disabled={booking || !visitForm.date || !visitForm.slot}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition disabled:opacity-60"
              >
                {booking ? 'Scheduling…' : 'Confirm Visit'}
              </button>
            </div>
          )}

          {/* Bot: book a visit — step 3, confirmation */}
          {view === 'bot_visit_done' && bookedVisit && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="material-icons-outlined text-emerald-600 text-2xl">check_circle</span>
              </div>
              <div>
                <p className="font-montserrat font-bold text-base text-on-surface">Visit Confirmed!</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{bookedVisit.date} at {bookedVisit.slot}</p>
              </div>
              <div className="w-full p-3 rounded-xl border border-dashed border-outline-variant bg-surface-container">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">Visit Pass Code</p>
                <p className="font-mono text-sm font-semibold text-on-surface mt-0.5">{bookedVisit.passCode}</p>
              </div>
              <p className="text-xs text-on-surface-variant">Show this code at the property. Full details are also saved under My Visits.</p>
              <button onClick={() => setView('topics')} className="w-full py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container transition">
                Done
              </button>
            </div>
          )}

          {/* Bot: track my enquiry */}
          {view === 'bot_track' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!isGuest && identity?.phone ? (
                <p className="text-xs text-on-surface-variant">
                  Showing enquiries for <span className="font-semibold text-on-surface">{identity.phone}</span>
                </p>
              ) : (
                <form onSubmit={runTrack} className="flex items-center gap-2">
                  <input
                    type="tel" placeholder="Phone number you enquired with" autoFocus
                    value={trackPhone}
                    onChange={e => setTrackPhone(e.target.value)}
                    className={INP}
                  />
                  <button type="submit" disabled={tracking}
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition disabled:opacity-60">
                    {tracking ? '…' : 'Check'}
                  </button>
                </form>
              )}
              {tracking && (
                <p className="text-xs text-on-surface-variant">Looking up your enquiries…</p>
              )}
              {trackError && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs">{trackError}</div>
              )}

              {trackResults && (
                trackResults.length === 0 ? (
                  <div className="space-y-3">
                    <EmptyState icon="search_off" label="No enquiries found" hint="We couldn't find any enquiries with this phone number." className="py-6" />
                    <button
                      type="button"
                      onClick={() => setShowGeneralEnquiry(true)}
                      className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition"
                    >
                      Create New Enquiry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-on-surface-variant">Tap an enquiry to ask for an update.</p>
                    {trackResults.map(e => {
                      const st = TRACK_STATUS[e.status] || TRACK_STATUS.new;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => selectTrackedEnquiry(e)}
                          className="w-full text-left p-3 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-on-surface truncate">{e.propertyTitle || e.city || 'General enquiry'}</p>
                              <p className="text-xs text-on-surface-variant">{timeAgo(e.createdAt)}{e.brokerName ? ` · with ${e.brokerName}` : ''}</p>
                            </div>
                            <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${st.cls}`}>
                              {st.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}

              <button onClick={goToHuman} className="w-full text-center text-xs text-on-surface-variant hover:text-primary underline pt-1">
                Need help with one of these? Talk to a human
              </button>
            </div>
          )}

          {/* Contact info (guests, first time only) */}
          {view === 'contact' && (
            <form onSubmit={handleContactSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-sm text-on-surface-variant">
                Quick question about <span className="font-semibold text-on-surface">{selectedTopic?.label}</span> — share your details so we can follow up.
              </p>
              {contactErr && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-xs">
                  {contactErr}
                </div>
              )}
              <input
                type="text" placeholder="Your name" autoFocus
                value={contactForm.name}
                onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                className={INP}
              />
              <input
                type="tel" placeholder="Phone number"
                value={contactForm.phone}
                onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                className={INP}
              />
              <input
                type="email" placeholder="Email (optional)"
                value={contactForm.email}
                onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                className={INP}
              />
              <button
                type="submit" disabled={submittingContact}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition disabled:opacity-60"
              >
                {submittingContact ? 'Starting chat…' : 'Start Chat'}
              </button>
            </form>
          )}

          {/* Thread */}
          {view === 'thread' && (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
                {loadingHistory ? (
                  <div className="space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-10 bg-surface-container rounded-xl animate-pulse" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState icon="chat" label="Say hello!" hint="Send a message to start the conversation." className="py-6" />
                ) : (
                  messages.map(m => {
                    const mine = m.sender === identity?.id;
                    return (
                      <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-primary text-white' : 'bg-white border border-outline-variant text-on-surface'}`}>
                          {!mine && <p className="text-[10px] font-semibold text-primary mb-0.5">{m.senderName}</p>}
                          <p className="leading-snug">{m.text}</p>
                          <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-on-surface-variant'}`}>{timeAgo(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-outline-variant flex-shrink-0">
                <input
                  type="text" placeholder="Type a message…"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit" disabled={sending || !text.trim()}
                  aria-label="Send message"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50 flex-shrink-0"
                >
                  <span className="material-icons-outlined text-lg">send</span>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => (open ? setOpen(false) : openWidget())}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        className={`w-14 h-14 rounded-full bg-primary text-white shadow-level-3 items-center justify-center hover:bg-primary-container transition ${open ? 'hidden md:flex' : 'flex'}`}
      >
        <span className="material-icons-outlined text-2xl">{open ? 'close' : 'chat'}</span>
      </button>

      {enquireProperty && (
        <EnquiryModal property={enquireProperty} onClose={() => setEnquireProperty(null)} />
      )}

      {showGeneralEnquiry && (
        <EnquiryModal onClose={() => setShowGeneralEnquiry(false)} />
      )}
    </div>
  );
}
