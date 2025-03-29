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
  Tag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, isCollapsed = false, onToggle, ...props }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  if (!user) return null;

  const commonLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];
  
  const adminLinks = [
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Offers', href: '/admin/offers', icon: Box },
    { name: 'Marketplace', href: '/admin/marketplace', icon: Store },
    { name: 'Payments', href: '/admin/payments', icon: DollarSign },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
  ];
  
  const advertiserLinks = [
    { name: 'My Offers', href: '/offers', icon: Box },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Affiliates', href: '/partners', icon: Users },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Payments', href: '/payments', icon: DollarSign },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
  ];
  
  const affiliateLinks = [
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'My Offers', href: '/offers', icon: Tag },
    { name: 'Tracking Links', href: '/links', icon: LinkIcon },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Earnings', href: '/earnings', icon: BarChart3 },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
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
    <div className={cn(
      "bg-background flex flex-col h-full transition-all duration-300",
      isCollapsed ? "w-[70px]" : "w-56",
      className
    )} {...props}>
      <div className={cn(
        "sticky top-0 bg-background border-b z-20",
        isCollapsed ? "px-2" : "px-4"
      )}>
        <div className="flex items-center h-16">
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate">AffiliateTools</h2>
              <p className="text-sm text-muted-foreground capitalize truncate">{user.role} Portal</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "h-6 w-6 shrink-0",
              isCollapsed ? "mx-auto" : "ml-2"
            )}
          >
            <ChevronLeft className={cn("h-4 w-4", isCollapsed && "rotate-180")} />
          </Button>
        </div>
      </div>
      <div className="flex-1 py-4">
        <nav className="flex flex-col gap-1.5 px-3 sticky top-[4.5rem]">
          <TooltipProvider delayDuration={0}>
            {allLinks.map((link) => (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <link.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span>{link.name}</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    {link.name}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </div>
    </div>
  );
}
