import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AuthCallback = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Parse URL fragment for tokens
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const providerToken = hashParams.get('provider_token');
        const expiresIn = hashParams.get('expires_in');
        const tokenType = hashParams.get('token_type');
        
        // Check for error in fragment
        const errorCode = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (errorCode) {
          throw new Error(errorDescription || `OAuth error: ${errorCode}`);
        }

        if (!accessToken || !refreshToken) {
          // Try to get session if tokens not in fragment (might be code flow)
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (session) {
            setStatus('success');
            // Clean URL and redirect
            cleanURLAndRedirect();
            return;
          }
          
          throw new Error('No authentication tokens found. Please try signing in again.');
        }

        // Set session with tokens
        const { data: { session }, error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (setSessionError) {
          throw setSessionError;
        }

        if (!session) {
          throw new Error('Failed to create session. Tokens may be invalid or expired.');
        }

        setStatus('success');
        
        // Clean URL and redirect after successful authentication
        cleanURLAndRedirect();
        
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An unexpected error occurred during authentication.');
        setStatus('error');
      }
    };

    const cleanURLAndRedirect = () => {
      // Get redirect destination from state or default to home
      const redirectTo = location.state?.from?.pathname || '/';
      
      // Clean the URL to remove tokens
      window.history.replaceState(
        {}, 
        document.title, 
        window.location.pathname + window.location.search
      );
      
      // Redirect after a short delay to show success state
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 1500);
    };

    // Self-check: log current configuration for debugging
    console.log('Auth Callback Debug Info:', {
      currentOrigin: window.location.origin,
      fullURL: window.location.href,
      hash: window.location.hash,
      search: window.location.search,
      pathname: window.location.pathname,
      supabaseURL: import.meta.env.VITE_SUPABASE_URL || 'Not configured',
    });

    handleAuthCallback();
  }, [navigate, location.state]);

  const handleRetry = () => {
    navigate('/auth', { replace: true });
  };

  const handleHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {status === 'processing' && 'Completing Sign In...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Sign In Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we complete your authentication'}
            {status === 'success' && 'You have been successfully signed in'}
            {status === 'error' && 'There was an issue with your authentication'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'processing' && (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting you to the app...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Try the following solutions:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>• Check your system clock is correct</li>
                  <li>• Clear browser cache and cookies</li>
                  <li>• Disable browser extensions that might block authentication</li>
                  <li>• Try signing in again</li>
                </ul>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleRetry} variant="default" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleHome} variant="outline" className="flex-1">
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;