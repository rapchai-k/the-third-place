import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  Package,
  Truck,
  FileText,
  Settings,
  Upload,
  Search,
  BarChart3,    
  Building,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SafeComponent } from '../common/SafeComponent';
import type { UserRole, UserPermission } from '../../lib/supabase';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: UserRole[];
  permissions?: UserPermission[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['super_admin', 'admin', 'training_person', 'equipment_person'] },
  { name: 'Riders', href: '/riders', icon: Users, roles: ['super_admin', 'admin'] },
  { name: 'Rider Data Upload', href: '/upload', icon: Upload, roles: ['super_admin', 'admin'] },
  { name: 'Training', href: '/training', icon: Calendar, permissions: ['training'], roles: ['super_admin', 'admin', 'training_person'] },
  { name: 'Box Installation', href: '/installation', icon: Truck, permissions: ['installation'], roles: ['super_admin', 'admin'] },
  { name: 'Collect Equipment', href: '/collect-equipment', icon: Package, permissions: ['equipment'], roles: ['super_admin', 'admin'] },
  { name: 'Equipment Stock', href: '/equipment-stock', icon: BarChart3, permissions: ['equipment'], roles: ['super_admin', 'admin'] },
  { name: 'Partners', href: '/partners', icon: Building, roles: ['super_admin', 'admin'] },
  { name: 'Vendors', href: '/vendors', icon: Truck, roles: ['super_admin', 'admin'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['super_admin', 'admin'] },
 // { name: 'Search', href: '/search', icon: Search, roles: ['super_admin', 'admin'] },
  { name: 'Users', href: '/users', icon: Settings, roles: ['super_admin', 'admin'] },
  //{ name: 'Audit Log', href: '/audit', icon: FileText, roles: ['super_admin', 'admin'] },
];

export function Sidebar() {
  const { user } = useAuth();

  const hasAccess = (item: NavItem): boolean => {
    if (!user) return false;
    // Vendors use vendor portal; no sidebar
    if (user.role === 'vendor') return false;
    const roleAllowed = item.roles ? item.roles.includes(user.role) : false;
    const permAllowed = item.permissions ? item.permissions.some(p => (user.permissions || []).includes(p)) : false;
    return roleAllowed || permAllowed;
  };

  const filteredNavigation = navigation.filter(hasAccess);

  return (
    <SafeComponent componentName="Sidebar">
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">RiderFlow</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors`}
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user?.first_name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SafeComponent>
  );
}