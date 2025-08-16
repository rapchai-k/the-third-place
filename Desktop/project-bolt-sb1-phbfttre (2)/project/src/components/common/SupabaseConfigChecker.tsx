import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react';

export function SupabaseConfigChecker() {
  const [showKeys, setShowKeys] = useState(false);
  const [config, setConfig] = useState({
    url: '',
    anonKey: '',
    serviceKey: '',
    urlValid: false,
    anonKeyValid: false,
    serviceKeyValid: false,
    adminClientWorking: false
  });

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

    console.log('🔍 CONFIGURATION CHECK:');
    console.log('URL:', url ? `${url.substring(0, 30)}...` : 'MISSING');
    console.log('Anon Key Length:', anonKey.length);
    console.log('Service Key Length:', serviceKey.length);

    const urlValid = url.startsWith('https://') && url.includes('.supabase.co');
    const anonKeyValid = anonKey.length > 100 && anonKey.startsWith('eyJ');
    const serviceKeyValid = serviceKey.length > 100 && serviceKey.startsWith('eyJ') && !serviceKey.includes('your_');

    // Test admin client
    let adminClientWorking = false;
    if (urlValid && serviceKeyValid) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const testAdmin = createClient(url, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        // Test admin operation
        const { error } = await testAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
        adminClientWorking = !error;
        
        if (error) {
          console.error('❌ Admin client test failed:', error);
        } else {
          console.log('✅ Admin client test successful');
        }
      } catch (error) {
        console.error('❌ Admin client creation failed:', error);
      }
    }

    setConfig({
      url,
      anonKey,
      serviceKey,
      urlValid,
      anonKeyValid,
      serviceKeyValid,
      adminClientWorking
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const maskKey = (key: string) => {
    if (!key) return 'NOT SET';
    if (key.length < 20) return key;
    return `${key.substring(0, 20)}...${key.substring(key.length - 10)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">🔧 Supabase Configuration Checker</h2>
            <button
              onClick={() => window.location.reload()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Configuration Status */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(config.urlValid)}
                <div>
                  <h3 className="font-medium text-gray-900">Project URL</h3>
                  <p className="text-sm text-gray-600">
                    {showKeys ? config.url || 'NOT SET' : maskKey(config.url)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {config.urlValid ? '✅ Valid' : '❌ Invalid'}
                </div>
                {config.url && (
                  <button
                    onClick={() => copyToClipboard(config.url)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(config.anonKeyValid)}
                <div>
                  <h3 className="font-medium text-gray-900">Anon Key</h3>
                  <p className="text-sm text-gray-600">
                    {showKeys ? config.anonKey || 'NOT SET' : maskKey(config.anonKey)}
                  </p>
                  <p className="text-xs text-gray-500">Length: {config.anonKey.length} chars</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {config.anonKeyValid ? '✅ Valid' : '❌ Invalid'}
                </div>
                {config.anonKey && (
                  <button
                    onClick={() => copyToClipboard(config.anonKey)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(config.serviceKeyValid)}
                <div>
                  <h3 className="font-medium text-gray-900">Service Role Key</h3>
                  <p className="text-sm text-gray-600">
                    {showKeys ? config.serviceKey || 'NOT SET' : maskKey(config.serviceKey)}
                  </p>
                  <p className="text-xs text-gray-500">Length: {config.serviceKey.length} chars</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {config.serviceKeyValid ? '✅ Valid' : '❌ Invalid'}
                </div>
                {config.serviceKey && (
                  <button
                    onClick={() => copyToClipboard(config.serviceKey)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(config.adminClientWorking)}
                <div>
                  <h3 className="font-medium text-gray-900">Admin Client Test</h3>
                  <p className="text-sm text-gray-600">
                    {config.adminClientWorking ? 'Admin operations working' : 'Admin operations failed'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {config.adminClientWorking ? '✅ Working' : '❌ Failed'}
                </div>
              </div>
            </div>
          </div>

          {/* Show/Hide Keys Toggle */}
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showKeys ? 'Hide Keys' : 'Show Keys'}</span>
            </button>
          </div>

          {/* Step-by-Step Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 How to Get Your Supabase Keys:</h3>
            <ol className="space-y-3 text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <strong>Go to Supabase Dashboard:</strong>
                  <br />
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    https://supabase.com/dashboard
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <strong>Select Your Project</strong> (or create a new one if needed)
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <strong>Go to Settings → API:</strong>
                  <br />
                  Click the gear icon (Settings) in the left sidebar, then click "API"
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <strong>Copy These 3 Values:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• <strong>Project URL:</strong> https://your-project-id.supabase.co</li>
                    <li>• <strong>anon public:</strong> Long key starting with "eyJ" (100+ characters)</li>
                    <li>• <strong>service_role:</strong> Different long key starting with "eyJ" (100+ characters)</li>
                  </ul>
                </div>
              </li>
            </ol>
          </div>

          {/* Current .env Template */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">📝 Update Your .env File:</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
              <div>VITE_SUPABASE_URL=https://your-project-id.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
              <div>VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
            </div>
            <button
              onClick={() => copyToClipboard(`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)}
              className="mt-2 flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Template</span>
            </button>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• The <strong>service_role</strong> key is different from the anon key</li>
              <li>• Both keys should be 100+ characters long</li>
              <li>• Make sure to copy the complete key without truncation</li>
              <li>• Restart the dev server after updating .env</li>
              <li>• The service_role key enables user creation/management</li>
            </ul>
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh After Updating .env
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}