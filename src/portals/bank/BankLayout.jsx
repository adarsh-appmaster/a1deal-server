import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/bank', end: true, icon: 'dashboard', label: 'Dashboard' },
  { path: '/bank/enquiries', icon: 'inbox', label: 'Enquiries' },
  { path: '/bank/site-visits', icon: 'event', label: 'Site Visits' },
  { path: '/bank/auctions', icon: 'gavel', label: 'Auction Properties' },
  { path: '/bank/approvals', icon: 'fact_check', label: 'Loan Approvals' },
];

export default function BankLayout() {
  const { user, patchUser } = useAuth();
  return (
    <DashboardLayout portalName="Bank Portal" portalColor="#0f4c81" navItems={NAV}>
      <Outlet />
      {/* Admin-created bank accounts get a temp password — force a change before use. */}
      {user?.mustChangePassword && (
        <ChangePasswordModal forced onClose={() => patchUser({ mustChangePassword: false })} />
      )}
    </DashboardLayout>
  );
}
