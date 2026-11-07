import { mapSessionFeesToCents } from '../../bookings/booking-details/utils/buildJobCompletedPayload';

/**
 * @param {Array<{ label: string; amount: number; kind?: 'fee' | 'discount' }>} adjustments
 * @returns {Array<{ kind: 'fee' | 'discount'; label: string; amountCents: number }>}
 */
export function buildTapToPaySessionFees(adjustments) {
  return mapSessionFeesToCents(
    (adjustments ?? []).map((item) => ({
      label: item.label,
      amount: item.amount,
      kind: item.kind,
    })),
  );
}
