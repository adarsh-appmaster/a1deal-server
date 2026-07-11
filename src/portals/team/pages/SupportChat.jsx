import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { timeAgo } from '../../../utils/timeAgo';
import EmptyState from '../../../components/common/EmptyState';
import { SkeletonRows } from '../../../components/common/Skeleton';
import api from '../../../api/axios';
import { toast } from '../../../components/common/Toast';

// Shared inbox — any online team member can open and answer any buyer
// support chat. No claiming/assignment for v1; whoever replies, replies.
export default function SupportChat() {
  const { user } = useAuth();
  const { socket, connected } = useSocket() || {};

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);
  const selectedRoomRef = useRef(null);
  selectedRoomRef.current = selectedRoom;

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/support-rooms');
      setRooms(data.rooms || []);
    } catch { /* silent */ }
    setLoadingRooms(false);
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Live: new messages append to the open thread; any support-room activity
  // refreshes the room list (bumps order / picks up brand-new conversations).
  useEffect(() => {
    const s = socket?.current;
    if (!s || !connected) return;
    function onMessage(msg) {
      if (msg.room !== selectedRoomRef.current) return;
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    }
    function onNewRoom() { fetchRooms(); }
    s.on('new_message', onMessage);
    s.on('new_chat_room', onNewRoom);
    return () => { s.off('new_message', onMessage); s.off('new_chat_room', onNewRoom); };
  }, [socket, connected, fetchRooms]);

  async function openRoom(room) {
    setSelectedRoom(room);
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/chat/${room}/history`);
      setMessages(data.messages || []);
    } catch { setMessages([]); }
    setLoadingMessages(false);
    socket?.current?.emit('join_room', room);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !selectedRoom) return;
    setSending(true);
    try {
      const { data } = await api.post('/chat/message', { room: selectedRoom, text: text.trim() });
      setMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, data.message]);
      setText('');
      fetchRooms();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send message.'); }
    setSending(false);
  }

  const activeRoom = rooms.find(r => r.room === selectedRoom);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Support Chat</h1>
        <p className="text-on-surface-variant text-sm">Live buyer questions — shared inbox, anyone can answer</p>
      </div>

      <div className="card overflow-hidden flex" style={{ height: '32rem' }}>
        {/* Room list */}
        <div className="w-72 flex-shrink-0 border-r border-outline-variant overflow-y-auto">
          {loadingRooms ? (
            <div className="p-3"><SkeletonRows count={4} /></div>
          ) : rooms.length === 0 ? (
            <EmptyState icon="support_agent" label="No active support chats" hint="New buyer conversations will appear here." className="py-10" />
          ) : (
            rooms.map(r => (
              <button
                key={r.room}
                onClick={() => openRoom(r.room)}
                className={`w-full text-left px-4 py-3 border-b border-outline-variant hover:bg-surface-container transition ${selectedRoom === r.room ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="font-semibold text-on-surface text-sm truncate">{r.buyerName}</p>
                  {r.isGuest && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Guest</span>}
                </div>
                <p className="text-xs text-on-surface-variant truncate">{r.lastMsg}</p>
                <p className="text-[10px] text-on-surface-variant/70 mt-1">{timeAgo(r.lastAt)}</p>
              </button>
            ))
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedRoom ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon="forum" label="Select a conversation" hint="Pick a buyer from the list to view and reply." />
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-outline-variant flex-shrink-0">
                <p className="font-semibold text-on-surface text-sm">{activeRoom?.buyerName || 'Buyer'}</p>
                {activeRoom?.buyerPhone && <p className="text-xs text-on-surface-variant">{activeRoom.buyerPhone}</p>}
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
                {loadingMessages ? (
                  <SkeletonRows count={3} />
                ) : (
                  messages.map(m => {
                    const mine = m.sender === user?.id;
                    return (
                      <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-primary text-white' : 'bg-white border border-outline-variant text-on-surface'}`}>
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
                  type="text" placeholder="Type a reply…"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit" disabled={sending || !text.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 flex-shrink-0"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
