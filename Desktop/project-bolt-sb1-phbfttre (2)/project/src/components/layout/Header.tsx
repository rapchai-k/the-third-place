import React from 'react';
import { Bell, LogOut, User, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { SafeComponent } from '../common/SafeComponent';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <SafeComponent componentName="Header">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {user?.first_name}
            </h1>
            <p className="text-sm text-gray-600">Unified rider management system</p>
          </div>

          <div className="flex items-center space-x-6">
        

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </span>
              </div>

              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </SafeComponent>
  );
}