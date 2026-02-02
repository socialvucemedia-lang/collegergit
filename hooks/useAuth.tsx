'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
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

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setState({ user: currentUser, loading: false });
    } catch (error) {
      console.error('Error refreshing user:', error);
      setState({ user: null, loading: false });
    }
  };

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
      await refreshUser();
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Handle events
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // If we don't have a user or it's a refresh, update
        const currentUser = await getCurrentUser();
        if (mounted) {
          setState({ user: currentUser, loading: false });
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setState({ user: null, loading: false });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


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
