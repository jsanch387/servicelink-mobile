import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getSession,
  onAuthStateChange,
  signInWithEmailPassword,
  signInWithGoogleOAuth,
  signOut as signOutRequest,
  signUpWithEmailPassword,
} from '../api/auth';
import { queryClient } from '../../../lib/queryClient';
import { getAuthErrorMessage } from '../utils/authErrors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }
      setSession(data.session ?? null);
      setIsReady(true);
    });

    const { data } = onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
      setSession(nextSession);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await signInWithEmailPassword(email, password);
    if (error) {
      return { error: getAuthErrorMessage(error) };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await signUpWithEmailPassword(email, password);
    if (error) {
      return { error: getAuthErrorMessage(error), needsEmailConfirmation: false };
    }
    const needsEmailConfirmation = !data.session;
    return { error: null, needsEmailConfirmation };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error, cancelled } = await signInWithGoogleOAuth();
    if (cancelled) {
      return { error: null, cancelled: true };
    }
    if (error) {
      return { error: getAuthErrorMessage(error), cancelled: false };
    }
    return { error: null, cancelled: false };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await signOutRequest();
    if (error) {
      return { error: getAuthErrorMessage(error) };
    }
    queryClient.clear();
    return { error: null };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isReady,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
    }),
    [session, isReady, signIn, signInWithGoogle, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
