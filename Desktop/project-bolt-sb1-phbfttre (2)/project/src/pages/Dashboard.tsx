import React from 'react';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { QuickActions } from '../components/dashboard/QuickActions';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { SafeComponent } from '../components/common/SafeComponent';

export function Dashboard() {

  return (
    <SafeComponent componentName="Dashboard">
      <div className="p-6 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time analytics and insights for your rider management system
          </p>
        </div>

        <DashboardStats />
        
        <QuickActions />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Rider Analytics</h4>
                  <p className="text-gray-600 mb-4">
                    Comprehensive analytics for your unified rider database
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Training eligibility trends</p>
                    <p>• Installation completion rates</p>
                    <p>• Equipment distribution analytics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <RecentActivity />
          </div>
        </div>
      </div>
    </SafeComponent>
  );
}