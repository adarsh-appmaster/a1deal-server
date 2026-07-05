import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/auth/PrivateRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import PendingApproval from './pages/auth/PendingApproval';
import InternalLoginPage from './pages/auth/InternalLoginPage';
import WelcomeOnboarding from './pages/auth/WelcomeOnboarding';
import TwoFactorVerification from './pages/auth/TwoFactorVerification';
import OtpVerificationPage from './pages/auth/OtpVerificationPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Portal Entry
import PortalSelector from './components/common/PortalSelector';

// Buyer Portal
import BuyerLayout from './portals/buyer/BuyerLayout';
import BuyerHome from './portals/buyer/pages/BuyerHome';
import PropertySearch from './portals/buyer/pages/PropertySearch';
import PropertyDetail from './portals/buyer/pages/PropertyDetail';
import MortgageListing from './portals/buyer/pages/MortgageListing';
import UnitPropertyListing from './portals/buyer/pages/UnitPropertyListing';
import BuilderProfile from './portals/buyer/pages/BuilderProfile';
import SiteVisitFlow from './portals/buyer/pages/SiteVisitFlow';
import MyVisits from './portals/buyer/pages/MyVisits';
import MortgagePropertyDetail from './portals/buyer/pages/MortgagePropertyDetail';

// Developer Portal
import DeveloperLayout from './portals/developer/DeveloperLayout';
import DeveloperDashboard from './portals/developer/pages/DeveloperDashboard';
import ProjectList from './portals/developer/pages/ProjectList';
import ProjectManagement from './portals/developer/pages/ProjectManagement';
import CreateProject from './portals/developer/pages/CreateProject';
import InventoryTracking from './portals/developer/pages/InventoryTracking';
import PartnershipPackages from './portals/developer/pages/PartnershipPackages';
import DeveloperRegister from './portals/developer/pages/DeveloperRegister';
import DeveloperMortgageProperties from './portals/developer/pages/DeveloperMortgageProperties';

// Broker Portal
import BrokerLayout from './portals/broker/BrokerLayout';
import BrokerDashboard from './portals/broker/pages/BrokerDashboard';
import BrokerLeads from './portals/broker/pages/BrokerLeads';
import PropertyListings from './portals/broker/pages/PropertyListings';
import DealPipeline from './portals/broker/pages/DealPipeline';
import CommissionTracker from './portals/broker/pages/CommissionTracker';
import MasterBroker from './portals/broker/pages/MasterBroker';
import BrokerMortgageProperties from './portals/broker/pages/BrokerMortgageProperties';
import BrokerEnquiries from './portals/broker/pages/BrokerEnquiries';

// Admin Portal
import AdminLayout from './portals/admin/AdminLayout';
import AdminDashboard from './portals/admin/pages/AdminDashboard';
import PendingApprovals from './portals/admin/pages/PendingApprovals';
import MasterBrokerRequests from './portals/admin/pages/MasterBrokerRequests';
import AdminMortgageProperties from './portals/admin/pages/AdminMortgageProperties';
import CommissionSettings from './portals/admin/pages/CommissionSettings';
import UserManagement from './portals/admin/pages/UserManagement';
import RevenueAnalytics from './portals/admin/pages/RevenueAnalytics';
import TeamDirectory from './portals/admin/pages/TeamDirectory';
import TeamMemberProfile from './portals/admin/pages/TeamMemberProfile';
import RolePermissions from './portals/admin/pages/RolePermissions';
import SystemSettings from './portals/admin/pages/SystemSettings';
import AdminUnitProperties from './portals/admin/pages/AdminUnitProperties';
import AdminWhatsAppGroups from './portals/admin/pages/AdminWhatsAppGroups';
import AdminEmailCampaign from './portals/admin/pages/AdminEmailCampaign';
import AdminLeads from './portals/admin/pages/AdminLeads';
import AdminBulkMessage from './portals/admin/pages/AdminBulkMessage';
import AdminPropertyEnquiries from './portals/admin/pages/AdminPropertyEnquiries';
import AdminSiteVisits from './portals/admin/pages/AdminSiteVisits';

// Team / Sales CRM Portal
import TeamLayout from './portals/team/TeamLayout';
import TeamDashboard from './portals/team/pages/TeamDashboard';
import LeadManagement from './portals/team/pages/LeadManagement';
import MasterBrokerReview from './portals/team/pages/MasterBrokerReview';
import TeamSiteVisits from './portals/team/pages/TeamSiteVisits';

// Bank Portal
import BankLayout from './portals/bank/BankLayout';
import BankDashboard from './portals/bank/pages/BankDashboard';
import MortgageLeads from './portals/bank/pages/MortgageLeads';
import AuctionProperties from './portals/bank/pages/AuctionProperties';
import LoanApprovals from './portals/bank/pages/LoanApprovals';
import BankSiteVisits from './portals/bank/pages/BankSiteVisits';

