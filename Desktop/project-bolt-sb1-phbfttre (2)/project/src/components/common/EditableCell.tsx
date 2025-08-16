import React, { useState, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { usePartners } from '../../hooks/usePartners';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface EditableCellProps {
  value: any;
  onSave: (newValue: any, additionalData?: Record<string, any>) => Promise<boolean>;
  type: 'text' | 'select' | 'date';
  options?: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
  fieldName?: string;
  riderId?: string;
  riderData?: any;
}

export function EditableCell({ 
  value, 
  onSave, 
  type, 
  options = [], 
  disabled = false,
  placeholder = 'N/A',
  fieldName,
  riderId,
  riderData
}: EditableCellProps) {
  const { partners } = usePartners();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    // Check partner business status before allowing updates
    if (riderData && fieldName && (fieldName === 'training_status' || fieldName === 'box_installation' || fieldName === 'equipment_status')) {
      const riderPartnerId = riderData.partner_id;
      if (riderPartnerId && partners && partners.length > 0) {
        const matchedPartner = partners.find(partner => partner.partner_id === riderPartnerId);
        if (matchedPartner && matchedPartner.business_status !== 'Open') {
          toast.error(`Cannot update ${fieldName}: Partner business status is "${matchedPartner.business_status}". Only riders with "Open" partners can be updated.`);
          setEditValue(value || '');
          setIsEditing(false);
          return;
        }
      }
    }

    // Only block updating from Scheduled to Completed for box_installation and equipment_status
    // Allow training_status to be updated from Scheduled to Completed
    if (value === 'Scheduled' && editValue === 'Completed') {
      if (fieldName === 'box_installation' || fieldName === 'equipment_status') {
        toast.error(`Cannot update ${fieldName} from Scheduled to Completed. Please use the appropriate workflow to complete this task.`);
        setEditValue(value || '');
        setIsEditing(false);
        return;
      }
      // Allow training_status to be updated to Completed - no blocking
      console.log('✅ Allowing training status update from Scheduled to Completed');
    }

    console.log('💾 EditableCell saving:', { 
      riderId, 
      fieldName, 
      oldValue: value, 
      newValue: editValue 
    });
    
    setSaving(true);
    
    // Prepare common audit metadata
    const commonAudit = {
      last_updated_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
      last_updated_at: new Date().toISOString()
    };

    // Check if we're marking something as "Completed" and need to store completion info
    let success = false;
    if (editValue === 'Completed' && fieldName && riderId) {
      const currentDateTime = new Date();
      const currentDate = currentDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = currentDateTime.toTimeString().slice(0, 5); // HH:MM
      
      console.log('🎯 Marking as completed, storing completion info:', {
        fieldName,
        riderId,
        completionDate: currentDate,
        completionTime: currentTime
      });
      
      // Call onSave with completion info based on field type
      if (fieldName === 'training_status') {
        success = await onSave(editValue, {
          training_completion_date: currentDate,
          training_completion_time: currentTime,
          training_completed_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'System User',
          ...commonAudit
        });
      } else if (fieldName === 'box_installation') {
        success = await onSave(editValue, {
          installation_completion_date: currentDate,
          installation_completion_time: currentTime,
          installation_completed_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'System User',
          installation_vendor_id: riderData.installation_vendor_id || null,
          installation_vendor_name: riderData.installation_vendor_name || null,
          ...commonAudit
        });
      } else if (fieldName === 'equipment_status') {
        success = await onSave(editValue, {
          equipment_completion_date: currentDate,
          equipment_completion_time: currentTime,
          equipment_distributed_by: user?.email || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'System User',
          ...commonAudit
        });
      } else {
        success = await onSave(editValue, { ...commonAudit });
      }
    } else {
      success = await onSave(editValue, { ...commonAudit });
    }
    
    setSaving(false);
    
    if (success) {
      console.log('✅ EditableCell save successful', editValue === 'Completed' ? 'with completion info' : '');
      setIsEditing(false);
      // Update the local value to reflect the change
      setEditValue(editValue);
    } else {
      console.log('❌ EditableCell save failed');
      // Reset to original value on failure
      setEditValue(value || '');
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (disabled) {
    return (
      <span className="text-sm text-gray-900">
        {value || placeholder}
      </span>
    );
  }

  if (!isEditing) {
    return (
      <div className="group flex items-center space-x-2">
        <span className="text-sm text-gray-900">
          {type === 'select' && options.length > 0 ? (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              value === 'Completed' ? 'bg-green-100 text-green-800' :
              value === 'Scheduled' ? 'bg-yellow-100 text-yellow-800' :
              value === 'Eligible' ? 'bg-blue-100 text-blue-800' :
              value === 'Audit Pass' ? 'bg-green-100 text-green-800' :
              value === 'On Job' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {value || placeholder}
            </span>
          ) : (
            value || placeholder
          )}
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {type === 'select' ? (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'date' ? (
        <input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      )}
      
      <button
        onClick={handleSave}
        disabled={saving}
        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
      >
        <Check className="w-3 h-3" />
      </button>
      
      <button
        onClick={handleCancel}
        disabled={saving}
        className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}