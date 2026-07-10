import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/auth/PrivateRoute';
import { ToastHost } from './components/common/Toast';

// Auth pages — small, kept static
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import PendingApproval from './pages/auth/PendingApproval';
import InternalLoginPage from './pages/auth/InternalLoginPage';
import WelcomeOnboarding from './pages/auth/WelcomeOnboarding';
import TwoFactorVerification from './pages/auth/TwoFactorVerification';
import OtpVerificationPage from './pages/auth/OtpVerificationPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Portal Entry — small, kept static
import PortalSelector from './components/common/PortalSelector';
import ComingSoon from './components/common/ComingSoon';

// Lazy-loaded portal chunks
const BuyerPortal        = lazy(() => import('./portals/buyer/BuyerLayout'));
const BuyerHome          = lazy(() => import('./portals/buyer/pages/BuyerHome'));
const PropertySearch     = lazy(() => import('./portals/buyer/pages/PropertySearch'));
const PropertyDetail     = lazy(() => import('./portals/buyer/pages/PropertyDetail'));
const MortgageListing    = lazy(() => import('./portals/buyer/pages/MortgageListing'));
const UnitPropertyListing = lazy(() => import('./portals/buyer/pages/UnitPropertyListing'));
const BuilderProfile     = lazy(() => import('./portals/buyer/pages/BuilderProfile'));
const SiteVisitFlow      = lazy(() => import('./portals/buyer/pages/SiteVisitFlow'));
const MyVisits           = lazy(() => import('./portals/buyer/pages/MyVisits'));
const MortgagePropertyDetail = lazy(() => import('./portals/buyer/pages/MortgagePropertyDetail'));
const ArticlesListing    = lazy(() => import('./portals/buyer/pages/ArticlesListing'));
const ArticleDetail      = lazy(() => import('./portals/buyer/pages/ArticleDetail'));

const DeveloperLayout    = lazy(() => import('./portals/developer/DeveloperLayout'));
const DeveloperDashboard = lazy(() => import('./portals/developer/pages/DeveloperDashboard'));
const ProjectList        = lazy(() => import('./portals/developer/pages/ProjectList'));
const ProjectManagement  = lazy(() => import('./portals/developer/pages/ProjectManagement'));
const CreateProject      = lazy(() => import('./portals/developer/pages/CreateProject'));
const InventoryTracking  = lazy(() => import('./portals/developer/pages/InventoryTracking'));
const PartnershipPackages = lazy(() => import('./portals/developer/pages/PartnershipPackages'));
const DeveloperRegister  = lazy(() => import('./portals/developer/pages/DeveloperRegister'));
const DeveloperMortgageProperties = lazy(() => import('./portals/developer/pages/DeveloperMortgageProperties'));

const BrokerLayout       = lazy(() => import('./portals/broker/BrokerLayout'));
const BrokerDashboard    = lazy(() => import('./portals/broker/pages/BrokerDashboard'));
const BrokerLeads        = lazy(() => import('./portals/broker/pages/BrokerLeads'));
// PropertyListings and MasterBroker pages are temporarily disabled (see routes below) —
// kept imported so re-enabling later is a one-line route change.
const PropertyListings   = lazy(() => import('./portals/broker/pages/PropertyListings'));
const DealPipeline       = lazy(() => import('./portals/broker/pages/DealPipeline'));
const CommissionTracker  = lazy(() => import('./portals/broker/pages/CommissionTracker'));
const MasterBroker       = lazy(() => import('./portals/broker/pages/MasterBroker'));
const PincodeRequests    = lazy(() => import('./portals/broker/pages/PincodeRequests'));
const PropertyPartners   = lazy(() => import('./portals/broker/pages/PropertyPartners'));
const BrokerMortgageProperties = lazy(() => import('./portals/broker/pages/BrokerMortgageProperties'));
const BrokerEnquiries    = lazy(() => import('./portals/broker/pages/BrokerEnquiries'));

const AdminLayout        = lazy(() => import('./portals/admin/AdminLayout'));
const AdminDashboard     = lazy(() => import('./portals/admin/pages/AdminDashboard'));
const PendingApprovals   = lazy(() => import('./portals/admin/pages/PendingApprovals'));
const MasterBrokerRequests = lazy(() => import('./portals/admin/pages/MasterBrokerRequests'));
const AdminMortgageProperties = lazy(() => import('./portals/admin/pages/AdminMortgageProperties'));
const CommissionSettings = lazy(() => import('./portals/admin/pages/CommissionSettings'));
const UserManagement     = lazy(() => import('./portals/admin/pages/UserManagement'));
const RevenueAnalytics   = lazy(() => import('./portals/admin/pages/RevenueAnalytics'));
const TeamDirectory      = lazy(() => import('./portals/admin/pages/TeamDirectory'));
const TeamMemberProfile  = lazy(() => import('./portals/admin/pages/TeamMemberProfile'));
const RolePermissions    = lazy(() => import('./portals/admin/pages/RolePermissions'));
const SystemSettings     = lazy(() => import('./portals/admin/pages/SystemSettings'));
const AdminUnitProperties = lazy(() => import('./portals/admin/pages/AdminUnitProperties'));
const AdminWhatsAppGroups = lazy(() => import('./portals/admin/pages/AdminWhatsAppGroups'));
const AdminEmailCampaign = lazy(() => import('./portals/admin/pages/AdminEmailCampaign'));
const AdminLeads         = lazy(() => import('./portals/admin/pages/AdminLeads'));
const AdminBulkMessage   = lazy(() => import('./portals/admin/pages/AdminBulkMessage'));
const AdminPropertyEnquiries = lazy(() => import('./portals/admin/pages/AdminPropertyEnquiries'));
const AdminSiteVisits    = lazy(() => import('./portals/admin/pages/AdminSiteVisits'));
const AdminArticles      = lazy(() => import('./portals/admin/pages/AdminArticles'));

