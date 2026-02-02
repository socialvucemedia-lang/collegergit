'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, redirect to login
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If role is required and doesn't match, redirect to their dashboard
    if (requiredRole && user.role !== requiredRole) {
      router.replace(`/${user.role}`);
      return;
    }
  }, [user, loading, requiredRole, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-neutral-500 animate-pulse">Loading portal...</div>
        {/* Fallback for stuck loading */}
        <button
          onClick={() => {
            // Force verify by redirecting to login explicitly
            window.location.href = '/login';
          }}
          className="text-xs text-neutral-400 hover:text-red-500 underline transition-colors"
        >
          Stuck loading? Click here
        </button>
      </div>
    );
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
