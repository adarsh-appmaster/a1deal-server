import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const NAV = [
  { path: '/broker', end: true, icon: 'dashboard', label: 'Dashboard' },
  { path: '/broker/card', icon: 'badge', label: 'My Visiting Card' },
  { path: '/broker/leads', icon: 'people', label: 'Leads' },
  { path: '/broker/listings', icon: 'home', label: 'My Listings' },
  { path: '/broker/pipeline', icon: 'view_kanban', label: 'Deal Pipeline' },
  { path: '/broker/commissions', icon: 'payments', label: 'Commissions' },
  { path: '/broker/enquiries', icon: 'contact_support', label: 'Property Enquiries' },
  { path: '/broker/subscription', icon: 'workspace_premium', label: 'Subscription' },
  { path: '/broker/pincode-requests', icon: 'add_location_alt', label: 'Pincode Requests' },
  { path: '/broker/property-partners', icon: 'apartment', label: 'Property Partners' },
  { path: '/broker/mortgage-properties', icon: 'home_work', label: 'Property Deals' },
];

function PartnershipBanner({ status }) {
  const isPending = status === 'pending';
  return (
    <div className={`flex items-center gap-3 px-4 md:px-6 py-3 text-sm border-b ${
      isPending ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-rose-50 border-rose-100 text-rose-800'
    }`}>
      <span className="material-icons-outlined text-base flex-shrink-0">
        {isPending ? 'hourglass_top' : 'error_outline'}
      </span>
      <span className="flex-1">
        {isPending
          ? 'Your broker partnership is pending approval. You can browse properties, schedule visits, and send enquiries in the meantime — listing management unlocks once approved.'
          : 'Your broker partnership application was not approved. Contact support for details.'}
      </span>
    </div>
  );
}

function SubscriptionPaywall() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMasterBroker = user?.brokerTier === 'master';
  return (
    <div className="max-w-lg mx-auto px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <span className="material-icons-outlined text-primary text-3xl">workspace_premium</span>
      </div>
      <h2 className="font-montserrat font-bold text-2xl text-slate-800 mb-2">
        {isMasterBroker ? 'Activate Master Broker Features' : 'Activate your broker account'}
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        {isMasterBroker
          ? 'Subscribe to the Master Broker Plan to unlock sub-brokers, territory management, pincode expansion, and commission sharing.'
          : 'Your account was created by your master broker. Subscribe to a plan to unlock listings, leads, your visiting card, and all broker tools.'}
      </p>
      <button onClick={() => navigate('/plans')}
        className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition">
        View Plans & Subscribe
      </button>
    </div>
  );
}

export default function BrokerLayout() {
  const { user, patchUser } = useAuth();
  const partnershipStatus = user?.partnershipStatus;
  const showBanner = partnershipStatus === 'pending' || partnershipStatus === 'rejected';

  // Master-created brokers and master brokers are locked until they hold an active subscription.
  const needsSubCheck = !!user?.createdByMaster || user?.brokerTier === 'master';
  const [subChecked, setSubChecked] = useState(false);
  const [hasSub, setHasSub] = useState(false);
  useEffect(() => {
    if (!needsSubCheck) { setSubChecked(true); setHasSub(false); return; }
    setSubChecked(false);
    api.get('/subscriptions/mine')
      .then((r) => setHasSub(!!r.data.subscription))
      .catch(() => setHasSub(false))
      .finally(() => setSubChecked(true));
  }, [needsSubCheck]);

  const locked = needsSubCheck && subChecked && !hasSub;

  return (
    <DashboardLayout
      portalName="Broker Portal"
      portalColor="#ff5a5f"
      navItems={NAV}
      banner={showBanner ? <PartnershipBanner status={partnershipStatus} /> : null}
    >
      {locked ? <SubscriptionPaywall /> : (!subChecked ? null : <Outlet />)}
      {user?.mustChangePassword && (
        <ChangePasswordModal forced onClose={() => patchUser({ mustChangePassword: false })} />
      )}
    </DashboardLayout>
  );
}
