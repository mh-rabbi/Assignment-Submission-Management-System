'use client';

/**
 * AuthContext — stores the full AuthResponseDto after login.
 * Decision D-01: storing full response (not just token) gives us `name`
 * for the sidebar without an Admin-only extra API call.
 *
 * Also listens for the 'rc:unauthorized' event dispatched by api.ts
 * when any API call returns 401 — forces sign-out.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAuth, setStoredAuth, clearStoredAuth } from '@/lib/auth';
import type { AuthResponseDto, Role } from '@/lib/types';

interface AuthContextValue {
  auth: AuthResponseDto | null;
  isLoading: boolean;
  role: Role | null;
  signIn: (auth: AuthResponseDto) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      // Check token expiry
      const expired = new Date(stored.expiresAt) <= new Date();
      if (!expired) {
        setAuth(stored);
      } else {
        clearStoredAuth();
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for 401 events from api.ts — force sign-out
  const signOut = useCallback(() => {
    clearStoredAuth();
    setAuth(null);
    router.push('/auth');
  }, [router]);

  useEffect(() => {
    const handler = () => signOut();
    window.addEventListener('rc:unauthorized', handler);
    return () => window.removeEventListener('rc:unauthorized', handler);
  }, [signOut]);

  const signIn = useCallback((authResponse: AuthResponseDto) => {
    setStoredAuth(authResponse);
    setAuth(authResponse);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        auth,
        isLoading,
        role: auth?.role ?? null,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
