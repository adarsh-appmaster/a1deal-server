import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

const GUEST_TOKEN_KEY = 'a1deal_guest_token';
const GUEST_USER_KEY  = 'a1deal_guest_user';

function readStoredGuest() {
  const token = localStorage.getItem(GUEST_TOKEN_KEY);
  const stored = localStorage.getItem(GUEST_USER_KEY);
  if (!token || !stored) return null;
  try {
    return { token, user: JSON.parse(stored) };
  } catch {
    return null;
  }
}

// Resolves "which identity is the support-chat widget using right now" —
// a real logged-in buyer's own session, or a lightweight guest identity
// minted on first use and cached in its own localStorage keys (kept
// completely separate from AuthContext's real a1deal_token/a1deal_user so a
// guest is never mistaken for a logged-in user anywhere else in the app).
export function useSupportChatAuth() {
  const { user } = useAuth();
  const { connectAsGuest } = useSocket() || {};
  const [guest, setGuest] = useState(readStoredGuest);

  const isGuest = !user;
  const identity = user || guest?.user || null;
  const token = user ? localStorage.getItem('a1deal_token') : guest?.token || null;

  const mintGuest = useCallback(async (name, phone, email) => {
    const { data } = await api.post('/auth/guest', { name, phone, email: email || undefined });
    localStorage.setItem(GUEST_TOKEN_KEY, data.token);
    localStorage.setItem(GUEST_USER_KEY, JSON.stringify(data.user));
    setGuest({ token: data.token, user: data.user });
    connectAsGuest?.(data.token);
    return data.user;
  }, [connectAsGuest]);

  return { identity, token, isGuest, mintGuest };
}
