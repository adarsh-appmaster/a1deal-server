import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import SubscriptionPlans from '../../../components/common/SubscriptionPlans';
import useSubscribe from '../../../hooks/useSubscribe';
import api from '../../../api/axios';

const PLAN_LABELS = { essential: 'Essential', premium: 'Premium', master: 'Master Broker' };
const PLAN_COLORS = { essential: 'bg-blue-100 text-blue-700', premium: 'bg-primary/10 text-primary', master: 'bg-purple-100 text-purple-700' };

export default function BrokerSubscription() {
  const navigate = useNavigate();
  const { user, patchUser } = useAuth();
  const { subscribe, subscribingId, notice, setNotice } = useSubscribe();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/subscriptions/mine')
      .then(r => setSubscription(r.data.subscription))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const plan = subscription?.plan;
  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  // Merge plan into user for SubscriptionPlans
  const userWithPlan = user ? { ...user, subscription: plan ? { plan } : null } : null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-icons-outlined text-4xl text-primary animate-spin">progress_activity</span>
    </div>
  );

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Current plan */}
      <div>
        <h1 className="font-montserrat font-bold text-2xl text-on-surface mb-1">Subscription</h1>
        <p className="text-on-surface-variant text-sm">Manage your plan and billing.</p>
      </div>

      {subscription ? (
        <div className="card p-6 max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Current Plan</p>
              <p className="font-montserrat font-bold text-xl text-on-surface mt-1">
                {PLAN_LABELS[plan] || plan} Plan
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PLAN_COLORS[plan] || 'bg-slate-100 text-slate-600'}`}>
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Started</p>
              <p className="font-medium text-on-surface">{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
            </div>
            <div>
              <p className="text-slate-400">Renews / Expires</p>
              <p className="font-medium text-on-surface">
                {endDate ? endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                {daysLeft > 0 && <span className="text-xs text-slate-400 ml-1">({daysLeft}d left)</span>}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Amount</p>
              <p className="font-medium text-on-surface">₹{(subscription.amount || 0).toLocaleString('en-IN')}/mo</p>
            </div>
            <div>
              <p className="text-slate-400">Payment ID</p>
              <p className="font-medium text-on-surface text-xs truncate">{subscription.razorpayPaymentId || '—'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="material-icons-outlined text-amber-600 text-xl">workspace_premium</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface">No Active Plan</p>
              <p className="text-sm text-on-surface-variant">Subscribe to unlock all broker tools and features.</p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade / Change plan */}
      <div>
        <h2 className="font-montserrat font-bold text-lg text-on-surface mb-1">
          {plan ? 'Change Plan' : 'Choose a Plan'}
        </h2>
        <p className="text-on-surface-variant text-sm mb-6">
          {plan
            ? `You're currently on the ${PLAN_LABELS[plan] || plan} plan. Switch to a different plan below.`
            : 'Pick a plan to get started.'}
        </p>
        {notice && (
          <div className={`max-w-2xl mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-3 ${
            notice.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}>
            <span>{notice.msg}</span>
            <button onClick={() => setNotice(null)}><span className="material-icons-outlined text-base">close</span></button>
          </div>
        )}
        <SubscriptionPlans onSubscribe={subscribe} subscribingId={subscribingId} user={userWithPlan} />
      </div>
    </div>
  );
}
