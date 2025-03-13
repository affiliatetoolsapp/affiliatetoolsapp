
import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart3, 
  Home, 
  User, 
  Settings, 
  DollarSign, 
  Wallet, 
  Box, 
  Users, 
  Link as LinkIcon,
  Store,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Tag
} from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  if (!user) return null;

  const commonLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', href: '/profile', icon: User },
  ];
  
  const adminLinks = [
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Offers', href: '/offers', icon: Box },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Payments', href: '/payments', icon: DollarSign },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
  
  const advertiserLinks = [
    { name: 'My Offers', href: '/offers', icon: Box },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Affiliates', href: '/partners', icon: Users },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Payments', href: '/payments', icon: DollarSign },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
  
  const affiliateLinks = [
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'My Offers', href: '/offers', icon: Tag },
    { name: 'Tracking Links', href: '/links', icon: LinkIcon },
    { name: 'Performance', href: '/performance', icon: TrendingUp },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Earnings', href: '/earnings', icon: BarChart3 },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];
  
  let roleSpecificLinks = [];
  
  if (user.role === 'admin') {
    roleSpecificLinks = adminLinks;
  } else if (user.role === 'advertiser') {
    roleSpecificLinks = advertiserLinks;
  } else if (user.role === 'affiliate') {
    roleSpecificLinks = affiliateLinks;
  }
  
  const allLinks = [...commonLinks, ...roleSpecificLinks];

  return (
    <div className={cn("bg-background flex flex-col h-full", className)} {...props}>
      <div className="py-4 px-6 border-b">
        <h2 className="text-lg font-bold">Affiliate Network</h2>
        <p className="text-sm text-muted-foreground capitalize">{user.role} Portal</p>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="flex flex-col gap-1 px-2">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(link.href)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <link.icon className="h-4 w-4" />
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
