'use client';

import { AuthProvider as BaseAuthProvider } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <BaseAuthProvider>{children}</BaseAuthProvider>;
}