// Investor Portal
import InvestorLayout from './portals/investor/InvestorLayout';
import InvestorDashboard from './portals/investor/pages/InvestorDashboard';
import Opportunities from './portals/investor/pages/Opportunities';
import ReturnsROI from './portals/investor/pages/ReturnsROI';
import MyInvestments from './portals/investor/pages/MyInvestments';
import InvestorMortgageProperties from './portals/investor/pages/InvestorMortgageProperties';
import InvestorDocuments from './portals/investor/pages/InvestorDocuments';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing */}
          <Route path="/" element={<PortalSelector />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/verify-otp" element={<OtpVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/welcome" element={<WelcomeOnboarding />} />

          {/* Internal portal logins */}
          <Route path="/:portal/login" element={<InternalLoginPage />} />
          <Route path="/team/2fa" element={<TwoFactorVerification />} />

          {/* Developer standalone register */}
          <Route path="/developer/register" element={<DeveloperRegister />} />

          {/* Buyer Portal — layout is public; individual routes protect what needs auth */}
          <Route path="/buyer" element={<BuyerLayout />}>
            <Route index element={<BuyerHome />} />
            <Route path="search" element={<PropertySearch />} />
            <Route path="property/:id" element={<PropertyDetail />} />
            <Route path="builder/:id" element={<BuilderProfile />} />
            <Route path="mortgage" element={<MortgageListing />} />
            <Route path="mortgage/:id" element={<MortgagePropertyDetail />} />
            <Route path="unit-properties" element={<UnitPropertyListing />} />
            {/* Requires login — booking a site visit */}
            <Route path="visit/:propertyId" element={<PrivateRoute portalRole="buyer"><SiteVisitFlow /></PrivateRoute>} />
            <Route path="visits" element={<PrivateRoute portalRole="buyer"><MyVisits /></PrivateRoute>} />
          </Route>

          {/* Developer Portal */}
          <Route path="/developer" element={<PrivateRoute portalRole="developer"><DeveloperLayout /></PrivateRoute>}>
            <Route index element={<DeveloperDashboard />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/new" element={<CreateProject />} />
            <Route path="projects/:id" element={<ProjectManagement />} />
            <Route path="inventory" element={<InventoryTracking />} />
            <Route path="packages" element={<PartnershipPackages />} />
            <Route path="mortgage-properties" element={<DeveloperMortgageProperties />} />
          </Route>

          {/* Broker Portal */}
          <Route path="/broker" element={<PrivateRoute portalRole="broker"><BrokerLayout /></PrivateRoute>}>
            <Route index element={<BrokerDashboard />} />
            <Route path="leads" element={<BrokerLeads />} />
            <Route path="listings" element={<PropertyListings />} />
            <Route path="pipeline" element={<DealPipeline />} />
            <Route path="commissions" element={<CommissionTracker />} />
            <Route path="master" element={<MasterBroker />} />
            <Route path="mortgage-properties" element={<BrokerMortgageProperties />} />
            <Route path="enquiries" element={<BrokerEnquiries />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin" element={<PrivateRoute portalRole="admin"><AdminLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="pending" element={<PendingApprovals />} />
            <Route path="master-broker" element={<MasterBrokerRequests />} />
            <Route path="mortgage-properties" element={<AdminMortgageProperties />} />
            <Route path="commission-settings" element={<CommissionSettings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="revenue" element={<RevenueAnalytics />} />
            <Route path="team" element={<TeamDirectory />} />
            <Route path="team/:id" element={<TeamMemberProfile />} />
            <Route path="permissions" element={<RolePermissions />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="unit-properties" element={<AdminUnitProperties />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="bulk-message" element={<AdminBulkMessage />} />
            <Route path="whatsapp-groups" element={<AdminWhatsAppGroups />} />
            <Route path="email-campaigns" element={<AdminEmailCampaign />} />
            <Route path="enquiries" element={<AdminPropertyEnquiries />} />
            <Route path="site-visits" element={<AdminSiteVisits />} />
          </Route>

          {/* Team / Sales CRM */}
          <Route path="/team" element={<PrivateRoute portalRole="team"><TeamLayout /></PrivateRoute>}>
            <Route index element={<TeamDashboard />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route path="master-broker-review" element={<MasterBrokerReview />} />
            <Route path="site-visits" element={<TeamSiteVisits />} />
          </Route>

          {/* Bank Portal */}
          <Route path="/bank" element={<PrivateRoute portalRole="bank"><BankLayout /></PrivateRoute>}>
            <Route index element={<BankDashboard />} />
            <Route path="mortgages" element={<MortgageLeads />} />
            <Route path="enquiries" element={<MortgageLeads />} />
            <Route path="site-visits" element={<BankSiteVisits />} />
            <Route path="auctions" element={<AuctionProperties />} />
            <Route path="approvals" element={<LoanApprovals />} />
          </Route>

          {/* Investor Portal */}
          <Route path="/investor" element={<PrivateRoute portalRole="investor"><InvestorLayout /></PrivateRoute>}>
            <Route index element={<InvestorDashboard />} />
            <Route path="investments" element={<MyInvestments />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="returns" element={<ReturnsROI />} />
            <Route path="mortgage-properties" element={<InvestorMortgageProperties />} />
            <Route path="documents" element={<InvestorDocuments />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
