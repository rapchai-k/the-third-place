import React, { useState } from 'react';
import { VendorLoginForm } from '../components/auth/VendorLoginForm';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function VendorAuth() {
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    checkVendorSession();
  }, []);

  const checkVendorSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if this user is a vendor and redirect to main app
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .eq('role', 'vendor')
          .eq('is_active', true)
          .maybeSingle();

        if (!error && userData) {
          // Vendor is already logged in, redirect to main app
          window.location.href = '/';
          return;
        }
      }
    } catch (error) {
      console.error('Error checking vendor session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // Redirect to main app after successful vendor login
    window.location.href = '/';
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor portal...</p>
        </div>
      </div>
    );
  }

  return <VendorLoginForm onLoginSuccess={handleLoginSuccess} />;
}