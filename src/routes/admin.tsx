
import { Route } from 'react-router-dom';
import React from 'react';
import { AdminLayout } from '@/pages/admin/AdminLayout';

// Use direct imports instead of lazy loading for now, to fix the TypeScript errors
import DashboardPage from '@/pages/admin/DashboardPage';
import OffersManagement from '@/pages/admin/OffersManagement';
import UsersPage from '@/pages/admin/UsersPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import AffiliatesPage from '@/pages/admin/AffiliatesPage';
import { AdminAdvertisersPage } from '@/pages/admin/AdvertisersPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import PaymentsPage from '@/pages/admin/PaymentsPage';
import DocumentsPage from '@/pages/admin/DocumentsPage';
import { EditUserPage } from '@/pages/admin/UsersPage';
import OffersPage from '@/pages/admin/OffersPage';

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
    <Route path="advertisers" element={<AdminAdvertisersPage />} />
    <Route path="reports" element={<ReportsPage />} />
    <Route path="payments" element={<PaymentsPage />} />
    <Route path="documents" element={<DocumentsPage />} />
  </Route>
);

export default adminRoutes;
