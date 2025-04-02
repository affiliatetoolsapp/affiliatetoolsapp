
import { Route } from 'react-router-dom';
import { lazy } from 'react';

// Use dynamic imports to avoid issues with non-default exports
const AdminLayout = lazy(() => import('@/components/layouts/AdminLayout'));
const Dashboard = lazy(() => import('@/pages/admin/DashboardPage'));
const OffersManagement = lazy(() => import('@/pages/admin/OffersManagement'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const AffiliatesPage = lazy(() => import('@/pages/admin/AffiliatesPage'));
const AdvertisersPage = lazy(() => import('@/pages/admin/AdvertisersPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const PaymentsPage = lazy(() => import('@/pages/admin/PaymentsPage'));
const DocumentsPage = lazy(() => import('@/pages/admin/DocumentsPage'));
const EditUserPage = lazy(() => import('@/pages/admin/EditUserPage'));
const OffersPage = lazy(() => import('@/pages/admin/OffersPage'));

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
