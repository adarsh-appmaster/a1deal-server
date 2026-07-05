import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NAV = [
  { path: '/admin', end: true, icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/pending', icon: 'pending', label: 'Pending Approvals' },
  { path: '/admin/master-broker', icon: 'verified', label: 'Master Broker Requests' },
  { path: '/admin/mortgage-properties', icon: 'home_work', label: 'Mortgage Properties' },
  { path: '/admin/unit-properties', icon: 'apartment', label: 'Unit Properties' },
  { path: '/admin/enquiries', icon: 'contact_support', label: 'Property Enquiries' },
  { path: '/admin/site-visits', icon: 'event', label: 'Site Visits' },
  { path: '/admin/leads', icon: 'person_search', label: 'Lead Management' },
  { path: '/admin/commission-settings', icon: 'percent', label: 'Commission Settings' },
  { path: '/admin/users', icon: 'manage_accounts', label: 'User Management' },
  { path: '/admin/revenue', icon: 'analytics', label: 'Revenue Analytics' },
  { path: '/admin/team', icon: 'groups', label: 'Team Directory' },
  { path: '/admin/permissions', icon: 'lock', label: 'Role & Permissions' },
  { path: '/admin/bulk-message', icon: 'campaign', label: 'Bulk Message' },
  { path: '/admin/whatsapp-groups', icon: 'groups', label: 'WhatsApp Groups' },
  { path: '/admin/email-campaigns', icon: 'mail', label: 'Email Campaigns' },
  { path: '/admin/settings', icon: 'settings', label: 'System Settings' },
];

export default function AdminLayout() {
  return (
    <DashboardLayout portalName="Super Admin" portalColor="#484a5a" navItems={NAV}>
      <Outlet />
    </DashboardLayout>
  );
}
