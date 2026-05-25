import { supabase } from '../../../lib/supabase';

/** @typedef {import('../../customers/api/fetchCustomersApi').CustomersApiCustomer} CustomersApiCustomer */

/**
 * @param {string[]} bookingIds
 * @returns {Promise<{ statusByBookingId: Map<string, string>; error: Error | null }>}
 */
export async function fetchBookingStatusByIds(bookingIds) {
  const ids = [...new Set(bookingIds.map((id) => String(id ?? '').trim()).filter(Boolean))];

  if (ids.length === 0) {
    return { statusByBookingId: new Map(), error: null };
  }

  const { data, error } = await supabase.from('bookings').select('id, status').in('id', ids);

  if (error) {
    return { statusByBookingId: new Map(), error };
  }

  /** @type {Map<string, string>} */
  const statusByBookingId = new Map();
  for (const row of data ?? []) {
    const id = String(row.id ?? '').trim();
    if (id) {
      statusByBookingId.set(id, String(row.status ?? '').trim());
    }
  }

  return { statusByBookingId, error: null };
}

/**
 * @param {CustomersApiCustomer[]} customers
 * @returns {string[]}
 */
export function collectInitialBookingIdsFromCustomers(customers) {
  const ids = [];
  for (const customer of customers) {
    const bookingId = String(customer.maintenanceEnrollment?.initialBookingId ?? '').trim();
    if (bookingId) {
      ids.push(bookingId);
    }
  }
  return ids;
}

/**
 * @param {CustomersApiCustomer[]} customers
 * @param {Map<string, string>} statusByBookingId
 * @returns {CustomersApiCustomer[]}
 */
export function attachLinkedBookingStatuses(customers, statusByBookingId) {
  return customers.map((customer) => {
    const enrollment = customer.maintenanceEnrollment;
    if (!enrollment) {
      return customer;
    }
    const initialBookingId = String(enrollment.initialBookingId ?? '').trim() || null;
    const linkedBookingStatus = initialBookingId
      ? (statusByBookingId.get(initialBookingId) ?? null)
      : null;

    return {
      ...customer,
      maintenanceEnrollment: {
        ...enrollment,
        linkedBookingStatus,
      },
    };
  });
}

/**
 * @param {CustomersApiCustomer[]} customers
 * @returns {Promise<{ customers: CustomersApiCustomer[]; error: Error | null }>}
 */
export async function enrichCustomersWithLinkedBookingStatuses(customers) {
  const bookingIds = collectInitialBookingIdsFromCustomers(customers);
  const { statusByBookingId, error } = await fetchBookingStatusByIds(bookingIds);
  if (error) {
    // Booking is optional enrichment — still show maintenance if status read fails.
    return { customers, error: null };
  }
  return {
    customers: attachLinkedBookingStatuses(customers, statusByBookingId),
    error: null,
  };
}
