import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 