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

// Timeout for loading state (15 seconds - increased for cold starts)
const LOADING_TIMEOUT_MS = 15000;

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
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined); // Track timeout to clear it

  const refreshUser = useCallback(async () => {
    // Prevent concurrent profile fetches (race condition fix)
    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;

    try {
      const currentUser = await getCurrentUser();
      setState({ user: currentUser, loading: false });

      // Clear timeout since auth succeeded
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setState({ user: null, loading: false });

      // Clear timeout on error too
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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

    const initAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;

      // Set a timeout to prevent infinite loading state
      // Use ref so we can clear it from refreshUser
      timeoutRef.current = setTimeout(() => {
        if (mounted && fetchingRef.current) {
          console.warn('Auth loading timeout - resetting state');
          setState({ user: null, loading: false });
          fetchingRef.current = false;
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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

