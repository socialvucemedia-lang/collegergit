'use client';

import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, signOut } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout for loading state (10 seconds)
const LOADING_TIMEOUT_MS = 10000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    user: AuthUser | null;
    loading: boolean;
  }>({
    user: null,
    loading: true,
  });
  const router = useRouter();
  const initialized = useRef(false);
  const fetchingRef = useRef(false); // Prevent concurrent fetches

  const refreshUser = useCallback(async () => {
    // Prevent concurrent profile fetches (race condition fix)
    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;

    try {
      const currentUser = await getCurrentUser();
      setState({ user: currentUser, loading: false });
    } catch (error) {
      console.error('Error refreshing user:', error);
      setState({ user: null, loading: false });
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setState({ user: null, loading: false });
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;

      // Set a timeout to prevent infinite loading state
      timeoutId = setTimeout(() => {
        if (mounted && state.loading) {
          console.warn('Auth loading timeout - resetting state');
          setState({ user: null, loading: false });
        }
      }, LOADING_TIMEOUT_MS);

      await refreshUser();
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Handle events - only refresh if not already fetching
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (!fetchingRef.current) {
          await refreshUser();
        }
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, loading: false });
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [refreshUser]);


  const contextValue = {
    user: state.user,
    loading: state.loading,
    signOut: handleSignOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

