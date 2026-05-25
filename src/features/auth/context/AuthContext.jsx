import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Linking from 'expo-linking';
import { Alert, AppState, Platform } from 'react-native';
import { clearPendingBookingLinkNavigation } from '../../onboarding/constants/postOnboardingNavigation';
import {
  completeAuthSessionFromUrl,
  getSession,
  onAuthStateChange,
  resendSignupConfirmationEmail,
  sendEmailLoginOtp,
  signOut as signOutRequest,
  signUpWithEmailPassword,
  validateSessionWithServerOrSignOut,
  verifyEmailLoginOtp,
} from '../api/auth';
import { ensureUserProfileRow } from '../api/ensureUserProfile';
import { NO_EXISTING_SERVICELINK_ACCOUNT_CODE } from '../constants/existingAccountOnlyCopy';
import { queryClient } from '../../../lib/queryClient';
import { getAuthErrorMessage, getAuthErrorHint } from '../utils/authErrors';

const AuthContext = createContext(null);

function notifyExistingAccountOnlyFailure(error) {
  if (Platform.OS === 'web') {
    return;
  }
  Alert.alert('Sign in', getAuthErrorMessage(error));
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const lastAuthDeepLinkUrlRef = useRef(null);

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
          if (ensured.error?.code === NO_EXISTING_SERVICELINK_ACCOUNT_CODE) {
            notifyExistingAccountOnlyFailure(ensured.error);
          }
          await signOutRequest();
          queryClient.clear();
          nextSession = null;
        }
      }
      if (!active) {
        return;
      }
      setSession(nextSession);
      setIsReady(true);
    }

    void bootstrap();

    const { data } = onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        void clearPendingBookingLinkNavigation();
      }
      setSession(nextSession);
      if (nextSession?.user?.id) {
        void ensureUserProfileRow(nextSession).then(async (r) => {
          if (!r.ok) {
            if (r.error?.code === NO_EXISTING_SERVICELINK_ACCOUNT_CODE) {
              notifyExistingAccountOnlyFailure(r.error);
            }
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

  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

    let cancelled = false;
    let busy = false;

    async function handleUrl(url) {
      if (!url || cancelled || busy) {
        return;
      }
      if (lastAuthDeepLinkUrlRef.current === url) {
        return;
      }
      busy = true;
      try {
        const { error, handled } = await completeAuthSessionFromUrl(url);
        if (handled) {
          lastAuthDeepLinkUrlRef.current = url;
        }
        if (cancelled || !error) {
          return;
        }
        Alert.alert('Sign-in link', getAuthErrorMessage(error));
      } finally {
        busy = false;
      }
    }

    void Linking.getInitialURL().then((url) => {
      if (url) {
        void handleUrl(url);
      }
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const sendLoginCode = useCallback(async (email) => {
    const { error } = await sendEmailLoginOtp(email);
    if (error) {
      return {
        error: getAuthErrorMessage(error),
        errorHint: getAuthErrorHint(error),
      };
    }
    return { error: null, errorHint: null };
  }, []);

  const verifyLoginCode = useCallback(async (email, code) => {
    const { error } = await verifyEmailLoginOtp(email, code);
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

  const resendSignupConfirmation = useCallback(async (email) => {
    const { error } = await resendSignupConfirmationEmail(email);
    if (error) {
      return { error: getAuthErrorMessage(error) };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await signOutRequest();
    if (error) {
      return { error: getAuthErrorMessage(error) };
    }
    queryClient.clear();
    await clearPendingBookingLinkNavigation();
    return { error: null };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isReady,
      sendLoginCode,
      verifyLoginCode,
      signUp,
      resendSignupConfirmation,
      signOut,
    }),
    [session, isReady, sendLoginCode, verifyLoginCode, signUp, resendSignupConfirmation, signOut],
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
