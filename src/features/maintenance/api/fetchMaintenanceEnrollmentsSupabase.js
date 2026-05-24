import { supabase } from '../../../lib/supabase';

/** @typedef {import('../../customers/api/fetchCustomersApi').CustomerMaintenanceEnrollmentSummary} CustomerMaintenanceEnrollmentSummary */
/** @typedef {import('../../customers/api/fetchCustomersApi').CustomersApiCustomer} CustomersApiCustomer */

const ENROLLMENT_SELECT =
  'id, customer_id, status, payment_status, service_name_snapshot, price_cents, frequency_weeks, duration_minutes, anchor_date, anchor_time, customer_invite_token, created_at';

const CUSTOMER_SELECT = 'id, full_name, email';

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {CustomerMaintenanceEnrollmentSummary | null}
 */
export function parseMaintenanceEnrollmentRow(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }
  const enrollmentId = String(row.id ?? row.enrollmentId ?? row.enrollment_id ?? '').trim();
  if (!enrollmentId) {
    return null;
  }
  return {
    enrollmentId,
    status: String(row.status ?? '').trim(),
    paymentStatus: String(row.payment_status ?? row.paymentStatus ?? '').trim(),
    serviceNameSnapshot: String(
      row.service_name_snapshot ?? row.serviceNameSnapshot ?? 'Maintenance',
    ).trim(),
    priceCents: Number(row.price_cents ?? row.priceCents ?? 0),
    frequencyWeeks: Number(row.frequency_weeks ?? row.frequencyWeeks ?? 0),
    durationMinutes: Number(row.duration_minutes ?? row.durationMinutes ?? 0),
    anchorDate:
      row.anchor_date != null
        ? String(row.anchor_date)
        : row.anchorDate != null
          ? String(row.anchorDate)
          : null,
    anchorTime:
      row.anchor_time != null
        ? String(row.anchor_time)
        : row.anchorTime != null
          ? String(row.anchorTime)
          : null,
    inviteToken:
      row.customer_invite_token != null
        ? String(row.customer_invite_token)
        : row.invite_token != null
          ? String(row.invite_token)
          : row.inviteToken != null
            ? String(row.inviteToken)
            : null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} customerRow
 * @param {Record<string, unknown> | null | undefined} enrollmentRow
 * @returns {CustomersApiCustomer | null}
 */
export function mapMaintenanceCustomerRecord(customerRow, enrollmentRow) {
  if (!customerRow || !enrollmentRow) {
    return null;
  }
  const id = String(customerRow.id ?? '').trim();
  if (!id) {
    return null;
  }
  const maintenanceEnrollment = parseMaintenanceEnrollmentRow(enrollmentRow);
  if (!maintenanceEnrollment) {
    return null;
  }
  const visitsRaw =
    customerRow.maintenance_visits_completed ?? customerRow.maintenanceVisitsCompleted;
  const maintenanceVisitsCompleted =
    typeof visitsRaw === 'number' && Number.isFinite(visitsRaw) ? visitsRaw : undefined;

  return {
    id,
    fullName:
      String(customerRow.full_name ?? customerRow.fullName ?? 'Customer').trim() || 'Customer',
    email: String(customerRow.email ?? '').trim(),
    maintenanceEnrollment,
    maintenanceVisitsCompleted,
  };
}

/**
 * Latest enrollment per customer for a business (matches web `GET /api/customers` attach).
 *
 * @param {string} businessId
 * @returns {Promise<{ customers: CustomersApiCustomer[]; error: Error | null }>}
 */
export async function fetchLatestMaintenanceEnrollmentsByBusiness(businessId) {
  const { data: enrollmentRows, error: enrollmentError } = await supabase
    .from('maintenance_enrollments')
    .select(ENROLLMENT_SELECT)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (enrollmentError) {
    return { customers: [], error: enrollmentError };
  }

  /** @type {Map<string, Record<string, unknown>>} */
  const latestByCustomerId = new Map();
  for (const row of enrollmentRows ?? []) {
    const customerId = String(row.customer_id ?? '').trim();
    if (!customerId || latestByCustomerId.has(customerId)) {
      continue;
    }
    latestByCustomerId.set(customerId, row);
  }

  const customerIds = [...latestByCustomerId.keys()];
  if (customerIds.length === 0) {
    return { customers: [], error: null };
  }

  const { data: customerRows, error: customerError } = await supabase
    .from('customers')
    .select(CUSTOMER_SELECT)
    .eq('business_id', businessId)
    .in('id', customerIds);

  if (customerError) {
    return { customers: [], error: customerError };
  }

  const customerById = new Map((customerRows ?? []).map((row) => [String(row.id), row]));
  const customers = customerIds
    .map((customerId) =>
      mapMaintenanceCustomerRecord(
        customerById.get(customerId),
        latestByCustomerId.get(customerId),
      ),
    )
    .filter(Boolean);

  return { customers, error: null };
}

/**
 * @param {string} businessId
 * @param {string} customerId
 * @returns {Promise<{ customer: CustomersApiCustomer | null; error: Error | null }>}
 */
export async function fetchLatestMaintenanceEnrollmentForCustomer(businessId, customerId) {
  const { data: enrollmentRow, error: enrollmentError } = await supabase
    .from('maintenance_enrollments')
    .select(ENROLLMENT_SELECT)
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollmentError) {
    return { customer: null, error: enrollmentError };
  }
  if (!enrollmentRow) {
    return { customer: null, error: null };
  }

  const { data: customerRow, error: customerError } = await supabase
    .from('customers')
    .select(CUSTOMER_SELECT)
    .eq('business_id', businessId)
    .eq('id', customerId)
    .maybeSingle();

  if (customerError) {
    return { customer: null, error: customerError };
  }

  return {
    customer: mapMaintenanceCustomerRecord(customerRow, enrollmentRow),
    error: null,
  };
}

/**
 * @param {string} businessId
 * @param {string} customerId
 * @param {string} enrollmentId
 * @returns {Promise<{ customer: CustomersApiCustomer | null; error: Error | null }>}
 */
export async function fetchMaintenanceEnrollmentById(businessId, customerId, enrollmentId) {
  const { data: enrollmentRow, error: enrollmentError } = await supabase
    .from('maintenance_enrollments')
    .select(ENROLLMENT_SELECT)
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .eq('id', enrollmentId)
    .maybeSingle();

  if (enrollmentError) {
    return { customer: null, error: enrollmentError };
  }
  if (!enrollmentRow) {
    return { customer: null, error: null };
  }

  const { data: customerRow, error: customerError } = await supabase
    .from('customers')
    .select(CUSTOMER_SELECT)
    .eq('business_id', businessId)
    .eq('id', customerId)
    .maybeSingle();

  if (customerError) {
    return { customer: null, error: customerError };
  }

  return {
    customer: mapMaintenanceCustomerRecord(customerRow, enrollmentRow),
    error: null,
  };
}
