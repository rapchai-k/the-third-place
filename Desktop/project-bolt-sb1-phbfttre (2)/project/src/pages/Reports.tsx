import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Download, Calendar, Users, Package, Truck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DataTable } from '../components/common/DataTable';
import toast from 'react-hot-toast';

interface ReportStats {
  totalRiders: number;
  resignedRiders: number;
  trainingsCompleted: number;
  installationsPending: number;
  equipmentIssued: number;
  recentTrainings: number;
  recentInstallations: number;
}

export function Reports() {
  // auth kept available for future role-based gating (intentionally unused)
  useAuth();
  const [stats, setStats] = useState<ReportStats>({
    totalRiders: 0,
    resignedRiders: 0,
    trainingsCompleted: 0,
    installationsPending: 0,
    equipmentIssued: 0,
    recentTrainings: 0,
    recentInstallations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [ridersRaw, setRidersRaw] = useState<any[]>([]);
  const [managerOptions, setManagerOptions] = useState<string[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [statusBreakdown, setStatusBreakdown] = useState({
    training: { Eligible: 0, Scheduled: 0, Completed: 0, 'Not Eligible': 0 },
    installation: { Eligible: 0, Scheduled: 0, Completed: 0, 'Not Eligible': 0 },
    equipment: { Eligible: 0, Scheduled: 0, Completed: 0, 'Not Eligible': 0 },
  });
  const [trends, setTrends] = useState<{ training: Array<{ date: string; count: number }>; installation: Array<{ date: string; count: number }>; equipment: Array<{ date: string; count: number }>; }>({
    training: [],
    installation: [],
    equipment: [],
  });
  const [dimensions, setDimensions] = useState({ trainingMax: 0, installationMax: 0, equipmentMax: 0 });

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedManager]);

  const fetchAllRiders = async (): Promise<{ rows: any[]; total: number }> => {
    // Get total count
    const { count, error: countError } = await supabase
      .from('riders')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;

    const pageSize = 1000;
    const total = count || 0;
    const pages = Math.ceil(total / pageSize) || 1;
    const all: any[] = [];
    for (let i = 0; i < pages; i++) {
      const start = i * pageSize;
      const end = start + pageSize - 1;
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(start, end);
      if (error) throw error;
      if (data && data.length) all.push(...data);
    }
    return { rows: all, total };
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch all riders with pagination (avoids 1000 row cap)
      const { rows: riders, total: totalRiders } = await fetchAllRiders();

      // Fetch partners for manager mapping (active only)
      const { data: partnersData } = await supabase
        .from('partners')
        .select('partner_id, manager_mis_ids, is_active')
        .eq('is_active', true);
      const partnerIdToManager = new Map<string, string>();
      (partnersData || []).forEach((p: any) => {
        if (p.partner_id) partnerIdToManager.set(String(p.partner_id), String(p.manager_mis_ids || ''));
      });

      // Build manager options from full dataset (normalize multiple formats)
      const mgrSet = new Set<string>();
      const addManagersFrom = (raw: any) => {
        if (!raw) return;
        const val = String(raw).trim();
        if (!val) return;
        // split if comma/pipe separated
        val.split(/[,|]/).map(s => s.trim()).filter(Boolean).forEach(v => mgrSet.add(v));
      };
      riders.forEach(r => {
        addManagersFrom(r.data?.manager_mis_ids);
        addManagersFrom(r.data?.manager_id);
        addManagersFrom(r.data?.manager);
        // also add partner manager if available
        const pm = partnerIdToManager.get(String(r.data?.partner_id || ''));
        addManagersFrom(pm);
      });
      setManagerOptions(Array.from(mgrSet).sort());

      // Apply manager filter for displayed/aggregated dataset
      const filteredByManager = selectedManager
        ? riders.filter(r => {
            const riderRaw = [r.data?.manager_mis_ids, r.data?.manager_id, r.data?.manager]
              .map(v => String(v || '').trim())
              .filter(Boolean)
              .join(',');
            const riderManagers = riderRaw.split(/[,|]/).map(s => s.trim()).filter(Boolean);
            const partnerManagerRaw = partnerIdToManager.get(String(r.data?.partner_id || '')) || '';
            const partnerManagers = partnerManagerRaw.split(/[,|]/).map(s => s.trim()).filter(Boolean);
            return [...riderManagers, ...partnerManagers].includes(selectedManager);
          })
        : riders;
      setRidersRaw(filteredByManager);
      // Count resigned riders (respect manager filter)
      const resignedRiders = filteredByManager.filter(r => String(r.data?.job_status || '').toLowerCase().startsWith('resign')).length;


      // Count completed trainings
      const trainingsCompleted = filteredByManager.filter(rider => 
        String(rider.data?.training_status || '').toLowerCase() === 'completed'
      ).length;

      // Count pending installations
      const installationsPending = filteredByManager.filter(rider => 
        String(rider.data?.box_installation || '').toLowerCase() === 'scheduled'
      ).length;

      // Count equipment issued
      const equipmentIssued = filteredByManager.filter(rider => 
        String(rider.data?.equipment_status || '').toLowerCase() === 'completed'
      ).length;

      // Helper to check range
      const inRange = (d?: string) => {
        if (!d) return false;
        const date = new Date(d).toISOString().split('T')[0];
        return date >= dateRange.from && date <= dateRange.to;
      };

      // Count recent trainings (within date range)
      const recentTrainings = filteredByManager.filter(rider => {
        return inRange(rider.data?.training_scheduled_date);
      }).length;

      // Count recent installations (within date range)
      const recentInstallations = filteredByManager.filter(rider => {
        return inRange(rider.data?.installation_scheduled_date);
      }).length;

      setStats({
        totalRiders: filteredByManager.length,
        resignedRiders,
        trainingsCompleted,
        installationsPending,
        equipmentIssued,
        recentTrainings,
        recentInstallations,
      });

      // Status breakdowns
      const counts = {
        training: { Eligible: 0, Scheduled: 0, Completed: 0, 'Not Eligible': 0 },
        installation: { Eligible: 0, Scheduled: 0, Completed: 0, 'Not Eligible': 0 },
        equipment: { Eligible: 0, Scheduled: 0, Completed: 0, 'Not Eligible': 0 },
      } as any;
      filteredByManager.forEach(r => {
        const t = String(r.data?.training_status || '').trim();
        const i = String(r.data?.box_installation || '').trim();
        const e = String(r.data?.equipment_status || '').trim();
        if (counts.training[t] !== undefined) counts.training[t]++;
        if (counts.installation[i] !== undefined) counts.installation[i]++;
        if (counts.equipment[e] !== undefined) counts.equipment[e]++;
      });
      setStatusBreakdown(counts);

      // Trends within range (daily buckets)
      const bucket = (field: string) => {
        const map = new Map<string, number>();
        riders.forEach(r => {
          const d = r.data?.[field];
          if (!inRange(d)) return;
          const k = new Date(d).toISOString().split('T')[0];
          map.set(k, (map.get(k) || 0) + 1);
        });
        const entries = Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
        const max = entries.reduce((m, x) => Math.max(m, x.count), 0);
        return { entries, max };
      };

      const t = bucket('training_scheduled_date');
      const ins = bucket('installation_scheduled_date');
      const eq = bucket('equipment_completion_date');
      setTrends({ training: t.entries, installation: ins.entries, equipment: eq.entries });
      setDimensions({ trainingMax: t.max, installationMax: ins.max, equipmentMax: eq.max });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    try {
      const { rows: ridersData } = await fetchAllRiders();
      
      let data: any[];
      let filename;

      switch (type) {
        case 'riders':
          data = ridersData;
          filename = 'riders_export.csv';
          break;
        case 'trainings':
          data = ridersData
            .filter(rider => rider.data?.training_status)
            .map(rider => ({
              rider_id: rider.rider_id,
              first_name: rider.data?.first_name || '',
              last_name: rider.data?.last_name || '',
              training_status: rider.data?.training_status || '',
              training_scheduled_date: rider.data?.training_scheduled_date || '',
              training_scheduled_time: rider.data?.training_scheduled_time || '',
              training_location: rider.data?.training_location || '',
              training_completed_date: rider.data?.training_completed_date || '',
              training_completed_by: rider.data?.training_completed_by || '',
              training_scheduled_by: rider.data?.training_scheduled_by || '',
              last_updated_by: rider.data?.last_updated_by || '',
              last_updated_at: rider.data?.last_updated_at || rider.updated_at || ''
            }))
            .filter(row => {
              // apply dateRange on scheduled date
              const d = row.training_scheduled_date;
              if (!d) return false;
              const date = new Date(d).toISOString().split('T')[0];
              return date >= dateRange.from && date <= dateRange.to;
            });
          filename = 'trainings_export.csv';
          break;
        case 'installations':
          data = ridersData
            .filter(rider => rider.data?.box_installation)
            .map(rider => ({
              rider_id: rider.rider_id,
              first_name: rider.data?.first_name || '',
              last_name: rider.data?.last_name || '',
              installation_status: rider.data?.box_installation || '',
              installation_scheduled_date: rider.data?.installation_scheduled_date || '',
              installation_scheduled_time: rider.data?.installation_scheduled_time || '',
              installation_location: rider.data?.installation_location || '',
              installation_completed_date: rider.data?.installation_completed_date || '',
              installation_completed_by: rider.data?.installation_completed_by || '',
              installation_scheduled_by: rider.data?.installation_scheduled_by || '',
              installation_vendor_id: rider.data?.installation_vendor_id || '',
              installation_vendor_name: rider.data?.installation_vendor_name || '',
              installation_vendor_email: rider.data?.installation_vendor_email || '',
              last_updated_by: rider.data?.last_updated_by || '',
              last_updated_at: rider.data?.last_updated_at || rider.updated_at || ''
            }))
            .filter(row => {
              const d = row.installation_scheduled_date;
              if (!d) return false;
              const date = new Date(d).toISOString().split('T')[0];
              return date >= dateRange.from && date <= dateRange.to;
            });
          filename = 'installations_export.csv';
          break;
        case 'equipment':
          data = ridersData
            .filter(rider => rider.data?.equipment_status)
            .map(rider => ({
              rider_id: rider.rider_id,
              first_name: rider.data?.first_name || '',
              last_name: rider.data?.last_name || '',
              equipment_status: rider.data?.equipment_status || '',
              equipment_scheduled_date: rider.data?.equipment_scheduled_date || '',
              equipment_scheduled_time: rider.data?.equipment_scheduled_time || '',
              equipment_location: rider.data?.equipment_location || '',
              equipment_completed_date: rider.data?.equipment_completion_date || rider.data?.equipment_completed_date || '',
              equipment_completed_by: rider.data?.equipment_distributed_by || rider.data?.equipment_completed_by || '',
              equipment_total_items: rider.data?.equipment_total_items || 0,
              equipment_scheduled_by: rider.data?.equipment_scheduled_by || '',
              last_updated_by: rider.data?.last_updated_by || '',
              last_updated_at: rider.data?.last_updated_at || rider.updated_at || ''
            }))
            .filter(row => {
              const d = row.equipment_completed_date || row.equipment_scheduled_date;
              if (!d) return false;
              const date = new Date(d).toISOString().split('T')[0];
              return date >= dateRange.from && date <= dateRange.to;
            });
          filename = 'equipment_export.csv';
          break;
        default:
          return;
      }

      if (data) {
        const csv = convertToCSV(data);
        downloadCSV(csv, filename);
        toast.success(`${type} data exported successfully`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).replace(/"/g, '""');
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const statCards = [
    {
      title: 'Total Riders',
      value: stats.totalRiders,
      icon: Users,
      color: 'bg-blue-500',
      exportType: 'riders',
    },
    {
      title: 'Resigned Riders',
      value: stats.resignedRiders,
      icon: Users,
      color: 'bg-gray-600',
      exportType: 'riders',
    },
    {
      title: 'Trainings Completed',
      value: stats.trainingsCompleted,
      icon: BarChart3,
      color: 'bg-green-500',
      exportType: 'trainings',
    },
    {
      title: 'Installations Pending',
      value: stats.installationsPending,
      icon: Truck,
      color: 'bg-orange-500',
      exportType: 'installations',
    },
    {
      title: 'Equipment Issued',
      value: stats.equipmentIssued,
      icon: Package,
      color: 'bg-purple-500',
      exportType: 'equipment',
    },
  ];

  // Riders table data (dynamic)
  const ridersTableData = useMemo(() => {
    return (ridersRaw || []).map(r => ({
      rider_id: r.rider_id,
      rider_name: r.data?.rider_name || '',
      mobile: r.data?.mobile || '',
      nationality_code: r.data?.nationality_code || '',
      delivery_type: r.data?.delivery_type || '',
      training_status: r.data?.training_status || '',
      training_date: r.data?.training_scheduled_date || '',
      installation_status: r.data?.box_installation || '',
      installation_date: r.data?.installation_scheduled_date || '',
      equipment_status: r.data?.equipment_status || '',
      equipment_date: r.data?.equipment_completion_date || r.data?.equipment_scheduled_date || '',
      updated_at: r.updated_at,
    }));
  }, [ridersRaw]);

  const exportVisibleRiders = () => {
    if (!ridersTableData.length) return;
    const headers = Object.keys(ridersTableData[0]);
    const csv = [
      headers.join(','),
      ...ridersTableData.map(row => headers.map(h => `"${String((row as any)[h] ?? '').replace(/"/g,'""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'riders_report.csv';
    link.click();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">View system statistics and export data</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>
          <div>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">All Managers</option>
              {managerOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => exportData(card.exportType)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Data</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {(['training','installation','equipment'] as const).map((key) => {
          const b: any = statusBreakdown[key];
          const total = Object.values(b).reduce((s: number, n: any) => s + (Number(n) || 0), 0) || 1;
          const items = [
            { label: 'Completed', value: b['Completed'], color: 'bg-green-500' },
            { label: 'Scheduled', value: b['Scheduled'], color: 'bg-yellow-500' },
            { label: 'Eligible', value: b['Eligible'], color: 'bg-blue-500' },
            { label: 'Not Eligible', value: b['Not Eligible'], color: 'bg-gray-400' },
          ];
          return (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{key} Status</h3>
              <div className="space-y-3">
                {items.map(it => (
                  <div key={it.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-gray-700">
                      <span>{it.label}</span>
                      <span className="font-medium">{it.value} ({Math.round((it.value/total)*100)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded">
                      <div className={`${it.color} h-2 rounded`} style={{ width: `${Math.max(2, Math.round((it.value/total)*100))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trends (last 3 months default) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {([
          { key: 'training' as const, title: 'Training Scheduled Trend', max: dimensions.trainingMax },
          { key: 'installation' as const, title: 'Installation Scheduled Trend', max: dimensions.installationMax },
          { key: 'equipment' as const, title: 'Equipment Completed Trend', max: dimensions.equipmentMax },
        ]).map(cfg => (
          <div key={cfg.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{cfg.title}</h3>
            <div className="h-32 flex items-end space-x-1">
              {(trends as any)[cfg.key].length === 0 && (
                <div className="text-sm text-gray-500">No data in range</div>
              )}
              {(trends as any)[cfg.key].map((p: any) => (
                <div key={p.date} className="bg-blue-500 hover:bg-blue-600 transition-colors" title={`${p.date}: ${p.count}`}
                  style={{ height: cfg.max ? `${Math.max(4, Math.round((p.count/cfg.max)*100))}%` : '4%', width: '6px' }} />
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">Range: {dateRange.from} to {dateRange.to}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Trainings (Last 30 days)</span>
              </div>
              <span className="text-lg font-semibold text-blue-600">{stats.recentTrainings}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Installations (Last 30 days)</span>
              </div>
              <span className="text-lg font-semibold text-orange-600">{stats.recentInstallations}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Export</h3>
          <div className="space-y-3">
            <button
              onClick={() => exportData('riders')}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Export All Riders</span>
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => exportData('trainings')}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Export Training Data</span>
              <Download className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => exportData('installations')}
              className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Export Installation Data</span>
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* All Riders Dynamic Report */}
      <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Riders Report</h2>
            <p className="text-gray-600 text-sm">Default range last 3 months. Use the calendar to change and export.</p>
          </div>
          <button onClick={exportVisibleRiders} className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700">
            <Download className="w-4 h-4" />
            <span>Export Table</span>
          </button>
        </div>
        <div className="p-6">
          <DataTable
            columns={[
              { key: 'rider_id', label: 'Rider ID', sortable: true },
              { key: 'rider_name', label: 'Name', sortable: true },
              { key: 'mobile', label: 'Mobile', sortable: true },
              { key: 'nationality_code', label: 'Nationality', sortable: true },
              { key: 'delivery_type', label: 'Delivery', sortable: true },
              { key: 'training_status', label: 'Training', sortable: true },
              { key: 'training_date', label: 'Training Date', sortable: true },
              { key: 'installation_status', label: 'Installation', sortable: true },
              { key: 'installation_date', label: 'Installation Date', sortable: true },
              { key: 'equipment_status', label: 'Equipment', sortable: true },
              { key: 'equipment_date', label: 'Equipment Date', sortable: true },
              { key: 'updated_at', label: 'Updated', sortable: true },
            ]}
            data={ridersTableData}
            searchable
            pagination
            pageSize={50}
          />
        </div>
      </div>
    </div>
  );
}