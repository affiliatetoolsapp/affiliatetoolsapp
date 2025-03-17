
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Theme } from '@radix-ui/themes';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { useTheme } from 'next-themes';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import SignupSuccessPage from '@/pages/SignupSuccessPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import ClickRedirectPage from '@/pages/ClickRedirectPage';
import LinkRedirectPage from '@/pages/LinkRedirectPage';
import OffersPage from '@/pages/OffersPage';
import ReportsPage from '@/pages/ReportsPage';
import PaymentsPage from '@/pages/PaymentsPage';
import LinksPage from '@/pages/LinksPage';
import MarketplacePage from '@/pages/MarketplacePage';
import WalletPage from '@/pages/WalletPage';
import PerformancePage from '@/pages/PerformancePage';
import EarningsPage from '@/pages/EarningsPage';
import PartnersPage from '@/pages/PartnersPage';
import SettingsPage from '@/pages/SettingsPage';
import Index from '@/pages/Index';
import { UserRole } from '@/types';

// Admin-specific pages
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminOffersPage from '@/pages/admin/AdminOffersPage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminActivityPage from '@/pages/admin/AdminActivityPage';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <Theme accentColor="iris" radius="large" appearance={theme as 'light' | 'dark'}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup-success" element={<SignupSuccessPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Redirect Routes */}
            <Route path="/r/:trackingCode" element={<LinkRedirectPage />} />
            <Route path="/click/:trackingCode" element={<ClickRedirectPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              
              {/* Common routes */}
              <Route path="offers" element={<OffersPage />} />
              <Route path="offers/:id" element={<OffersPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="settings" element={<SettingsPage />} />
              
              {/* Affiliate-specific routes */}
              <Route path="marketplace" element={<MarketplacePage />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="earnings" element={<EarningsPage />} />
              
              {/* Advertiser-specific routes */}
              <Route path="partners" element={<PartnersPage />} />
              
              {/* Admin-specific routes - protected by role */}
              <Route 
                path="admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/offers" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminOffersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/payments" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPaymentsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/settings" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/activity" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminActivityPage />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </Theme>
  );
}

function App() {
  console.log('App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
