
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
import EditOfferPage from '@/pages/EditOfferPage';
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
import './App.css';

// Create a client with latest React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      gcTime: 60 * 1000, // Using gcTime instead of deprecated cacheTime
      retry: 1,
    },
  },
});

function App() {
  console.log('App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <Theme accentColor="iris" radius="large" appearance={theme as 'light' | 'dark'}>
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
            {/* Add dedicated route for editing offers */}
            <Route path="offers/:id/edit" element={<EditOfferPage />} />
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
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </Theme>
  );
}

export default App;
