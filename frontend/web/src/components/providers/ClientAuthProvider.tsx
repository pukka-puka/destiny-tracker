// src/components/providers/ClientAuthProvider.tsx
'use client';

import { AuthProvider } from '@/hooks/useAuth';

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}