import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, type User } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      '🚨 CRASH PREVENTION: useAuth must be used within an AuthProvider.\n' +
      'Fix: Wrap your component tree with <AuthProvider>.\n' +
      'Check: App.tsx should have <AuthProvider> wrapping all components that use useAuth().\n' +
      'Components using useAuth: Sidebar, Header, QuickActions, LoginForm, and all page components.'
    );
  }
  return context;
}

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create profile
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .upsert({
              id: userId,
              email: authUser.user.email!,
              role: 'super_admin',
              first_name: 'Admin',
              last_name: 'User',
              is_active: true,
              permissions: []
            }, {
              onConflict: 'email'
            })
            .select()
            .single();

          if (!createError) {
            setUser(newUser);
            toast.success('Profile created successfully!');
          }
        }
        return;
      }

      if (!error && data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Invalid email or password');
        return false;
      }
      
      if (data.user) {
        await fetchUserProfile(data.user.id);
        toast.success('Signed in successfully!');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        toast.error('Failed to send reset email');
        return false;
      }
      toast.success('Password reset email sent');
      return true;
    } catch (error: any) {
      toast.error('Failed to send reset email');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    resetPassword,
  };
}

export { AuthContext };