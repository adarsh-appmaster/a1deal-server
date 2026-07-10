import { useState, useEffect, useRef } from 'react';
import { useSupportChatAuth } from '../../hooks/useSupportChatAuth';
import { useSocket, supportRoom } from '../../context/SocketContext';
import { SUPPORT_TOPICS } from '../../data/supportChatTopics';
import { validateForm } from '../../validation/validate';
import { supportChatContactSchema } from '../../validation/schemas';
import { timeAgo } from '../../utils/timeAgo';
import EmptyState from './EmptyState';
import api from '../../api/axios';

const ACTIVE_KEY = 'a1deal_support_chat_active';
const INP = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

// Floating buyer-facing support chat — a fixed launcher on every buyer page.
// Works for both guests (mints a lightweight identity via useSupportChatAuth
// on first contact) and logged-in buyers (uses their real session).
export default function SupportChatWidget() {
  const { identity, token, isGuest, mintGuest } = useSupportChatAuth();
  const { socket, connected } = useSocket() || {};

  const [open, setOpen] = useState(false);
  const [view, setView] = useState('topics'); // 'topics' | 'contact' | 'thread'
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '' });
  const [contactErr, setContactErr] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

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
        <div className="mb-3 w-[calc(100vw-2.5rem)] max-w-96 h-[min(28rem,70vh)] bg-white rounded-2xl shadow-level-3 border border-outline-variant flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {view === 'thread' && (
                <button
                  onClick={() => setView('topics')}
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
              {SUPPORT_TOPICS.map(t => (
                <button
                  key={t.id}
                  onClick={() => pickTopic(t)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition text-left"
                >
                  <span className="material-icons-outlined text-primary text-xl flex-shrink-0">{t.icon}</span>
                  <span className="text-sm font-medium text-on-surface">{t.label}</span>
                </button>
              ))}
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
        className="w-14 h-14 rounded-full bg-primary text-white shadow-level-3 flex items-center justify-center hover:bg-primary-container transition"
      >
        <span className="material-icons-outlined text-2xl">{open ? 'close' : 'chat'}</span>
      </button>
    </div>
  );
}
