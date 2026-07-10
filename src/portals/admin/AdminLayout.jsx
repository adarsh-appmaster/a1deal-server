import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChangePasswordModal from '../../components/common/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/admin', end: true, icon: 'dashboard', label: 'Dashboard' },

  { path: '/admin/pending', icon: 'pending', label: 'Pending Approvals', section: 'Approvals' },
  { path: '/admin/master-broker', icon: 'verified', label: 'Master Broker Requests', section: 'Approvals' },

  { path: '/admin/mortgage-properties', icon: 'home_work', label: 'Mortgage Properties', section: 'Properties' },
  { path: '/admin/unit-properties', icon: 'apartment', label: 'Unit Properties', section: 'Properties' },
  { path: '/admin/enquiries', icon: 'contact_support', label: 'Property Enquiries', section: 'Properties' },
  { path: '/admin/site-visits', icon: 'event', label: 'Site Visits', section: 'Properties' },

  { path: '/admin/leads', icon: 'person_search', label: 'Lead Management', section: 'People' },
  { path: '/admin/users', icon: 'manage_accounts', label: 'User Management', section: 'People' },
  { path: '/admin/team', icon: 'groups', label: 'Team Directory', section: 'People' },
  { path: '/admin/permissions', icon: 'lock', label: 'Role & Permissions', section: 'People' },

  { path: '/admin/commission-settings', icon: 'percent', label: 'Commission Settings', section: 'Business' },
  { path: '/admin/revenue', icon: 'analytics', label: 'Revenue Analytics', section: 'Business' },

  { path: '/admin/bulk-message', icon: 'campaign', label: 'Bulk Message', section: 'Comms' },
  { path: '/admin/whatsapp-groups', icon: 'groups', label: 'WhatsApp Groups', section: 'Comms' },
  { path: '/admin/email-campaigns', icon: 'mail', label: 'Email Campaigns', section: 'Comms' },

  { path: '/admin/articles', icon: 'article', label: 'Articles', section: 'Content' },

  { path: '/admin/settings', icon: 'settings', label: 'System Settings', section: 'System' },
];

export default function AdminLayout() {
  const { user, patchUser } = useAuth();
  return (
    <DashboardLayout portalName="Super Admin" portalColor="#484a5a" navItems={NAV}>
      <Outlet />
      {/* Force the seeded/default admin to set a real password before doing anything. */}
      {user?.mustChangePassword && (
        <ChangePasswordModal forced onClose={() => patchUser({ mustChangePassword: false })} />
      )}
    </DashboardLayout>
  );
}
