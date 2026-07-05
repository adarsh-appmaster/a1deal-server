import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NAV = [
  { path: '/team', end: true, icon: 'dashboard', label: 'CRM Dashboard' },
  { path: '/team/leads', icon: 'people', label: 'Lead Management' },
  { path: '/team/master-broker-review', icon: 'verified_user', label: 'Broker Reviews' },
  { path: '/team/site-visits', icon: 'event', label: 'Site Visits' },
];

export default function TeamLayout() {
  return (
    <DashboardLayout portalName="Team A1 Deal · CRM" portalColor="#0b5394" navItems={NAV}>
      <Outlet />
    </DashboardLayout>
  );
}
