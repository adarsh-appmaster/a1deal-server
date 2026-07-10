import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/broker', end: true, icon: 'dashboard', label: 'Dashboard' },
  { path: '/broker/leads', icon: 'people', label: 'Leads' },
  { path: '/broker/listings', icon: 'home', label: 'My Listings' },
  { path: '/broker/pipeline', icon: 'view_kanban', label: 'Deal Pipeline' },
  { path: '/broker/commissions', icon: 'payments', label: 'Commissions' },
  { path: '/broker/enquiries', icon: 'contact_support', label: 'Property Enquiries' },
  { path: '/broker/pincode-requests', icon: 'add_location_alt', label: 'Pincode Requests' },
  { path: '/broker/master', icon: 'verified', label: 'Master Broker' },
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

export default function BrokerLayout() {
  const { user, patchUser } = useAuth();
  const partnershipStatus = user?.partnershipStatus;
  const showBanner = partnershipStatus === 'pending' || partnershipStatus === 'rejected';
  return (
    <DashboardLayout
      portalName="Broker Portal"
      portalColor="#ff5a5f"
      navItems={NAV}
      banner={showBanner ? <PartnershipBanner status={partnershipStatus} /> : null}
    >
      <Outlet />
      {user?.mustChangePassword && (
        <ChangePasswordModal forced onClose={() => patchUser({ mustChangePassword: false })} />
      )}
    </DashboardLayout>
  );
}
