
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import SignupSuccessPage from '@/pages/SignupSuccessPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import ClickRedirectPage from '@/pages/ClickRedirectPage';
import OffersPage from '@/pages/OffersPage';
import ReportsPage from '@/pages/ReportsPage';
import { UserRole } from '@/types';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup-success" element={<SignupSuccessPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
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
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              
              {/* Main routes */}
              <Route path="offers" element={<OffersPage />} />
              <Route path="offers/:id" element={<OffersPage />} />
              <Route path="links" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="payments" element={<DashboardPage />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
