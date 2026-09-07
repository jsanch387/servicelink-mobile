import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  endJobLiveActivityNative,
  isJobLiveActivityAvailable,
  isJobLiveActivityNativeModuleLinked,
  startJobLiveActivityNative,
} from 'servicelink-job-live-activity';

const STARTED_AT_PREFIX = '@servicelink/jobLiveActivity.startedAt:';

function clean(value, fallback) {
  const text = String(value ?? '').trim();
  return text || fallback;
}

export async function readJobLiveActivityStartedAt(bookingId) {
  try {
    const raw = await AsyncStorage.getItem(`${STARTED_AT_PREFIX}${bookingId}`);
    const ms = Number(raw);
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  } catch {
    return null;
  }
}

async function persistStartedAt(bookingId, startedAtMs) {
  try {
    await AsyncStorage.setItem(`${STARTED_AT_PREFIX}${bookingId}`, String(startedAtMs));
  } catch {
    // Timer still starts; next restore may use Date.now().
  }
}

async function clearPersistedStartedAt(bookingId) {
  if (!bookingId) {
    return;
  }
  try {
    await AsyncStorage.removeItem(`${STARTED_AT_PREFIX}${bookingId}`);
  } catch {
    // Ending the island still proceeds.
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} booking
 */
export function jobLiveActivityFieldsFromBooking(booking) {
  if (!booking || typeof booking !== 'object') {
    return { customerName: 'Customer', serviceName: 'Job' };
  }
  return {
    customerName: clean(booking.customer_name ?? booking.customerName, 'Customer'),
    serviceName: clean(booking.service_name ?? booking.serviceName, 'Job'),
  };
}

/**
 * @returns {Promise<{ ok: boolean, reason?: string, message?: string }>}
 */
export async function startJobLiveActivity(booking, startedAtMs) {
  const bookingId = String(booking?.id ?? booking?.bookingId ?? '').trim();
  if (!bookingId) {
    return { ok: false, reason: 'missing_id' };
  }
  if (!isJobLiveActivityNativeModuleLinked()) {
    return { ok: false, reason: 'module_missing' };
  }
  const stored = await readJobLiveActivityStartedAt(bookingId);
  const resolvedStartedAt =
    Number.isFinite(startedAtMs) && startedAtMs > 0 ? startedAtMs : (stored ?? Date.now());
  if (stored == null) {
    await persistStartedAt(bookingId, resolvedStartedAt);
  }
  const fields = jobLiveActivityFieldsFromBooking(booking);
  try {
    await startJobLiveActivityNative({
      bookingId,
      customerName: fields.customerName,
      serviceName: fields.serviceName,
      startedAtMs: resolvedStartedAt,
    });
    return { ok: true, startedAtMs: resolvedStartedAt };
  } catch (error) {
    const message = String(error?.message ?? error ?? '').trim();
    return {
      ok: false,
      reason: isJobLiveActivityAvailable() ? 'native_error' : 'disabled',
      message: message || undefined,
    };
  }
}

export async function endJobLiveActivity(bookingId = '') {
  const id = String(bookingId ?? '').trim();
  await clearPersistedStartedAt(id);
  if (!isJobLiveActivityAvailable()) {
    return;
  }
  try {
    await endJobLiveActivityNative(id);
  } catch {
    // Same as start — never block complete / cancel / delete.
  }
}
