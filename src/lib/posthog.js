import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import PostHog, { PostHogProvider } from 'posthog-react-native';

const projectToken = String(Constants.expoConfig?.extra?.posthogProjectToken ?? '').trim();
const host = String(Constants.expoConfig?.extra?.posthogHost ?? '').trim();
const isLocalDev = typeof __DEV__ !== 'undefined' && __DEV__;
const hasCredentials = Boolean(projectToken && host);
/** Off in Metro / the dev client so local clicking does not mix with real usage. */
const isPostHogConfigured = hasCredentials && !isLocalDev;

/** EAS channel (`production` / `preview`), or `production` when the channel is unset. */
function resolveAppEnvironment() {
  const channel = typeof Updates.channel === 'string' ? Updates.channel.trim() : '';
  return channel || 'production';
}

if (!hasCredentials && !isLocalDev) {
  const missingVariable = projectToken
    ? 'EXPO_PUBLIC_POSTHOG_HOST'
    : 'EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN';
  console.warn(`[PostHog] ${missingVariable} is missing. Screen and crash analytics are off.`);
}

/**
 * Shared PostHog client. Disabled while `__DEV__` is true.
 * - Screens/tabs: tracked via navigation (`trackScreenView`)
 * - Crashes: JS uncaught exceptions + unhandled promise rejections
 * - Touches: off by default (noisy); use named events for important actions
 * - Release events include `app_environment` (`production` or `preview`)
 */
export const posthog = isPostHogConfigured
  ? new PostHog(projectToken, {
      host,
      captureAppLifecycleEvents: true,
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
        },
      },
    })
  : null;

if (posthog) {
  posthog.register({
    app_environment: resolveAppEnvironment(),
  });
}

export function PostHogProviderIfConfigured({ children }) {
  return posthog ? (
    <PostHogProvider
      autocapture={{
        captureScreens: false,
        captureTouches: false,
      }}
      client={posthog}
    >
      {children}
    </PostHogProvider>
  ) : (
    children
  );
}

/** Manual error report when you catch something important yourself. */
export function captureAppException(error, additionalProperties = {}) {
  if (!posthog || !error) return;
  try {
    posthog.captureException(error, additionalProperties);
  } catch {
    // Never let analytics break the app.
  }
}
