import {
  isTapToPayEducationAvailable,
  presentTapToPayEducation,
} from '../native/presentTapToPayEducation';
import { logTapToPayDebug } from '../utils/logTapToPayDebug';
import { hasSeenTapToPayEducation } from './tapToPayEducationStorage';

/**
 * Presents Apple's merchant education once after the first successful Tap to Pay reader connect
 * (typically right after Stripe/Apple terms on first connect). No-op when already seen or unavailable.
 */
export async function maybePresentTapToPayEducationAfterConnect() {
  if (!isTapToPayEducationAvailable()) {
    return { presented: false, reason: 'unavailable' };
  }

  if (await hasSeenTapToPayEducation()) {
    logTapToPayDebug('education.skip', { reason: 'already_seen' });
    return { presented: false, reason: 'already_seen' };
  }

  try {
    logTapToPayDebug('education.present.start', { trigger: 'after_connect' });
    await presentTapToPayEducation({ markSeen: true });
    logTapToPayDebug('education.present.ok', { trigger: 'after_connect' });
    return { presented: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Education could not be shown';
    logTapToPayDebug('education.present.failed', { message });
    return { presented: false, reason: 'error', message };
  }
}
