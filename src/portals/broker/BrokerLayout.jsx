import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NAV = [
  { path: '/broker', end: true, icon: 'dashboard', label: 'Dashboard' },
  { path: '/broker/leads', icon: 'people', label: 'Leads' },
  { path: '/broker/listings', icon: 'home', label: 'My Listings' },
  { path: '/broker/pipeline', icon: 'view_kanban', label: 'Deal Pipeline' },
  { path: '/broker/commissions', icon: 'payments', label: 'Commissions' },
  { path: '/broker/enquiries', icon: 'contact_support', label: 'Property Enquiries' },
  { path: '/broker/master', icon: 'verified', label: 'Master Broker' },
  { path: '/broker/mortgage-properties', icon: 'home_work', label: 'Mortgage Properties' },
];

export default function BrokerLayout() {
  return (
    <DashboardLayout
      portalName="Broker Portal"
      portalColor="#ff5a5f"
      navItems={NAV}
    >
      <Outlet />
    </DashboardLayout>
  );
}
