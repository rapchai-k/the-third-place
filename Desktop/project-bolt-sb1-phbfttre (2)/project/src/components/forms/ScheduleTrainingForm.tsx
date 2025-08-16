import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar, Clock, MapPin, User, Languages } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useProject } from '../../hooks/useProject';
import { useProjectData } from '../../hooks/useProjectSchema';
import toast from 'react-hot-toast';

interface ScheduleTrainingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TrainingFormData {
  rider_id: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  trainer_name: string;
  language: string;
  notes?: string;
}

export function ScheduleTrainingForm({ isOpen, onClose, onSuccess }: ScheduleTrainingFormProps) {
  const { user } = useAuth();
  const { selectedProject } = useProject();
  const { data: projectRiders } = useProjectData(selectedProject?.id || null, 'riders');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibleRiders, setEligibleRiders] = useState<any[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TrainingFormData>();

  useEffect(() => {
    if (isOpen) {
      fetchEligibleRiders();
    }
  }, [isOpen, projectRiders]);

  const fetchEligibleRiders = async () => {
    if (!selectedProject || !projectRiders.length) {
      setEligibleRiders([]);
      return;
    }

    try {
      console.log('=== TRAINING ELIGIBILITY DEBUG ===');
      console.log('Total project riders:', projectRiders.length);
      console.log('Sample rider data:', projectRiders[0]?.data);
      
      // Get all possible column names from the data
      const allColumns = new Set();
      projectRiders.forEach(rider => {
        Object.keys(rider.data).forEach(key => allColumns.add(key));
      });
      console.log('Available columns:', Array.from(allColumns));
      
      const eligible = projectRiders.filter(rider => {
        const data = rider.data;
        
        // Try multiple possible column names for audit status
        const auditStatus = data.audit_status || data.Audit_Status || data['Audit Status'] || 
                           data.audit_pass || data.Audit_Pass || data['Audit Pass'] ||
                           data.status || data.Status || '';
        
        // Try multiple possible column names for job status  
        const jobStatus = data.job_status || data.Job_Status || data['Job Status'] ||
                         data.employment_status || data.Employment_Status || data['Employment Status'] ||
                         data.work_status || data.Work_Status || data['Work Status'] || '';
        
        console.log(`Rider ${data.rider_id || data.Rider_ID}: audit="${auditStatus}", job="${jobStatus}"`);
        
        const auditMatch = String(auditStatus).toLowerCase().includes('audit pass') || 
                          String(auditStatus).toLowerCase().includes('audit_pass') ||
                          String(auditStatus).toLowerCase().includes('pass');
        
        const jobMatch = String(jobStatus).toLowerCase().includes('on job') || 
                        String(jobStatus).toLowerCase().includes('on_job') ||
                        String(jobStatus).toLowerCase().includes('active') ||
                        String(jobStatus).toLowerCase().includes('working');
        
        const isEligible = auditMatch && jobMatch;
        if (isEligible) {
          console.log(`✅ ELIGIBLE: ${data.rider_id || data.Rider_ID}`);
        }
        
        return isEligible;
      });
      
      console.log('Training eligible riders:', eligible.length);
      setEligibleRiders(eligible);
    } catch (error) {
      console.error('Error fetching eligible riders for training:', error);
      setEligibleRiders([]);
    }
  };

  const onSubmit = async (data: TrainingFormData) => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert training data into project_data table
      const trainingData = {
        project_id: selectedProject.id,
        table_name: 'trainings',
        data: {
          ...data,
          created_by: user?.id,
          scheduled_by: user?.email || user?.id,
          status: 'scheduled',
          created_at: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('project_data')
        .insert([trainingData]);

      if (error) throw error;

      toast.success('Training scheduled successfully');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule training');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Training</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Rider *
            </label>
            <select
              {...register('rider_id', { required: 'Please select a rider' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an eligible rider ({eligibleRiders.length} available)</option>
              {eligibleRiders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.data.rider_id || rider.data.Rider_ID || 'N/A'} - {rider.data.rider_name || rider.data.Rider_Name || 'N/A'}
                </option>
              ))}
            </select>
            {eligibleRiders.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No riders eligible for training. Riders must have "Audit Pass" status and "On Job" status.
              </p>
            )}
            {errors.rider_id && (
              <p className="text-red-600 text-sm mt-1">{errors.rider_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('scheduled_date', { required: 'Date is required' })}
                  type="date"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.scheduled_date && (
                <p className="text-red-600 text-sm mt-1">{errors.scheduled_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('scheduled_time', { required: 'Time is required' })}
                  type="time"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.scheduled_time && (
                <p className="text-red-600 text-sm mt-1">{errors.scheduled_time.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('location', { required: 'Location is required' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter training location"
              />
            </div>
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trainer Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('trainer_name', { required: 'Trainer name is required' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter trainer name"
              />
            </div>
            {errors.trainer_name && (
              <p className="text-red-600 text-sm mt-1">{errors.trainer_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <div className="relative">
              <Languages className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                {...register('language')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes (optional)"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Training'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}