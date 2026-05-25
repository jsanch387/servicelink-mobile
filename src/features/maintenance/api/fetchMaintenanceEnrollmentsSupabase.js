import { supabase } from '../../../lib/supabase';
import { normalizeCalendarYyyyMmDd } from '../../customers/maintenance-invite/utils/formatPreferredDateDisplay';
import { enrichCustomersWithLinkedBookingStatuses } from './fetchLinkedBookingStatuses';

/** @typedef {import('../../customers/api/fetchCustomersApi').CustomerMaintenanceEnrollmentSummary} CustomerMaintenanceEnrollmentSummary */
/** @typedef {import('../../customers/api/fetchCustomersApi').CustomersApiCustomer} CustomersApiCustomer */

const ENROLLMENT_SELECT =
  'id, customer_id, status, payment_status, customer_selected_payment, service_name_snapshot, price_cents, frequency_weeks, duration_minutes, anchor_date, anchor_time, customer_invite_token, created_at, initial_booking_id';

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
    customerSelectedPayment:
      row.customer_selected_payment != null
        ? String(row.customer_selected_payment)
        : row.customerSelectedPayment != null
          ? String(row.customerSelectedPayment)
          : null,
    serviceNameSnapshot: String(
      row.service_name_snapshot ?? row.serviceNameSnapshot ?? 'Maintenance',
    ).trim(),
    priceCents: Number(row.price_cents ?? row.priceCents ?? 0),
    frequencyWeeks: Number(row.frequency_weeks ?? row.frequencyWeeks ?? 0),
    durationMinutes: Number(row.duration_minutes ?? row.durationMinutes ?? 0),
    anchorDate: (() => {
      const raw =
        row.anchor_date != null
          ? String(row.anchor_date)
          : row.anchorDate != null
            ? String(row.anchorDate)
            : '';
      const normalized = normalizeCalendarYyyyMmDd(raw);
      return normalized || null;
    })(),
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
    createdAt:
      row.created_at != null
        ? String(row.created_at)
        : row.createdAt != null
          ? String(row.createdAt)
          : null,
    initialBookingId:
      row.initial_booking_id != null
        ? String(row.initial_booking_id)
        : row.initialBookingId != null
          ? String(row.initialBookingId)
          : null,
    linkedBookingStatus: null,
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
 * One inbox row per enrollment (same customer may appear more than once).
 *
 * @param {Map<string, Record<string, unknown>> | Record<string, Record<string, unknown>>} customerById
 * @param {Record<string, unknown>[]} enrollmentRows
 * @returns {CustomersApiCustomer[]}
 */
export function mapMaintenanceEnrollmentRowsForInbox(customerById, enrollmentRows) {
  const lookup =
    customerById instanceof Map ? customerById : new Map(Object.entries(customerById ?? {}));

  return (enrollmentRows ?? [])
    .map((enrollmentRow) => {
      const customerId = String(enrollmentRow.customer_id ?? enrollmentRow.customerId ?? '').trim();
      if (!customerId) {
        return null;
      }
      return mapMaintenanceCustomerRecord(lookup.get(customerId), enrollmentRow);
    })
    .filter(Boolean);
}

/**
 * All maintenance enrollments for a business inbox (newest first).
 *
 * @param {string} businessId
 * @returns {Promise<{ customers: CustomersApiCustomer[]; error: Error | null }>}
 */
export async function fetchMaintenanceEnrollmentsByBusiness(businessId) {
  const { data: enrollmentRows, error: enrollmentError } = await supabase
    .from('maintenance_enrollments')
    .select(ENROLLMENT_SELECT)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (enrollmentError) {
    return { customers: [], error: enrollmentError };
  }

  const rows = enrollmentRows ?? [];
  if (rows.length === 0) {
    return { customers: [], error: null };
  }

  const customerIds = [
    ...new Set(rows.map((row) => String(row.customer_id ?? '').trim()).filter(Boolean)),
  ];

  const { data: customerRows, error: customerError } = await supabase
    .from('customers')
    .select(CUSTOMER_SELECT)
    .eq('business_id', businessId)
    .in('id', customerIds);

  if (customerError) {
    return { customers: [], error: customerError };
  }

  const customerById = new Map((customerRows ?? []).map((row) => [String(row.id), row]));
  const customers = mapMaintenanceEnrollmentRowsForInbox(customerById, rows);

  const { customers: enriched } = await enrichCustomersWithLinkedBookingStatuses(customers);

  return { customers: enriched, error: null };
}

/** @deprecated Use {@link fetchMaintenanceEnrollmentsByBusiness}. */
export const fetchLatestMaintenanceEnrollmentsByBusiness = fetchMaintenanceEnrollmentsByBusiness;

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

  const customer = mapMaintenanceCustomerRecord(customerRow, enrollmentRow);
  if (!customer) {
    return { customer: null, error: null };
  }

  const { customers: enriched } = await enrichCustomersWithLinkedBookingStatuses([customer]);

  return { customer: enriched[0] ?? null, error: null };
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

  const customer = mapMaintenanceCustomerRecord(customerRow, enrollmentRow);
  if (!customer) {
    return { customer: null, error: null };
  }

  const { customers: enriched } = await enrichCustomersWithLinkedBookingStatuses([customer]);

  return { customer: enriched[0] ?? null, error: null };
}
