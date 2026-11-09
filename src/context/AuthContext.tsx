import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Retrieve initial active session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(formatSupabaseError(sessionError));
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(err => {
      if (!mounted) return;
      setError(formatSupabaseError(err));
      setLoading(false);
    });

    // Listen for auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    clearError();
    if (!isSupabaseConfigured) {
      const msg = 'Supabase credentials missing: Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables.';
      setError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const formatted = formatSupabaseError(signInError);
        setError(formatted);
        return { success: false, error: formatted };
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true };
    } catch (err) {
      const formatted = formatSupabaseError(err);
      setError(formatted);
      return { success: false, error: formatted };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    clearError();
    if (!isSupabaseConfigured) {
      const msg = 'Supabase credentials missing: Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment variables.';
      setError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        const formatted = formatSupabaseError(signUpError);
        setError(formatted);
        return { success: false, error: formatted };
      }

      // Check if email confirmation is required by project
      if (data.user && !data.session) {
        // Confirmation email sent
        return {
          success: true,
          error: 'Account created! Please check your email for the confirmation link to complete login.',
        };
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true };
    } catch (err) {
      const formatted = formatSupabaseError(err);
      setError(formatted);
      return { success: false, error: formatted };
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    clearError();
    try {
      if (isSupabaseConfigured) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          const formatted = formatSupabaseError(signOutError);
          setError(formatted);
          return { success: false, error: formatted };
        }
      }
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      const formatted = formatSupabaseError(err);
      setError(formatted);
      return { success: false, error: formatted };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
