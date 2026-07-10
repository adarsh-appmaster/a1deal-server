import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

const ROLE_PATHS = {
  buyer: '/buyer',
  broker: '/broker',
  developer: '/developer',
  investor: '/investor',
  admin: '/admin',
  team: '/team',
  bank: '/bank',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('a1deal_token');
    const stored = localStorage.getItem('a1deal_user');
    if (token && stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Always refresh from server so role/tier changes (e.g. approved as master broker) are reflected immediately
      api.get('/auth/me').then(r => {
        const fresh = r.data;
        localStorage.setItem('a1deal_user', JSON.stringify(fresh));
        setUser(fresh);
      }).catch(() => {});
    }
    setLoading(false);
  }, []);

  // login({ email, password }) — calls API
  // login({ token, user })   — called after OTP verify (token already obtained)
  const login = async (credOrSession) => {
    if (credOrSession.token) {
      const { token, user: u } = credOrSession;
      localStorage.setItem('a1deal_token', token);
      localStorage.setItem('a1deal_user', JSON.stringify(u));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(u);
      return u;
    }
    const { email, password } = credOrSession;
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('a1deal_token', data.token);
    localStorage.setItem('a1deal_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    // register now always returns { email, role, message } — OTP sent
    return data;
  };

  const logout = () => {
    localStorage.removeItem('a1deal_token');
    localStorage.removeItem('a1deal_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Swap in a freshly issued token (e.g. after a password change rotates it)
  // so the current session keeps working instead of being logged out.
  const applyToken = (token) => {
    if (!token) return;
    localStorage.setItem('a1deal_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const portalPath = (role) => ROLE_PATHS[role] || '/';

  // Allow components to patch the cached user object (e.g. clear mustChangePassword)
  const patchUser = (updater) => {
    setUser(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      localStorage.setItem('a1deal_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, portalPath, patchUser, applyToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
