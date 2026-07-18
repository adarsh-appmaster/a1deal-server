import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startSubscriptionCheckout } from '../utils/razorpay';
import api from '../api/axios';

// Shared "Subscribe to a plan" logic. Guests are sent to login (with the chosen
// plan remembered); once authenticated they return to /plans and checkout opens
// automatically.
export default function useSubscribe() {
  const navigate = useNavigate();
  const { user, patchUser } = useAuth();
  const [subscribingId, setSubscribingId] = useState(null);
  const [notice, setNotice] = useState(null); // { type: 'success' | 'error', msg }

  function subscribe(plan) {
    const planId = typeof plan === 'string' ? plan : plan?.id;
    if (!planId) return;
    if (!user) {
      sessionStorage.setItem('pendingPlan', planId);
      navigate('/login', { state: { from: '/plans' } });
      return;
    }
    const allowedRoles = ['buyer', 'broker', 'master_broker'];
    if (!allowedRoles.includes(user.role)) {
      setNotice({ type: 'error', msg: 'Plans are available for buyers, brokers, and master brokers.' });
      return;
    }
    setSubscribingId(planId);
    startSubscriptionCheckout(planId, user, {
      onSuccess: async () => {
        setSubscribingId(null);
        setNotice({ type: 'success', msg: '🎉 Your subscription is now active!' });
        // Refetch user from server so brokerTier / role changes (e.g. master plan upgrade) are reflected
        try {
          const { data } = await api.get('/auth/me');
          localStorage.setItem('a1deal_user', JSON.stringify(data));
          patchUser(data);
        } catch { /* non-fatal */ }
      },
      onError: (msg) => { setSubscribingId(null); if (msg) setNotice({ type: 'error', msg }); },
    });
  }

  // If the user just logged in after clicking Subscribe as a guest, resume checkout.
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingPlan');
    if (user && pending) {
      sessionStorage.removeItem('pendingPlan');
      subscribe(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { subscribe, subscribingId, notice, setNotice };
}
