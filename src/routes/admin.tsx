
import { Route } from 'react-router-dom';
import { lazy } from 'react';

// Use dynamic imports to avoid issues with non-default exports
// Note: We're using path aliases for the imports that should work with proper setup
// If these paths are not working, they need to be configured in the build setup
const AdminLayout = lazy(() => import('@/components/layouts/AdminLayout').then(module => ({ default: module.AdminLayout })));
const Dashboard = lazy(() => import('@/pages/admin/DashboardPage').then(module => ({ default: module.DashboardPage })));
const OffersManagement = lazy(() => import('@/pages/admin/OffersManagement').then(module => ({ default: module.OffersManagement })));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then(module => ({ default: module.UsersPage })));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then(module => ({ default: module.SettingsPage })));
const AffiliatesPage = lazy(() => import('@/pages/admin/AffiliatesPage').then(module => ({ default: module.AffiliatesPage })));
const AdvertisersPage = lazy(() => import('@/pages/admin/AdvertisersPage').then(module => ({ default: module.AdvertisersPage })));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage').then(module => ({ default: module.ReportsPage })));
const PaymentsPage = lazy(() => import('@/pages/admin/PaymentsPage').then(module => ({ default: module.PaymentsPage })));
const DocumentsPage = lazy(() => import('@/pages/admin/DocumentsPage').then(module => ({ default: module.DocumentsPage })));
const EditUserPage = lazy(() => import('@/pages/admin/EditUserPage').then(module => ({ default: module.EditUserPage })));
const OffersPage = lazy(() => import('@/pages/admin/OffersPage').then(module => ({ default: module.OffersPage })));

const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="offers" element={<OffersManagement />} />
    <Route path="offers/:offerId" element={<OffersPage />} />
    <Route path="offers/:offerId/edit" element={<OffersPage />} />
    <Route path="offers/create" element={<OffersPage />} />
    <Route path="users" element={<UsersPage />} />
    <Route path="users/:userId" element={<EditUserPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="affiliates" element={<AffiliatesPage />} />
    <Route path="advertisers" element={<AdvertisersPage />} />
    <Route path="reports" element={<ReportsPage />} />
    <Route path="payments" element={<PaymentsPage />} />
    <Route path="documents" element={<DocumentsPage />} />
  </Route>
);

export default adminRoutes;
