import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NAV = [
  { path: '/developer', end: true, icon: 'dashboard', label: 'Dashboard' },
  { path: '/developer/projects', icon: 'apartment', label: 'Projects' },
  { path: '/developer/projects/new', icon: 'add_circle', label: 'New Project' },
  { path: '/developer/inventory', icon: 'inventory_2', label: 'Inventory' },
  { path: '/developer/packages', icon: 'handshake', label: 'Packages' },
  { path: '/developer/mortgage-properties', icon: 'home_work', label: 'Mortgage Properties' },
  { path: '/developer/loan-transfer', icon: 'swap_horiz', label: 'Loan Transfer' },
];

export default function DeveloperLayout() {
  return (
    <DashboardLayout portalName="Developer Portal" portalColor="#1a1d2b" navItems={NAV}>
      <Outlet />
    </DashboardLayout>
  );
}
