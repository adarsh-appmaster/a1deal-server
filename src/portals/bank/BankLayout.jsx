import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NAV = [
  { path: '/bank', end: true, icon: 'dashboard', label: 'Dashboard' },
  { path: '/bank/enquiries', icon: 'inbox', label: 'Enquiries' },
  { path: '/bank/site-visits', icon: 'event', label: 'Site Visits' },
  { path: '/bank/auctions', icon: 'gavel', label: 'Auction Properties' },
  { path: '/bank/loan-transfer', icon: 'sync_alt', label: 'Loan Transfer' },
  { path: '/bank/approvals', icon: 'fact_check', label: 'Loan Approvals' },
];

export default function BankLayout() {
  return (
    <DashboardLayout portalName="Bank Portal" portalColor="#0f4c81" navItems={NAV}>
      <Outlet />
    </DashboardLayout>
  );
}
