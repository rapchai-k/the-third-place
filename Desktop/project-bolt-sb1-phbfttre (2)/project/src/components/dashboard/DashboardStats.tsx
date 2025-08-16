import React, { useState, useEffect } from 'react';
import { Users, Calendar, Package, CheckCircle, Building, UserCheck, GraduationCap, Truck, ClipboardList } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SafeComponent } from '../common/SafeComponent';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          <p className="text-sm mt-2 text-gray-600">
            {subtitle}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalRiders: 0,
    resignedRiders: 0,
    trainingEligible: 0,
    trainingScheduled: 0,
    trainingCompleted: 0,
    installationEligible: 0,
    installationScheduled: 0,
    installationCompleted: 0,
    equipmentEligible: 0,
    equipmentScheduled: 0,
    equipmentCompleted: 0,
    totalActive: 0,
    openPartners: 0,
    totalVendors: 0,
    activeVendors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_dashboard_stats');
        if (error) throw error;
        const row = data && data[0];
        if (row) {
          setStats({
            totalRiders: Number(row.total_riders) || 0,
            resignedRiders: Number(row.resigned_riders) || 0,
            trainingEligible: Number(row.training_eligible) || 0,
            trainingScheduled: Number(row.training_scheduled) || 0,
            trainingCompleted: Number(row.training_completed) || 0,
            installationEligible: Number(row.installation_eligible) || 0,
            installationScheduled: Number(row.installation_scheduled) || 0,
            installationCompleted: Number(row.installation_completed) || 0,
            equipmentEligible: Number(row.equipment_eligible) || 0,
            equipmentScheduled: Number(row.equipment_scheduled) || 0,
            equipmentCompleted: Number(row.equipment_completed) || 0,
            totalActive: Number(row.total_active) || 0,
            openPartners: Number(row.open_partners) || 0,
            totalVendors: Number(row.total_vendors) || 0,
            activeVendors: Number(row.active_vendors) || 0,
          });
          return; // success via RPC
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        // Fallback when RPC is not yet deployed: do count-only REST queries
        await fetchCountsViaRestFallback();
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  // All computation moved to server-side RPC

  const fetchCountsViaRestFallback = async () => {
    try {
      const [{ data: openPartnersRows }, totalVendorsRes, activeVendorsRes] = await Promise.all([
        supabase.from('partners').select('partner_id,business_status').eq('business_status', 'Open'),
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
        supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const openPartnerIds: string[] = (openPartnersRows || [])
        .map((p: any) => p.partner_id)
        .filter(Boolean);

      const partnerFilter = (q: any) =>
        openPartnerIds.length > 0 ? q.in('data->>partner_id', openPartnerIds) : q;

      const countRiders = async (apply: (q: any) => any) => {
        let query: any = supabase.from('riders').select('id', { count: 'exact', head: true });
        query = apply(query);
        const { count } = await query;
        return Number(count || 0);
      };

      const [
          totalRiders,
          resignedRiders,
          trainingEligible,
          trainingScheduled,
          trainingCompleted,
          installationEligible,
          installationScheduled,
          installationCompleted,
          equipmentEligible,
          equipmentScheduled,
          equipmentCompleted,
        totalActiveSimple,
      ] = await Promise.all([
        countRiders(q => q),
        countRiders(q => q.ilike('data->>job_status', 'resign%')),
        countRiders(q => partnerFilter(q).ilike('data->>training_status', 'eligible')),
        countRiders(q => partnerFilter(q).ilike('data->>training_status', 'scheduled')),
        countRiders(q => partnerFilter(q).ilike('data->>training_status', 'completed')),
        countRiders(q => partnerFilter(q).ilike('data->>box_installation', 'eligible')),
        countRiders(q => partnerFilter(q).ilike('data->>box_installation', 'scheduled')),
        countRiders(q => partnerFilter(q).ilike('data->>box_installation', 'completed')),
        countRiders(q => partnerFilter(q).ilike('data->>equipment_status', 'eligible')),
        countRiders(q => partnerFilter(q).ilike('data->>equipment_status', 'scheduled')),
        countRiders(q => partnerFilter(q).ilike('data->>equipment_status', 'completed')),
        // Simplified "active" definition without complex ORs across multiple keys
        countRiders(q =>
          partnerFilter(q)
            .ilike('data->>audit_status', '%pass%')
            .ilike('data->>job_status', '%on%')
        ),
      ]);
        
        setStats(prev => ({ 
          ...prev,
        totalRiders,
        trainingEligible,
        trainingScheduled,
        trainingCompleted,
        installationEligible,
        installationScheduled,
        installationCompleted,
        equipmentEligible,
        equipmentScheduled,
        equipmentCompleted,
        totalActive: totalActiveSimple,
        resignedRiders,
        openPartners: openPartnerIds.length,
        totalVendors: Number(totalVendorsRes.count || 0),
        activeVendors: Number(activeVendorsRes.count || 0),
      }));
    } catch (fallbackErr) {
      console.error('Fallback count queries failed:', fallbackErr);
    }
  };

  const statsCards = [
    {
      title: 'Total Riders',
      value: stats.totalRiders.toString(),
      subtitle: 'total in database',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Resigned Riders',
      value: stats.resignedRiders.toString(),
      subtitle: 'current resigned status',
      icon: UserCheck,
      color: 'bg-gray-600',
    },
    {
      title: 'Training Eligible',
      value: stats.trainingEligible.toString(),
      subtitle: 'ready for training (Open partners)',
      icon: GraduationCap,
      color: 'bg-green-500',
    },
    {
      title: 'Training Scheduled',
      value: stats.trainingScheduled.toString(),
      subtitle: 'training sessions scheduled (Open partners)',
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      title: 'Training Completed',
      value: stats.trainingCompleted.toString(),
      subtitle: 'training sessions completed (Open partners)',
      icon: CheckCircle,
      color: 'bg-emerald-500',
    },
    {
      title: 'Installation Eligible',
      value: stats.installationEligible.toString(),
      subtitle: 'ready for installation (Open partners)',
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      title: 'Installation Scheduled',
      value: stats.installationScheduled.toString(),
      subtitle: 'installations scheduled (Open partners)',
      icon: Truck,
      color: 'bg-amber-500',
    },
    {
      title: 'Installation Completed',
      value: stats.installationCompleted.toString(),
      subtitle: 'installations completed (Open partners)',
      icon: CheckCircle,
      color: 'bg-teal-500',
    },
    {
      title: 'Equipment Eligible',
      value: stats.equipmentEligible.toString(),
      subtitle: 'ready for equipment (Open partners)',
      icon: ClipboardList,
      color: 'bg-purple-500',
    },
    {
      title: 'Equipment Scheduled',
      value: stats.equipmentScheduled.toString(),
      subtitle: 'equipment scheduled (Open partners)',
      icon: Calendar,
      color: 'bg-violet-500',
    },
    {
      title: 'Equipment Completed',
      value: stats.equipmentCompleted.toString(),
      subtitle: 'equipment distributed (Open partners)',
      icon: CheckCircle,
      color: 'bg-indigo-500',
    },
    {
      title: 'Open Partners',
      value: stats.openPartners.toString(),
      subtitle: 'active business partners',
      icon: Building,
      color: 'bg-blue-600',
    },
    {
      title: 'Active Vendors',
      value: stats.activeVendors.toString(),
      subtitle: `of ${stats.totalVendors} total vendors`,
      icon: Truck,
      color: 'bg-orange-600',
    },
    {
      title: 'Total Active Riders',
      value: stats.totalActive.toString(),
      subtitle: 'audit pass + on job (Open partners)',
      icon: UserCheck,
      color: 'bg-cyan-500',
    },
  ];


  return (
    <SafeComponent componentName="DashboardStats">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </SafeComponent>
  );
}