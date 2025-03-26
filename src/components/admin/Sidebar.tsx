import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  CreditCard,
  FileText,
  Shield,
  Building2,
  UserCog,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Affiliates', href: '/admin/affiliates', icon: Users },
  { name: 'Advertisers', href: '/admin/advertisers', icon: Building2 },
  { name: 'Offers', href: '/admin/offers', icon: ShoppingCart },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Documents', href: '/admin/documents', icon: FileText },
  { name: 'Users', href: '/admin/users', icon: UserCog },
  { name: 'Security', href: '/admin/security', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 min-h-screen bg-card border-r">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 