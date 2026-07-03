import { ROUTES } from '../../../routes/routes';
import { navigationRef } from '../../../navigation/navigationRef';
import { storePendingPushNavigation } from '../constants/pendingPushNavigation';
import { navigateFromPushPayload } from './navigateFromPushPayload';

const RETRY_DELAYS_MS = [0, 120, 450, 900];

function isMainAppReachable() {
  if (!navigationRef.isReady()) {
    return false;
  }
  const state = navigationRef.getRootState();
  const routes = state?.routes ?? [];
  return routes.some((route) => route.name === ROUTES.MAIN_APP);
}

/**
 * Navigates from push `data`, deferring until navigation + main app are ready.
 * When the user is signed out or still onboarding, stores the payload for later.
 *
 * @param {Record<string, unknown> | null | undefined} data
 * @param {{ canNavigateMain?: boolean }} [options]
 */
export function attemptPushNavigation(data, { canNavigateMain = true } = {}) {
  if (!data || typeof data !== 'object') {
    return;
  }

  if (!canNavigateMain) {
    void storePendingPushNavigation(data);
    return;
  }

  const tryNavigate = () => {
    if (!navigationRef.isReady()) {
      return false;
    }
    if (!isMainAppReachable()) {
      void storePendingPushNavigation(data);
      return true;
    }
    navigateFromPushPayload(navigationRef, data);
    return true;
  };

  if (tryNavigate()) {
    return;
  }

  for (const delayMs of RETRY_DELAYS_MS) {
    if (delayMs === 0) {
      continue;
    }
    setTimeout(() => {
      tryNavigate();
    }, delayMs);
  }
}
