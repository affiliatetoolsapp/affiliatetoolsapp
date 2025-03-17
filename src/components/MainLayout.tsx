
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, LogOut, Menu, Settings, ShieldAlert } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function MainLayout() {
  const { user, signOut } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  
  const userInitials = user?.contact_name 
    ? user.contact_name.split(' ').map(n => n[0]).join('')
    : user?.email?.slice(0, 2).toUpperCase();
  
  const isAdmin = user?.role === 'admin';
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block sticky top-0 h-screen">
        <Sidebar 
          className="h-screen border-r" 
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen max-w-[100%]">
        {/* Fixed Header */}
        <header className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-background z-40">
          <div className="flex items-center">
            {isAdmin && (
              <Badge variant="destructive" className="mr-2">
                <ShieldAlert className="h-3 w-3 mr-1" />
                Admin Mode
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.contact_name || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate('/admin')}>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/users')}>
                      <span className="ml-6">Users Management</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/offers')}>
                      <span className="ml-6">Offers Management</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/payments')}>
                      <span className="ml-6">Payments Management</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/activity')}>
                      <span className="ml-6">Activity Monitoring</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/settings')}>
                      <span className="ml-6">Platform Settings</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 w-full">
          <Outlet />
        </main>
        
        <footer className="border-t py-4 px-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Streamlined Affiliate Network
        </footer>
      </div>
    </div>
  );
}
