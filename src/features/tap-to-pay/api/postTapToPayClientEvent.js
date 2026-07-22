import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { getTapToPayClientDiagnostics } from '../utils/getTapToPayClientDiagnostics';
import { logTapToPayDebug, maskId } from '../utils/logTapToPayDebug';

/**
 * Best-effort Tap to Pay client diagnostic report (failure or success).
 * Persists onto `booking_tap_to_pay_intents` via the web API when a PI id is known.
 * Never throws — must not break collection UX.
 *
 * @param {{
 *   accessToken: string | null | undefined;
 *   bookingId: string | null | undefined;
 *   outcome?: 'failure' | 'success';
 *   stage: string;
 *   message?: string | null;
 *   code?: string | null;
 *   paymentIntentId?: string | null;
 *   httpStatus?: number | null;
 *   requestId?: string | null;
 *   durationMs?: number | null;
 * }} params
 */
export async function postTapToPayClientEvent({
  accessToken,
  bookingId,
  outcome = 'failure',
  stage,
  message = null,
  code = null,
  paymentIntentId = null,
  httpStatus = null,
  requestId = null,
  durationMs = null,
}) {
  try {
    const origin = resolveStripeMobileCheckoutOrigin();
    if (productionWebApiHttpsGuard(origin) || !accessToken || !bookingId?.trim()) {
      return { ok: false };
    }

    const diagnostics = getTapToPayClientDiagnostics();
    const body = {
      outcome: outcome === 'success' ? 'success' : 'failure',
      stage: String(stage ?? 'unknown').slice(0, 80),
      message: message ? String(message).slice(0, 500) : null,
      code: code ? String(code).slice(0, 120) : null,
      paymentIntentId: paymentIntentId?.trim() || null,
      httpStatus: typeof httpStatus === 'number' ? httpStatus : null,
      requestId: requestId ? String(requestId).slice(0, 120) : null,
      durationMs:
        typeof durationMs === 'number' && Number.isFinite(durationMs)
          ? Math.round(durationMs)
          : null,
      diagnostics,
    };

    logTapToPayDebug('client-event.report', {
      bookingId: maskId(bookingId),
      outcome: body.outcome,
      stage: body.stage,
      code: body.code,
      paymentIntentId: maskId(body.paymentIntentId),
      appVersion: diagnostics.appVersion,
      osVersion: diagnostics.osVersion,
      readerWarm: diagnostics.readerWarm,
    });

    const encodedId = encodeURIComponent(bookingId.trim());
    const res = await fetch(
      `${origin}/api/availability/bookings/${encodedId}/tap-to-pay/client-event`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

/**
 * @deprecated Prefer {@link postTapToPayClientEvent} with outcome: 'failure'.
 */
export async function postTapToPayClientFailure(params) {
  return postTapToPayClientEvent({ ...params, outcome: 'failure' });
}
