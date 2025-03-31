import { RouteObject, Outlet } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { UsersManagement } from '@/components/admin/UsersManagement';
import OffersManagement from '@/components/admin/OffersManagement';
import TrackingLinksManagement from '@/components/admin/TrackingLinksManagement';
import PostbacksManagement from '@/components/admin/PostbacksManagement';
import CreateOfferPage from '@/pages/admin/CreateOfferPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const adminRoute: RouteObject = {
  path: '/admin',
  element: (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <AdminDashboard />,
    },
    {
      path: 'users',
      element: <UsersManagement />,
    },
    {
      path: 'offers',
      element: <OffersManagement />,
    },
    {
      path: 'offers/create',
      element: <CreateOfferPage />,
    },
    {
      path: 'tracking',
      element: <TrackingLinksManagement />,
    },
    {
      path: 'postbacks',
      element: <PostbacksManagement />,
    },
  ],
}; 