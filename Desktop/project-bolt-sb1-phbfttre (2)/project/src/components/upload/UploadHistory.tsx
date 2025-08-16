import React, { useState } from 'react';
import { useUploadHistory } from '../../hooks/useRiders';
import { Clock, FileText, Users, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';

export function UploadHistory() {
  const { uploads, loading, getUploadDetails } = useUploadHistory();
  const [expandedUpload, setExpandedUpload] = useState<string | null>(null);
  const [uploadDetails, setUploadDetails] = useState<Record<string, any[]>>({});

  const handleToggleExpand = async (uploadId: string) => {
    if (expandedUpload === uploadId) {
      setExpandedUpload(null);
      return;
    }

    setExpandedUpload(uploadId);
    
    if (!uploadDetails[uploadId]) {
      const details = await getUploadDetails(uploadId);
      setUploadDetails(prev => ({ ...prev, [uploadId]: details }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Upload History</h2>
        <span className="text-sm text-gray-500">{uploads.length} uploads</span>
      </div>

      {uploads.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No uploads yet</h3>
          <p className="text-gray-600">Upload your first rider data file to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {uploads.map((upload) => (
            <div key={upload.id} className="border border-gray-200 rounded-lg">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleToggleExpand(upload.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {expandedUpload === upload.id ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{upload.filename}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(upload.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Users className="w-3 h-3" />
                          <span>{upload.total_rows} rows</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-green-600">+{upload.riders_created}</span>
                        <span className="text-blue-600">~{upload.riders_updated}</span>
                      </div>
                      <div className="text-xs text-gray-500">created / updated</div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(upload.upload_status)}`}>
                      {upload.upload_status}
                    </span>
                  </div>
                </div>
              </div>

              {expandedUpload === upload.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Upload Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Rows:</span>
                          <span className="font-medium">{upload.total_rows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Riders Created:</span>
                          <span className="font-medium text-green-600">{upload.riders_created}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Riders Updated:</span>
                          <span className="font-medium text-blue-600">{upload.riders_updated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No Changes:</span>
                          <span className="font-medium text-gray-600">{upload.total_rows - upload.riders_created - upload.riders_updated}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Detected Columns</h4>
                      <div className="flex flex-wrap gap-1">
                        {upload.columns_detected.map((column, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {column}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {uploadDetails[upload.id] && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recent Changes</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <div className="space-y-2">
                          {uploadDetails[upload.id].slice(0, 10).map((detail) => (
                            <div key={detail.id} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs">{detail.rider_id}</span>
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  detail.action === 'created' ? 'bg-green-100 text-green-800' :
                                  detail.action === 'updated' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {detail.action}
                                </span>
                              </div>
                              {detail.changed_columns && detail.changed_columns.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  {detail.changed_columns.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}