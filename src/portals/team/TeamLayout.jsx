import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/team', end: true, icon: 'dashboard', label: 'CRM Dashboard' },
  { path: '/team/leads', icon: 'people', label: 'Lead Management' },
  { path: '/team/master-broker-review', icon: 'verified_user', label: 'Broker Reviews' },
  { path: '/team/site-visits', icon: 'event', label: 'Site Visits' },
  { path: '/team/support-chat', icon: 'support_agent', label: 'Support Chat' },
];

export default function TeamLayout() {
  const { user, patchUser } = useAuth();
  return (
    <DashboardLayout portalName="Team A1 Deal · CRM" portalColor="#0b5394" navItems={NAV}>
      <Outlet />
      {user?.mustChangePassword && (
        <ChangePasswordModal forced onClose={() => patchUser({ mustChangePassword: false })} />
      )}
    </DashboardLayout>
  );
}