const TeamLayout         = lazy(() => import('./portals/team/TeamLayout'));
const TeamDashboard      = lazy(() => import('./portals/team/pages/TeamDashboard'));
const LeadManagement     = lazy(() => import('./portals/team/pages/LeadManagement'));
const MasterBrokerReview = lazy(() => import('./portals/team/pages/MasterBrokerReview'));
const TeamSiteVisits     = lazy(() => import('./portals/team/pages/TeamSiteVisits'));
const SupportChat        = lazy(() => import('./portals/team/pages/SupportChat'));

const BankLayout         = lazy(() => import('./portals/bank/BankLayout'));
const BankDashboard      = lazy(() => import('./portals/bank/pages/BankDashboard'));
const MortgageLeads      = lazy(() => import('./portals/bank/pages/MortgageLeads'));
const AuctionProperties  = lazy(() => import('./portals/bank/pages/AuctionProperties'));
const LoanApprovals      = lazy(() => import('./portals/bank/pages/LoanApprovals'));
const BankSiteVisits     = lazy(() => import('./portals/bank/pages/BankSiteVisits'));

const InvestorLayout     = lazy(() => import('./portals/investor/InvestorLayout'));
const InvestorDashboard  = lazy(() => import('./portals/investor/pages/InvestorDashboard'));
const Opportunities      = lazy(() => import('./portals/investor/pages/Opportunities'));
const ReturnsROI         = lazy(() => import('./portals/investor/pages/ReturnsROI'));
const MyInvestments      = lazy(() => import('./portals/investor/pages/MyInvestments'));
const InvestorMortgageProperties = lazy(() => import('./portals/investor/pages/InvestorMortgageProperties'));
const InvestorDocuments  = lazy(() => import('./portals/investor/pages/InvestorDocuments'));

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <span className="material-icons-outlined text-3xl animate-spin text-primary">progress_activity</span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <ToastHost />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageSpinner />}>
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

          {/* Buyer Portal */}
          <Route path="/buyer" element={<BuyerPortal />}>
            <Route index element={<BuyerHome />} />
            <Route path="search" element={<PropertySearch />} />
            <Route path="property/:id" element={<PropertyDetail />} />
            <Route path="builder/:id" element={<BuilderProfile />} />
            <Route path="mortgage" element={<MortgageListing />} />
            <Route path="mortgage/:id" element={<MortgagePropertyDetail />} />
            <Route path="unit-properties" element={<UnitPropertyListing />} />
            <Route path="visit/:propertyId" element={<PrivateRoute portalRole="buyer"><SiteVisitFlow /></PrivateRoute>} />
            <Route path="visits" element={<PrivateRoute portalRole="buyer"><MyVisits /></PrivateRoute>} />
            <Route path="articles" element={<ArticlesListing />} />
            <Route path="articles/:slug" element={<ArticleDetail />} />
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
            <Route path="listings" element={<ComingSoon icon="home" title="My Listings" message="Listing management is temporarily disabled for brokers. Please check back soon." />} />
            <Route path="pipeline" element={<DealPipeline />} />
            <Route path="commissions" element={<CommissionTracker />} />
            <Route path="master" element={<ComingSoon icon="verified" title="Master Broker" message="The Master Broker facility will be available soon." />} />
            <Route path="pincode-requests" element={<PincodeRequests />} />
            <Route path="property-partners" element={<PropertyPartners />} />
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
            <Route path="articles" element={<AdminArticles />} />
          </Route>

          {/* Team / Sales CRM */}
          <Route path="/team" element={<PrivateRoute portalRole="team"><TeamLayout /></PrivateRoute>}>
            <Route index element={<TeamDashboard />} />
            <Route path="leads" element={<LeadManagement />} />
            <Route path="master-broker-review" element={<MasterBrokerReview />} />
            <Route path="site-visits" element={<TeamSiteVisits />} />
            <Route path="support-chat" element={<SupportChat />} />
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
        </Suspense>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
