
import { Route } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import Dashboard from '@/pages/admin/DashboardPage';
import { OffersManagement } from '@/components/admin/OffersManagement';
import UsersPage from '@/pages/admin/UsersPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import AffiliatesPage from '@/pages/admin/AffiliatesPage';
import AdvertisersPage from '@/pages/admin/AdvertisersPage';
import ReportsPage from '@/pages/admin/ReportsPage';
import PaymentsPage from '@/pages/admin/PaymentsPage';
import DocumentsPage from '@/pages/admin/DocumentsPage';
import EditUserPage from '@/pages/admin/EditUserPage';
import AdminOffersManagement from '@/pages/admin/OffersManagement';
import OffersPage from '@/pages/admin/OffersPage';

const adminRoutes = (
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="offers" element={<AdminOffersManagement />} />
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
