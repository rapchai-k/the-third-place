import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, Users, Calendar, MessageSquare, Settings } from 'lucide-react';

export const AdminNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      href: '/analytics',
      icon: BarChart3,
      label: 'Analytics',
      description: 'View user engagement and metrics'
    },
    {
      href: '/dashboard',
      icon: Users,
      label: 'Dashboard',
      description: 'User management and overview'
    },
    {
      href: '/events',
      icon: Calendar,
      label: 'Events',
      description: 'Manage community events'
    },
    {
      href: '/discussions',
      icon: MessageSquare,
      label: 'Discussions',
      description: 'Monitor community discussions'
    }
  ];

  return (
    <nav className="flex gap-1 p-1 bg-muted rounded-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            title={item.description}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};