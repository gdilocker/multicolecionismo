import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DrawerProvider } from './contexts/DrawerContext';
import ProtectedRoute from './components/ProtectedRoute';
import { SubscriptionProtectedRoute } from './components/SubscriptionProtectedRoute';
import ResellerProtectedRoute from './components/ResellerProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';

// Immediate load - Critical pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load - Secondary pages
const Pricing = lazy(() => import('./pages/Pricing'));
const Transfer = lazy(() => import('./pages/Transfer'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Cookies = lazy(() => import('./pages/Cookies'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const SuspensionPolicy = lazy(() => import('./pages/SuspensionPolicy'));
const AcceptableUsePolicy = lazy(() => import('./pages/AcceptableUsePolicy'));
const CommunityStandards = lazy(() => import('./pages/CommunityStandards'));
const SecurityPolicy = lazy(() => import('./pages/SecurityPolicy'));
const DomainTransferPolicy = lazy(() => import('./pages/DomainTransferPolicy'));
const UserContentPolicy = lazy(() => import('./pages/UserContentPolicy'));
const CopyrightNotice = lazy(() => import('./pages/CopyrightNotice'));
const LegalCompliance = lazy(() => import('./pages/LegalCompliance'));
const DataProcessingAddendum = lazy(() => import('./pages/DataProcessingAddendum'));
const AccessibilityPolicy = lazy(() => import('./pages/AccessibilityPolicy'));
const DeletionPolicy = lazy(() => import('./pages/DeletionPolicy'));
const DataRequestPolicy = lazy(() => import('./pages/DataRequestPolicy'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Success = lazy(() => import('./pages/Success'));
const Failure = lazy(() => import('./pages/Failure'));
const Orders = lazy(() => import('./pages/Orders'));
const PayPalReturn = lazy(() => import('./pages/PayPalReturn'));
const PayPalCancel = lazy(() => import('./pages/PayPalCancel'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminResellers = lazy(() => import('./pages/AdminResellers'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminLogs = lazy(() => import('./pages/AdminLogs'));
const AdminChatbot = lazy(() => import('./pages/AdminChatbot'));
const DomainDetails = lazy(() => import('./pages/DomainDetails'));
const PanelDashboard = lazy(() => import('./pages/PanelDashboard'));
const Billing = lazy(() => import('./pages/Billing'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const DomainsPageNew = lazy(() => import('./pages/DomainsPage'));
const Support = lazy(() => import('./pages/Support'));
const SupportNew = lazy(() => import('./pages/SupportNew'));
const SupportArticle = lazy(() => import('./pages/SupportArticle'));
const OpenTicket = lazy(() => import('./pages/OpenTicket'));
const DNSManagement = lazy(() => import('./pages/DNSManagement'));
const ResellerDashboard = lazy(() => import('./pages/ResellerDashboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const AdminSuggestions = lazy(() => import('./pages/AdminSuggestions'));
const AdminReservedKeywords = lazy(() => import('./pages/AdminReservedKeywords'));
const AdminProtectedBrands = lazy(() => import('./pages/AdminProtectedBrands'));
const AdminLinkModeration = lazy(() => import('./pages/AdminLinkModeration'));
const DiagnosticTest = lazy(() => import('./pages/DiagnosticTest'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const ProfileManager = lazy(() => import('./pages/ProfileManager'));
const AdminProfiles = lazy(() => import('./pages/AdminProfiles'));
const AffiliateTerms = lazy(() => import('./pages/AffiliateTerms'));
const AffiliateAbout = lazy(() => import('./pages/AffiliateAbout'));
const AffiliateDashboard = lazy(() => import('./pages/AffiliateDashboard'));
const TwoFactorSetup = lazy(() => import('./pages/TwoFactorSetup'));
const DomainSlugPage = lazy(() => import('./pages/DomainSlugPage'));
const DomainTransfer = lazy(() => import('./pages/DomainTransfer'));
const SocialFeed = lazy(() => import('./pages/SocialFeed'));
const MyProfile = lazy(() => import('./pages/MyProfile'));
const ProfilePreview = lazy(() => import('./pages/ProfilePreview'));
const SavedPosts = lazy(() => import('./pages/SavedPosts'));
const AdminSocialModeration = lazy(() => import('./pages/AdminSocialModeration'));
const PublicStore = lazy(() => import('./pages/PublicStore'));
const StoreManager = lazy(() => import('./pages/StoreManager'));
const RefRedirect = lazy(() => import('./pages/RefRedirect'));
const StoreTerms = lazy(() => import('./pages/StoreTerms'));
const SocialTerms = lazy(() => import('./pages/SocialTerms'));
const RichClub = lazy(() => import('./pages/RichClub'));
const AdminEmail = lazy(() => import('./pages/AdminEmail'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto"></div>
      <p className="mt-4 text-white font-semibold">Carregando...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <DrawerProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DrawerProvider>
    </AuthProvider>
  );
}

// Separate component to handle routes with conditional layout
function AppRoutes() {
  const location = useLocation();
  const pathname = location.pathname;

  // Don't show Header/Footer on panel pages, dashboard, and public profiles
  // Define known public routes that should show Header/Footer
  const publicRoutes = [
    '/', '/pt', '/en', '/es', '/valores', '/transferencia', '/contato', '/contact',
    '/termos', '/politica', '/cookies', '/faq', '/premium', '/club',
    '/suporte', '/checkout', '/sucesso', '/falha',
    '/paypal/return', '/paypal/cancel', '/diagnostic',
    '/login', '/register', '/politica-reembolso', '/politica-suspensao',
    '/politica-uso-aceitavel', '/politica-padroes-comunidade',
    '/politica-seguranca', '/politica-transferencia-dominio',
    '/politica-conteudo-usuario', '/aviso-direitos-autorais',
    '/conformidade-legal', '/adendo-processamento-dados',
    '/politica-acessibilidade', '/politica-exclusao', '/politica-solicitacao-dados'
  ];

  // Check if path starts with known public route prefixes
  const isKnownPublicRoute = publicRoutes.includes(pathname) ||
                              pathname.startsWith('/afiliados/') ||
                              pathname.startsWith('/suporte/');

  // Only match public profile/domain slug if it's a simple path not in known routes
  const isDynamicRoute = !isKnownPublicRoute && pathname.match(/^\/[a-zA-Z0-9_-]+$/);

  const hideLayout = pathname.startsWith('/panel/') ||
                     pathname.startsWith('/admin/') ||
                     pathname === '/app' ||
                     pathname === '/dashboard' ||
                     pathname === '/app/dashboard' ||
                     pathname === '/meu-perfil' ||
                     pathname === '/minha-pagina' ||
                     pathname === '/salvos' ||
                     pathname.startsWith('/social') ||
                     pathname.includes('/loja') ||
                     isDynamicRoute;

  return (
    <>
      {!hideLayout && <Header />}
      <main className={hideLayout ? '' : 'flex-1'}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/pt" element={<Home />} />
          <Route path="/en" element={<Home />} />
          <Route path="/es" element={<Home />} />
          <Route path="/valores" element={<Pricing />} />
          <Route path="/transferencia" element={<Transfer />} />
          <Route path="/contato" element={<Contact />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/politica" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/afiliados/termos" element={<AffiliateTerms />} />
          <Route path="/afiliados/sobre" element={<AffiliateAbout />} />
          <Route path="/afiliados" element={
            <ProtectedRoute>
              <AffiliateDashboard />
            </ProtectedRoute>
          } />
          <Route path="/politica-reembolso" element={<RefundPolicy />} />
          <Route path="/politica-suspensao" element={<SuspensionPolicy />} />
          <Route path="/politica-uso-aceitavel" element={<AcceptableUsePolicy />} />
          <Route path="/politica-padroes-comunidade" element={<CommunityStandards />} />
          <Route path="/politica-seguranca" element={<SecurityPolicy />} />
          <Route path="/politica-transferencia-dominio" element={<DomainTransferPolicy />} />
          <Route path="/politica-conteudo-usuario" element={<UserContentPolicy />} />
          <Route path="/aviso-direitos-autorais" element={<CopyrightNotice />} />
          <Route path="/conformidade-legal" element={<LegalCompliance />} />
          <Route path="/adendo-processamento-dados" element={<DataProcessingAddendum />} />
          <Route path="/politica-acessibilidade" element={<AccessibilityPolicy />} />
          <Route path="/politica-exclusao" element={<DeletionPolicy />} />
          <Route path="/politica-solicitacao-dados" element={<DataRequestPolicy />} />
          <Route path="/policies/store-terms" element={<StoreTerms />} />
          <Route path="/policies/social-terms" element={<SocialTerms />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/premium" element={<Marketplace />} />
          <Route path="/club" element={<RichClub />} />
          <Route path="/suporte" element={<SupportNew />} />
          <Route path="/suporte/abrir-chamado" element={<OpenTicket />} />
          <Route path="/suporte/:slug" element={<SupportArticle />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/sucesso" element={<Success />} />
          <Route path="/falha" element={<Failure />} />
          <Route path="/paypal/return" element={<PayPalReturn />} />
          <Route path="/paypal/cancel" element={<PayPalCancel />} />

          {/* Diagnostic Route */}
          <Route path="/diagnostic" element={<DiagnosticTest />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/iniciar" element={<Register />} />

          {/* Affiliate Redirect Route */}
          <Route path="/r/:code" element={<RefRedirect />} />

          {/* Social Network Routes */}
          <Route path="/social" element={<SocialFeed />} />
          <Route path="/salvos" element={<SavedPosts />} />
          <Route path="/social/:subdomain" element={<SocialFeed />} />
          <Route path="/meu-perfil" element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          } />
          <Route path="/minha-pagina" element={
            <ProtectedRoute>
              <ProfilePreview />
            </ProtectedRoute>
          } />

          {/* Protected User Routes - Unified Dashboard */}
          <Route path="/app" element={
            <ProtectedRoute>
              <SubscriptionProtectedRoute>
                <UserDashboard />
              </SubscriptionProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <SubscriptionProtectedRoute>
                <UserDashboard />
              </SubscriptionProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/app/dashboard" element={
            <ProtectedRoute>
              <SubscriptionProtectedRoute>
                <UserDashboard />
              </SubscriptionProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/app/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/app/orders/:orderId" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/app/support" element={<Contact />} />

          {/* New Panel Routes */}
          <Route path="/panel/dashboard" element={
            <ProtectedRoute>
              <PanelDashboard />
            </ProtectedRoute>
          } />
          <Route path="/panel/billing" element={
            <ProtectedRoute>
              <SubscriptionProtectedRoute>
                <Billing />
              </SubscriptionProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/panel/settings" element={
            <ProtectedRoute>
              <SubscriptionProtectedRoute>
                <AccountSettings />
              </SubscriptionProtectedRoute>
            </ProtectedRoute>
          } />
          <Route path="/panel/settings/2fa" element={
            <ProtectedRoute>
              <TwoFactorSetup />
            </ProtectedRoute>
          } />
          <Route path="/panel/domains" element={
            <ProtectedRoute>
              <DomainsPageNew />
            </ProtectedRoute>
          } />
          <Route path="/panel/domains/:id" element={
            <ProtectedRoute>
              <DomainDetails />
            </ProtectedRoute>
          } />
          <Route path="/panel/domains/:id/transfer" element={
            <ProtectedRoute>
              <DomainTransfer />
            </ProtectedRoute>
          } />
          <Route path="/panel/dns" element={
            <ProtectedRoute>
              <DNSManagement />
            </ProtectedRoute>
          } />
          <Route path="/panel/revendedor" element={
            <ResellerProtectedRoute>
              <ResellerDashboard />
            </ResellerProtectedRoute>
          } />
          <Route path="/panel/support" element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } />
          <Route path="/panel/profile" element={
            <ProtectedRoute>
              <ProfileManager />
            </ProtectedRoute>
          } />
          <Route path="/panel/profile/:domainId" element={
            <ProtectedRoute>
              <ProfileManager />
            </ProtectedRoute>
          } />

          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/domains" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute adminOnly>
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute adminOnly>
              <AdminSettings />
            </ProtectedRoute>
          } />
          <Route path="/admin/revendedores" element={
            <ProtectedRoute adminOnly>
              <AdminResellers />
            </ProtectedRoute>
          } />
          <Route path="/admin/suggestions" element={
            <ProtectedRoute adminOnly>
              <AdminSuggestions />
            </ProtectedRoute>
          } />
          <Route path="/admin/sugestoes" element={
            <ProtectedRoute adminOnly>
              <AdminSuggestions />
            </ProtectedRoute>
          } />
          <Route path="/admin/reserved-keywords" element={
            <ProtectedRoute adminOnly>
              <AdminReservedKeywords />
            </ProtectedRoute>
          } />
          <Route path="/admin/protected-brands" element={
            <ProtectedRoute adminOnly>
              <AdminProtectedBrands />
            </ProtectedRoute>
          } />
          <Route path="/admin/link-moderation" element={
            <ProtectedRoute adminOnly>
              <AdminLinkModeration />
            </ProtectedRoute>
          } />
          <Route path="/admin/social-moderation" element={
            <ProtectedRoute adminOnly>
              <AdminSocialModeration />
            </ProtectedRoute>
          } />
          <Route path="/admin/profiles" element={
            <ProtectedRoute adminOnly>
              <AdminProfiles />
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute adminOnly>
              <AdminLogs />
            </ProtectedRoute>
          } />
          <Route path="/admin/chatbot" element={
            <ProtectedRoute adminOnly>
              <AdminChatbot />
            </ProtectedRoute>
          } />
          <Route path="/admin/email" element={
            <ProtectedRoute adminOnly>
              <AdminEmail />
            </ProtectedRoute>
          } />

          {/* Store Routes */}
          <Route path="/panel/loja" element={
            <ProtectedRoute>
              <StoreManager />
            </ProtectedRoute>
          } />
          <Route path="/:subdomain/loja" element={<PublicStore />} />

          {/* Dynamic Route (Domain Slug or Public Profile) - Must be last to catch all */}
          <Route path="/:slug" element={<DomainSlugPage />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
      {(pathname === '/suporte' || pathname.startsWith('/suporte/')) && <ChatWidget />}
    </>
  );
}

export default App;