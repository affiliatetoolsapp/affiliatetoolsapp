
import { Route } from 'react-router-dom';
import { lazy } from 'react';
import { AdminLayout } from '@/pages/admin/AdminLayout';

// Use dynamic imports for admin pages
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then(module => ({ default: module.DashboardPage || module.default || module })));
const OffersManagement = lazy(() => import('@/pages/admin/OffersManagement').then(module => ({ default: module.OffersManagement || module.default || module })));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then(module => ({ default: module.UsersPage || module.default || module })));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then(module => ({ default: module.SettingsPage || module.default || module })));
const AffiliatesPage = lazy(() => import('@/pages/admin/AffiliatesPage').then(module => ({ default: module.AffiliatesPage || module.default || module })));
const AdvertisersPage = lazy(() => import('@/pages/admin/AdvertisersPage').then(module => ({ default: module.AdminAdvertisersPage || module.AdvertisersPage || module.default || module })));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage').then(module => ({ default: module.ReportsPage || module.default || module })));
const PaymentsPage = lazy(() => import('@/pages/admin/PaymentsPage').then(module => ({ default: module.PaymentsPage || module.default || module })));
const DocumentsPage = lazy(() => import('@/pages/admin/DocumentsPage').then(module => ({ default: module.DocumentsPage || module.default || module })));
// For EditUserPage, we'll need to handle this differently or implement it
const EditUserPage = lazy(() => import('@/pages/admin/UsersPage').then(module => ({ default: module.EditUserPage || module.default || module })));
const OffersPage = lazy(() => import('@/pages/admin/OffersPage').then(module => ({ default: module.OffersPage || module.default || module })));

const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<DashboardPage />} />
    <Route path="dashboard" element={<DashboardPage />} />
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
