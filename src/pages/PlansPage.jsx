import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscriptionPlans from '../components/common/SubscriptionPlans';
import useSubscribe from '../hooks/useSubscribe';
import api from '../api/axios';

export default function PlansPage() {
  const navigate = useNavigate();
  const { user, portalPath } = useAuth();
  const { subscribe, subscribingId, notice, setNotice } = useSubscribe();
  const [currentPlan, setCurrentPlan] = useState(null);

  const allowedRoles = ['buyer', 'broker', 'master_broker'];
  const isAllowed = !user || allowedRoles.includes(user.role);

  // Fetch current subscription to show status
  useEffect(() => {
    if (!user) return;
    api.get('/subscriptions/mine')
      .then(r => {
        if (r.data.subscription?.plan) setCurrentPlan(r.data.subscription.plan);
      })
      .catch(() => {});
  }, [user]);

  // Merge currentPlan into user so SubscriptionPlans can read it
  const userWithPlan = user ? { ...user, subscription: currentPlan ? { plan: currentPlan } : null } : null;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition">
            <span className="material-icons-outlined text-base">arrow_back</span> Home
          </button>
          {user ? (
            <button onClick={() => navigate(portalPath(user.role))}
              className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">
              My Dashboard
            </button>
          ) : (
            <button onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition">
              Sign In
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="font-montserrat font-extrabold text-3xl sm:text-4xl text-slate-900">Marketing Plans for Brokers</h1>
          <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
            Grow your property business with done-for-you branding, creatives, and Meta ad campaigns.
          </p>
        </div>

        {notice && (
          <div className={`max-w-2xl mx-auto mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-3 ${
            notice.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}>
            <span>{notice.msg}</span>
            <button onClick={() => setNotice(null)}><span className="material-icons-outlined text-base">close</span></button>
          </div>
        )}

        {isAllowed ? (
          <SubscriptionPlans onSubscribe={subscribe} subscribingId={subscribingId} user={userWithPlan} />
        ) : (
          <div className="max-w-xl mx-auto text-center py-16">
            <span className="material-icons-outlined text-5xl text-slate-300 mb-4">lock</span>
            <h2 className="font-montserrat font-bold text-xl text-slate-700 mb-2">Broker-only plans</h2>
            <p className="text-slate-500 text-sm">
              Marketing plans are available exclusively for brokers and master brokers.
            </p>
            <button onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition">
              Back to Home
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          Secure payments by Razorpay · GST may apply · Cancel anytime.
        </p>
      </div>
    </div>
  );
}
