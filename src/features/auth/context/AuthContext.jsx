import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import {
  getSession,
  onAuthStateChange,
  signInWithEmailPassword,
  signInWithGoogleOAuth,
  signOut as signOutRequest,
  signUpWithEmailPassword,
  validateSessionWithServerOrSignOut,
} from '../api/auth';
import { ensureUserProfileRow } from '../api/ensureUserProfile';
import { queryClient } from '../../../lib/queryClient';
import { getAuthErrorMessage } from '../utils/authErrors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const { data } = await getSession();
      if (!active) {
        return;
      }
      let nextSession = data.session ?? null;
      if (nextSession) {
        const cleared = await validateSessionWithServerOrSignOut();
        if (!active) {
          return;
        }
        if (cleared) {
          nextSession = null;
        }
      }
      if (nextSession) {
        const ensured = await ensureUserProfileRow(nextSession);
        if (!active) {
          return;
        }
        if (!ensured.ok) {
          await signOutRequest();
          queryClient.clear();
          nextSession = null;
        }
      }
      setSession(nextSession);
      setIsReady(true);
    }

    void bootstrap();

    const { data } = onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
      setSession(nextSession);
      if (nextSession?.user?.id) {
        void ensureUserProfileRow(nextSession).then(async (r) => {
          if (!r.ok) {
            await signOutRequest();
            queryClient.clear();
            setSession(null);
          }
        });
      }
    });

    const appSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }
      void (async () => {
        const { data: live } = await getSession();
        if (!live.session) {
          return;
        }
        await validateSessionWithServerOrSignOut();
      })();
    });

    return () => {
      active = false;
      appSub.remove();
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
      return { error: getAuthErrorMessage(error), needsEmailConfirmation: false, userId: null };
    }
    const needsEmailConfirmation = !data.session;
    const userId = data.user?.id ?? null;
    return { error: null, needsEmailConfirmation, userId };
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
