import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../api/auth';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { readItem, removeItem, writeItem } from './storage';

const TOKEN_KEY = 'miniledger.token';
const USER_KEY = 'miniledger.user';

type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [user, setUser] = useState<User | null>(null);

  const signIn = useCallback(async (token: string, signedInUser: User) => {
    await writeItem(TOKEN_KEY, token);
    await writeItem(USER_KEY, JSON.stringify(signedInUser));
    setAuthToken(token);
    setUser(signedInUser);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setStatus('signedOut');
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    async function restore() {
      try {
        const [token, storedUser] = await Promise.all([readItem(TOKEN_KEY), readItem(USER_KEY)]);
        if (token && storedUser) {
          setAuthToken(token);
          setUser(JSON.parse(storedUser));
          setStatus('signedIn');
          return;
        }
      } catch {
        await signOut();
        return;
      }
      setStatus('signedOut');
    }

    restore();
  }, [signOut]);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo(() => ({ status, user, signIn, signOut }), [status, user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
