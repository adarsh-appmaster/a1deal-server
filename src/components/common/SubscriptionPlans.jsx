import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '../../data/subscriptionPlans';

// Renders the plan cards. `onSubscribe(plan)` is called when a plan's button is
// clicked; `subscribingId` shows a processing state. `user` is used to show
// current-plan status and upgrade labels.
export default function SubscriptionPlans({ onSubscribe, subscribingId, user }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});

  // Fetch user's current subscription from API (already done in PlansPage via
  // useSubscribe, but we can check user data for plan context)
  const currentPlan = user?.subscription?.plan || null;

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Determine the CTA label for each plan
  function getCtaLabel(plan) {
    if (subscribingId === plan.id) return 'Processing…';
    if (currentPlan === plan.id) return 'Current Plan';
    if (currentPlan && plan.id === 'master') return 'Upgrade to Master';
    if (currentPlan && plan.price > (PLANS.find(p => p.id === currentPlan)?.price || 0)) return 'Upgrade';
    return `Subscribe — ${plan.priceLabel}${plan.period}`;
  }

  function handleCta(plan) {
    // If not logged in, redirect to signup/login
    if (!user) {
      sessionStorage.setItem('pendingPlan', plan.id);
      navigate('/login', { state: { from: '/plans' } });
      return;
    }
    onSubscribe(plan);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-start">
      {PLANS.map((plan) => {
        const isOpen = expanded[plan.id];
        const visibleSections = isOpen ? plan.sections : plan.sections.slice(0, 2);
        const isCurrent = currentPlan === plan.id;

        return (
          <div
            key={plan.id}
            className={`relative rounded-3xl border bg-white flex flex-col overflow-hidden ${
              plan.highlighted
                ? 'border-primary shadow-xl ring-1 ring-primary/20'
                : isCurrent
                  ? 'border-emerald-300 shadow-md ring-1 ring-emerald-200'
                  : 'border-slate-200 shadow-sm'
            }`}
          >
            {/* Colored header band */}
            <div className={`px-6 sm:px-8 pt-6 pb-4 ${plan.highlighted ? 'bg-primary/5' : isCurrent ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              {plan.highlighted && !isCurrent && (
                <span className="inline-block px-3 py-1 rounded-full bg-primary text-white text-xs font-bold shadow mb-3">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow mb-3">
                  Your Current Plan
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg">{plan.dot}</span>
                <h3 className="font-montserrat font-bold text-xl text-slate-800">{plan.name}</h3>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-montserrat font-extrabold text-4xl text-slate-900">{plan.priceLabel}</span>
                <span className="text-slate-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">{plan.tagline}</p>
              {plan.inherits && (
                <p className="text-xs font-semibold text-primary mt-3 bg-primary/10 rounded-lg px-3 py-2">{plan.inherits}</p>
              )}
            </div>

            {/* Feature list */}
            <div className="px-6 sm:px-8 py-5 space-y-4 flex-1">
              {visibleSections.map((sec) => (
                <div key={sec.title}>
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">{sec.title}</p>
                  <ul className="space-y-1.5">
                    {sec.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="material-icons-outlined text-emerald-500 text-base mt-0.5 flex-shrink-0">check_circle</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {plan.bestFor?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1.5">Best For</p>
                  <ul className="space-y-1.5">
                    {plan.bestFor.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="material-icons-outlined text-primary text-base mt-0.5 flex-shrink-0">star</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.sections.length > 2 && (
                <button
                  onClick={() => toggle(plan.id)}
                  className="text-xs font-semibold text-primary hover:text-primary-container transition"
                >
                  {isOpen ? 'Show less' : `See all ${plan.sections.length} sections`}
                </button>
              )}
            </div>

            {/* CTA */}
            <div className="px-6 sm:px-8 pb-6 pt-2">
              <button
                onClick={() => handleCta(plan)}
                disabled={subscribingId === plan.id || isCurrent}
                className={`w-full py-3 rounded-xl font-bold text-sm transition disabled:opacity-60 ${
                  isCurrent
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : plan.highlighted
                      ? 'bg-primary text-white hover:bg-primary-container'
                      : currentPlan && plan.price > (PLANS.find(p => p.id === currentPlan)?.price || 0)
                        ? 'bg-primary text-white hover:bg-primary-container'
                        : 'border-2 border-slate-300 text-slate-700 hover:border-primary hover:text-primary'
                }`}
              >
                {getCtaLabel(plan)}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
