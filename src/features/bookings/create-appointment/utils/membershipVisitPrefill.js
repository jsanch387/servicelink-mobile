import { minutesToServiceDurationHHmm } from '../../../../components/ui/durationTime';

/**
 * Route params for owner create-appointment when booking a membership period visit.
 * Mirrors web `getOwnerCreateAppointmentPath` query fields, plus subscription-linked
 * `initialBookingId` for address/vehicle prefill.
 *
 * @typedef {{
 *   membershipId: string;
 *   customerId: string;
 *   initialBookingId: string;
 *   customerName: string;
 *   customerEmail: string;
 *   customerPhone: string;
 *   notes: string;
 *   planName: string;
 *   durationMinutes: number;
 * }} MembershipVisitPrefill
 */

/**
 * @param {Record<string, unknown> | null | undefined} params
 * @returns {MembershipVisitPrefill | null}
 */
export function parseMembershipVisitRouteParams(params) {
  const membershipId = String(params?.membershipId ?? '').trim();
  if (!membershipId) return null;

  const durationRaw = Math.round(Number(params?.durationMinutes) || 0);
  const durationMinutes = durationRaw > 0 ? durationRaw : 60;

  return {
    membershipId,
    customerId: String(params?.customerId ?? '').trim(),
    initialBookingId: String(params?.initialBookingId ?? '').trim(),
    customerName: String(params?.customerName ?? params?.name ?? '').trim(),
    customerEmail: String(params?.customerEmail ?? params?.email ?? '').trim(),
    customerPhone: String(params?.customerPhone ?? params?.phone ?? '').trim(),
    notes: String(params?.notes ?? '').trim(),
    planName: String(params?.planName ?? '').trim() || 'Membership visit',
    durationMinutes,
  };
}

/**
 * @param {MembershipVisitPrefill} prefill
 */
export function membershipVisitCustomDurationHhMm(prefill) {
  return minutesToServiceDurationHHmm(prefill.durationMinutes) || '01:00';
}
