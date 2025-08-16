import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Upload, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SafeComponent } from '../common/SafeComponent';

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
}

function QuickActionCard({ title, description, href, icon: Icon, color }: QuickActionProps) {
  return (
    <Link
      to={href}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function QuickActions() {
  const { user } = useAuth();

  const getActionsForRole = () => {
    const baseActions = [
      {
        title: 'Search Riders',
        description: 'Find riders by ID or phone',
        href: '/search',
        icon: Search,
        color: 'bg-blue-500',
      },
    ];

    switch (user?.role) {
      case 'super_admin':
      case 'admin':
        return [
          ...baseActions,
          {
            title: 'Upload Rider Data',
            description: 'Import rider data files',
            href: '/upload',
            icon: Upload,
            color: 'bg-purple-500',
          },
          {
            title: 'Schedule Training',
            description: 'Create new training sessions',
            href: '/training',
            icon: Calendar,
            color: 'bg-green-500',
          },
          {
            title: 'Add User',
            description: 'Create new system users',
            href: '/users',
            icon: Plus,
            color: 'bg-orange-500',
          },
        ];
      case 'training_person':
        return [
          ...baseActions,
          {
            title: 'My Training Sessions',
            description: 'View assigned training sessions',
            href: '/training',
            icon: Calendar,
            color: 'bg-green-500',
          },
        ];
      case 'equipment_person':
        return [
          ...baseActions,
          {
            title: 'Equipment Distribution',
            description: 'Distribute equipment to riders',
            href: '/equipment',
            icon: Plus,
            color: 'bg-teal-500',
          },
        ];
      default:
        return baseActions;
    }
  };

  const actions = getActionsForRole();

  return (
    <SafeComponent componentName="QuickActions">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <SafeComponent key={action.title} componentName={`QuickActionCard-${action.title}`}>
              <QuickActionCard {...action} />
            </SafeComponent>
          ))}
        </div>
      </div>
    </SafeComponent>
  );
}