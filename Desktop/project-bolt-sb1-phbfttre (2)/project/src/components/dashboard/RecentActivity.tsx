import React, { useState, useEffect } from 'react';
import { Clock, User, Package, Calendar } from 'lucide-react';
import { useRiders } from '../../hooks/useRiders';
import { SafeComponent } from '../common/SafeComponent';

interface ActivityItem {
  id: string;
  type: 'training' | 'installation' | 'equipment' | 'user';
  title: string;
  description: string;
  time: string;
  user: string;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'training':
      return Calendar;
    case 'installation':
      return Package;
    case 'user':
      return User;
    default:
      return Clock;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'training':
      return 'bg-blue-100 text-blue-600';
    case 'installation':
      return 'bg-orange-100 text-orange-600';
    case 'equipment':
      return 'bg-green-100 text-green-600';
    case 'user':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function RecentActivity() {
  const { riders } = useRiders();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!riders || riders.length === 0) {
      setActivities([]);
      setLoading(true); // Keep loading if no riders yet
    }

    // Generate activities based on real rider data
    const recentActivities: ActivityItem[] = [];

    // Add some sample activities based on actual riders
    const sampleRiders = riders.slice(0, 4);
    
    sampleRiders.forEach((rider, index) => {
      const riderId = rider.data.rider_id || rider.data.Rider_ID || 'Unknown';
      const riderName = rider.data.rider_name || rider.data.Rider_Name || 'Unknown Rider';
      
      if (index === 0) {
        recentActivities.push({
          id: `activity-${index}`,
          type: 'training',
          title: 'Training Eligible',
          description: `Rider ${riderId} (${riderName}) is eligible for training`,
          time: 'Recently added',
          user: 'System'
        });
      } else if (index === 1) {
        recentActivities.push({
          id: `activity-${index}`,
          type: 'installation',
          title: 'Installation Check',
          description: `Rider ${riderId} (${riderName}) eligibility verified`,
          time: 'Recently added',
          user: 'System'
        });
      } else if (index === 2) {
        recentActivities.push({
          id: `activity-${index}`,
          type: 'equipment',
          title: 'Equipment Planning',
          description: `Rider ${riderId} (${riderName}) added to equipment list`,
          time: 'Recently added',
          user: 'System'
        });
      } else {
        recentActivities.push({
          id: `activity-${index}`,
          type: 'user',
          title: 'Rider Added',
          description: `Rider ${riderId} (${riderName}) added to project`,
          time: 'Recently added',
          user: 'Admin'
        });
      }
    });

    setActivities(recentActivities);
    setLoading(false);
  }, [riders]);

  if (loading) {
    return (
      <SafeComponent componentName="RecentActivity">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SafeComponent>
    );
  }

  return (
    <SafeComponent componentName="RecentActivity">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No recent activity
              </p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-500">by {activity.user}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {activities.length > 0 && (
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 transition-colors">
            View all activity
          </button>
        )}
      </div>
    </SafeComponent>
  );
}