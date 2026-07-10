import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const GUEST_TOKEN_KEY = 'a1deal_guest_token';

// Resolve the socket.io server origin:
//  - explicit VITE_SOCKET_URL wins;
//  - an absolute VITE_API_URL (https://host/api) → strip the trailing /api;
//  - a relative VITE_API_URL (/api, dev via Vite proxy) → talk to the dev server directly on :5002.
const API_URL = import.meta.env.VITE_API_URL || '';
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (API_URL.startsWith('http')
    ? API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5002');

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  // Bumped by connectAsGuest() so a guest token minted after mount (e.g. on
  // first support-chat topic click) opens a socket immediately, without
  // waiting for user?.id to change (it never will, for a guest).
  const [guestTick, setGuestTick] = useState(0);

  useEffect(() => {
    const realToken  = localStorage.getItem('a1deal_token');
    const guestToken = localStorage.getItem(GUEST_TOKEN_KEY);
    const token = (user && realToken) ? realToken : guestToken;

    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Rejoin any rooms tracked in session storage after reconnect
      const saved = sessionStorage.getItem('chat_rooms');
      if (saved) JSON.parse(saved).forEach(r => socket.emit('join_room', r));
    });
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, guestTick]);

  // Called once a guest token has been minted (support-chat widget) — stores
  // it and forces the effect above to re-run right away.
  function connectAsGuest(token) {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
    setGuestTick(t => t + 1);
  }

  return (
    <SocketContext.Provider value={{ socket: socketRef, connected, connectAsGuest }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

// Build a deterministic room name for two users
export function negoRoom(id1, id2) {
  const [a, b] = [id1, id2].sort();
  return `nego_${a}_${b}`;
}

// Build the (single-party) support-chat room name for a buyer/guest.
export function supportRoom(userId) {
  return `support_${userId}`;
}
