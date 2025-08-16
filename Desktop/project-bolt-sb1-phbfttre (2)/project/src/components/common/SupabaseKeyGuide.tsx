import React, { useState } from 'react';
import { Copy, ExternalLink, Key, CheckCircle } from 'lucide-react';

export function SupabaseKeyGuide() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const projectId = 'djkpgvnuvjyjvtrkmblv'; // From your error message

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Key className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Get Your Supabase API Key</h1>
          <p className="text-gray-600 mt-2">Follow these steps to get your correct API key</p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Open Supabase Dashboard</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Click the button below to open your Supabase project dashboard:
            </p>
            <a
              href={`https://supabase.com/dashboard/project/${projectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Your Project Dashboard</span>
            </a>
          </div>

          {/* Step 2 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Navigate to API Settings</h2>
            </div>
            <p className="text-gray-700 mb-4">
              In the left sidebar, click on:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              Settings → API
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Copy the API Keys</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Find and copy these two values:
            </p>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Project URL</h3>
                <p className="text-sm text-blue-800 mb-2">Should look like:</p>
                <div className="bg-white p-2 rounded border font-mono text-sm">
                  https://djkpgvnuvjyjvtrkmblv.supabase.co
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">anon/public Key</h3>
                <p className="text-sm text-green-800 mb-2">Long key starting with "eyJ" (100+ characters):</p>
                <div className="bg-white p-2 rounded border font-mono text-xs break-all">
                  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqa3BndnV2anlqdnRya21ibHYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5...
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Update Your .env File</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Replace the values in your .env file:
            </p>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div>VITE_SUPABASE_URL=https://djkpgvnuvjyjvtrkmblv.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
            </div>
            
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => copyToClipboard(`VITE_SUPABASE_URL=https://djkpgvnuvjyjvtrkmblv.supabase.co
VITE_SUPABASE_ANON_KEY=`, 4)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Template</span>
              </button>
              {copiedStep === 4 && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Copied!</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 5 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Restart the Server</h2>
            </div>
            <p className="text-gray-700 mb-4">
              After updating your .env file, restart the development server:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              Stop the server (Ctrl+C) and run: npm run dev
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• The anon key should be 100+ characters long</li>
            <li>• Make sure to copy the complete key without truncation</li>
            <li>• Don't use the service_role key for VITE_SUPABASE_ANON_KEY</li>
            <li>• Restart the dev server after updating .env</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh After Updating Keys
          </button>
        </div>
      </div>
    </div>
  );
}