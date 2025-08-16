import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface FileUploadProps {
  accept?: string;
  onFileProcessed: (data: any[], fileName: string) => void;
  title: string;
  description: string;
  requiredColumns?: string[]; // Optional override for required columns panel
  requiredColumnsNote?: string; // Optional note under required columns
}

export function FileUpload({ accept = '.csv,.xlsx,.xls', onFileProcessed, title, description, requiredColumns, requiredColumnsNote }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    processFile(selectedFile);
  };

  const processFile = async (file: File) => {
    setProcessing(true);
    setError(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let data: any[] = [];

      if (fileExtension === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        data = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error('Unsupported file format');
      }

      if (data.length === 0) {
        throw new Error('No data found in file');
      }

      onFileProcessed(data, file.name);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors"
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Drop files here or click to browse
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                Supports CSV, Excel (.xlsx, .xls)
              </span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept={accept}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    handleFileSelect(files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Required Columns:</h4>
        {requiredColumns && requiredColumns.length > 0 ? (
          <>
            <div className="text-xs text-blue-800 space-y-1">
              {requiredColumns.map((col) => (
                <div key={col}>• <strong>{col}</strong></div>
              ))}
            </div>
            {requiredColumnsNote && (
              <p className="text-xs text-blue-600 mt-2">{requiredColumnsNote}</p>
            )}
          </>
        ) : (
          <>
            <div className="text-xs text-blue-800 space-y-1">
              <div>• <strong>rider_id</strong> (Primary Key)</div>
              <div>• create_time</div>
              <div>• city_id</div>
              <div>• partner_id</div>
              <div>• rider_name</div>
              <div>• mobile</div>
              <div>• nationality_code</div>
              <div>• resident_type</div>
              <div>• partner_company_name_en</div>
              <div>• identity_card_number</div>
              <div>• vehicle_number</div>
              <div>• delivery_type</div>
              <div>• audit_status</div>
              <div>• job_status</div>
              <div>• box_installation</div>
              <div>• training_status</div>
              <div>• equipment_status</div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Note:</strong> rider_id is the primary key. Existing riders will be updated, new ones will be created.
            </p>
          </>
        )}
      </div>

      {file && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {processing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <div className="h-5 w-5 bg-blue-100 rounded-full"></div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {processing && (
            <p className="text-sm text-blue-600 mt-2">Processing file...</p>
          )}

          {success && (
            <p className="text-sm text-green-600 mt-2">File processed successfully!</p>
          )}

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}