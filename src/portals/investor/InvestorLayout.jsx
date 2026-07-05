import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const NAV = [
  { path: '/investor', end: true, icon: 'dashboard', label: 'Portfolio' },
  { path: '/investor/investments', icon: 'savings', label: 'My Investments' },
  { path: '/investor/opportunities', icon: 'trending_up', label: 'Opportunities' },
  { path: '/investor/returns', icon: 'payments', label: 'Returns & ROI' },
  { path: '/investor/mortgage-properties', icon: 'home_work', label: 'Mortgage Properties' },
  { path: '/investor/documents', icon: 'folder', label: 'Documents' },
];

export default function InvestorLayout() {
  return (
    <DashboardLayout portalName="Investor Portal" portalColor="#1b5e20" navItems={NAV}>
      <Outlet />
    </DashboardLayout>
  );
}
