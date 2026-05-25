import { productionWebApiHttpsGuard } from '../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';

/**
 * @typedef {object} CustomerMaintenanceEnrollmentSummary
 * @property {string} enrollmentId
 * @property {string} status
 * @property {string} paymentStatus
 * @property {string | null} [customerSelectedPayment]
 * @property {string} serviceNameSnapshot
 * @property {number} priceCents
 * @property {number} frequencyWeeks
 * @property {number} durationMinutes
 * @property {string | null} [anchorDate]
 * @property {string | null} [anchorTime]
 * @property {string | null} [inviteToken]
 * @property {string | null} [initialBookingId]
 * @property {string | null} [linkedBookingStatus]
 */

/**
 * @typedef {object} CustomersApiCustomer
 * @property {string} id
 * @property {string} fullName
 * @property {string} email
 * @property {CustomerMaintenanceEnrollmentSummary | null | undefined} maintenanceEnrollment
 * @property {number | undefined} maintenanceVisitsCompleted
 */

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {unknown} row
 * @returns {CustomerMaintenanceEnrollmentSummary | null}
 */
function parseMaintenanceEnrollment(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }
  const enrollmentId = String(row.enrollmentId ?? row.enrollment_id ?? '').trim();
  if (!enrollmentId) {
    return null;
  }
  return {
    enrollmentId,
    status: String(row.status ?? '').trim(),
    paymentStatus: String(row.paymentStatus ?? row.payment_status ?? '').trim(),
    customerSelectedPayment:
      row.customerSelectedPayment != null
        ? String(row.customerSelectedPayment)
        : row.customer_selected_payment != null
          ? String(row.customer_selected_payment)
          : null,
    serviceNameSnapshot: String(
      row.serviceNameSnapshot ?? row.service_name_snapshot ?? 'Maintenance',
    ).trim(),
    priceCents: Number(row.priceCents ?? row.price_cents ?? 0),
    frequencyWeeks: Number(row.frequencyWeeks ?? row.frequency_weeks ?? 0),
    durationMinutes: Number(row.durationMinutes ?? row.duration_minutes ?? 0),
    anchorDate:
      row.anchorDate != null
        ? String(row.anchorDate)
        : row.anchor_date != null
          ? String(row.anchor_date)
          : null,
    anchorTime:
      row.anchorTime != null
        ? String(row.anchorTime)
        : row.anchor_time != null
          ? String(row.anchor_time)
          : null,
    inviteToken:
      row.inviteToken != null
        ? String(row.inviteToken)
        : row.invite_token != null
          ? String(row.invite_token)
          : null,
    initialBookingId:
      row.initialBookingId != null
        ? String(row.initialBookingId)
        : row.initial_booking_id != null
          ? String(row.initial_booking_id)
          : null,
    linkedBookingStatus: null,
  };
}

/**
 * @param {unknown} payload
 * @returns {CustomersApiCustomer[]}
 */
function parseCustomersPayload(payload) {
  const root = payload && typeof payload === 'object' ? payload : {};
  const data = root.data && typeof root.data === 'object' ? root.data : root;
  const list = Array.isArray(data.customers) ? data.customers : Array.isArray(data) ? data : [];

  return list
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }
      const id = String(row.id ?? '').trim();
      if (!id) {
        return null;
      }
      const maintenanceEnrollment = parseMaintenanceEnrollment(row.maintenanceEnrollment);
      const maintenanceVisitsCompletedRaw =
        row.maintenanceVisitsCompleted ?? row.maintenance_visits_completed;
      const maintenanceVisitsCompleted =
        typeof maintenanceVisitsCompletedRaw === 'number' &&
        Number.isFinite(maintenanceVisitsCompletedRaw)
          ? maintenanceVisitsCompletedRaw
          : undefined;
      const fullName = String(row.fullName ?? row.full_name ?? row.name ?? '').trim();
      const email = String(row.email ?? '').trim();
      return {
        id,
        fullName: fullName || 'Customer',
        email,
        maintenanceEnrollment,
        maintenanceVisitsCompleted,
      };
    })
    .filter(Boolean);
}

/**
 * `GET /api/customers` — owner CRM list with latest `maintenanceEnrollment` per customer.
 *
 * @param {string | null | undefined} accessToken
 * @returns {Promise<
 *   | { ok: true; customers: CustomersApiCustomer[] }
 *   | { ok: false; error: Error; httpStatus: number }
 * >}
 */
export async function fetchCustomersApi(accessToken) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }

  const requestId = createRequestId();

  let res;
  try {
    res = await fetch(`${origin}/api/customers`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Request-ID': requestId,
      },
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
    };
  }

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  const serverError =
    typeof payload?.error === 'string'
      ? payload.error
      : typeof payload?.message === 'string'
        ? payload.message
        : null;

  if (res.ok && (payload?.success === true || res.status === 200)) {
    return { ok: true, customers: parseCustomersPayload(payload) };
  }

  const msg =
    serverError ||
    (res.status === 401
      ? 'Sign in to load customers.'
      : `Could not load customers (${res.status}).`);
  return { ok: false, error: new Error(msg), httpStatus: res.status };
}
