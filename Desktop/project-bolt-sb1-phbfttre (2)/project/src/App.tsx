import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { ProgressBar } from './components/common/ProgressBar';
import { useProgressBar } from './hooks/useProgressBar';
import { AuthProvider } from './components/auth/AuthProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SafeComponent } from './components/common/SafeComponent';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/layout/Layout';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './pages/Dashboard';
import { DynamicRiders } from './pages/DynamicRiders';
import { Upload } from './pages/Upload';
import { Training } from './pages/Training';
import { Installation } from './pages/Installation';
import { CollectEquipment } from './pages/CollectEquipment';
import { Equipment } from './pages/Equipment';
import { Partners } from './pages/Partners';
import { Vendors } from './pages/Vendors';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';
import { Search } from './pages/Search';
import { Audit } from './pages/Audit';
import { VendorAuth } from './pages/VendorAuth';
import { EquipmentStock } from './pages/EquipmentStock';
import { SupabaseKeyGuide } from './components/common/SupabaseKeyGuide';
import { logComponentDependencies } from './utils/contextValidator';
import { VendorPortal } from './pages/VendorPortal';

// Create a context for progress bar

const ProgressBarContext = createContext<ReturnType<typeof useProgressBar> | null>(null);

export function useGlobalProgressBar() {
  const context = useContext(ProgressBarContext);
  if (!context) {
    throw new Error('useGlobalProgressBar must be used within ProgressBarProvider');
  }
  return context;
}

function AppContent() {
  const { user, loading } = useAuth();
  const progressBar = useProgressBar();
  
  // Check if user is a vendor and redirect to vendor portal
  if (user && user.role === 'vendor') {
    return (
      <SafeComponent componentName="VendorPortal">
        <VendorPortal />
      </SafeComponent>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RiderFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <SafeComponent componentName="Router">
      <ProgressBarContext.Provider value={progressBar}>
        <ProgressBar
          isVisible={progressBar.progressState.isVisible}
          onHide={progressBar.hideProgress}
          progress={progressBar.progressState.progress}
          status={progressBar.progressState.status}
          message={progressBar.progressState.message}
          details={progressBar.progressState.details}
        />
      <Router>
        <SafeComponent componentName="Layout">
          <Layout>
            <SafeComponent componentName="Routes">
              <Routes>
                <Route path="/" element={
                  <SafeComponent componentName="Dashboard">
                    <Dashboard />
                  </SafeComponent>
                } />
                <Route path="/riders" element={
                  <SafeComponent componentName="DynamicRiders">
                    <DynamicRiders />
                  </SafeComponent>
                } />
                <Route path="/upload" element={
                  <SafeComponent componentName="Upload">
                    <Upload />
                  </SafeComponent>
                } />
                <Route path="/training" element={
                  <SafeComponent componentName="Training">
                    <Training />
                  </SafeComponent>
                } />
                <Route path="/installation" element={
                  <SafeComponent componentName="Installation">
                    <Installation />
                  </SafeComponent>
                } />
                <Route path="/collect-equipment" element={
                  <SafeComponent componentName="CollectEquipment">
                    <CollectEquipment />
                  </SafeComponent>
                } />
                <Route path="/equipment" element={
                  <SafeComponent componentName="Equipment">
                    <Equipment />
                  </SafeComponent>
                } />
                <Route path="/equipment-stock" element={
                  <SafeComponent componentName="EquipmentStock">
                    <EquipmentStock />
                  </SafeComponent>
                } />
                <Route path="/partners" element={
                  <SafeComponent componentName="Partners">
                    <Partners />
                  </SafeComponent>
                } />
                <Route path="/vendors" element={
                  <SafeComponent componentName="Vendors">
                    <Vendors />
                  </SafeComponent>
                } />
                <Route path="/users" element={
                  <SafeComponent componentName="Users">
                    <Users />
                  </SafeComponent>
                } />
                <Route path="/reports" element={
                  <SafeComponent componentName="Reports">
                    <Reports />
                  </SafeComponent>
                } />
                <Route path="/search" element={
                  <SafeComponent componentName="Search">
                    <Search />
                  </SafeComponent>
                } />
                <Route path="/audit" element={
                  <SafeComponent componentName="Audit">
                    <Audit />
                  </SafeComponent>
                } />
                <Route path="/vendor-portal" element={
                  <SafeComponent componentName="VendorAuth">
                    <VendorAuth />
                  </SafeComponent>
                } />
              </Routes>
            </SafeComponent>
          </Layout>
        </SafeComponent>
      </Router>
      </ProgressBarContext.Provider>
    </SafeComponent>
  );
}

function App() {
  // 🚨 CRASH PREVENTION: Log dependencies on app start
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 RiderFlow App Starting...');
      logComponentDependencies();
      console.log('✅ Context providers initialized');
    }
  }, []);

  return (
    <ErrorBoundary>
      <SafeComponent componentName="AuthProvider">
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeComponent>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;