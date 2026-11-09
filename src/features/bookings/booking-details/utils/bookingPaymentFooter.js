/**
 * Compact payment line under the balance.
 * The balance amount is its own row, so a due state is just "Due".
 *
 * @param {{
 *   visible?: boolean;
 *   status?: string;
 *   detail?: string | null;
 *   variant?: string | null;
 *   showMembershipMark?: boolean;
 *   accessibilityLabel?: string;
 * } | null | undefined} payment
 * @returns {{
 *   method: string;
 *   badge: string | null;
 *   tone: 'due' | 'paid' | 'muted';
 *   detail: string | null;
 *   accessibilityLabel: string;
 * } | null}
 */
export function bookingPaymentFooter(payment) {
  if (!payment?.visible) return null;
  const method = String(payment.status ?? '').trim();
  if (!method) return null;

  const detail = String(payment.detail ?? '').trim();
  const variant = payment.variant ?? null;
  const accessibilityLabel = String(payment.accessibilityLabel ?? '').trim() || method;

  if (variant === 'membership' || payment.showMembershipMark) {
    return { method, badge: null, tone: 'muted', detail: null, accessibilityLabel };
  }

  if (/^no charge$/i.test(detail)) {
    return { method, badge: 'No charge', tone: 'muted', detail: null, accessibilityLabel };
  }

  const dueAmount = detail.match(/(\$[\d,]+(?:\.\d{2})?)\s+due/i);
  if (dueAmount) {
    const payInPerson =
      variant === 'pay_in_person' || /pay in person/i.test(detail) || /pay in person/i.test(method);
    return {
      method: payInPerson ? 'Pay in person' : '',
      badge: 'Due',
      tone: 'due',
      detail: null,
      accessibilityLabel,
    };
  }

  const paid = variant === 'paid_full' || variant === 'session_paid' || /^paid\b/i.test(method);
  if (paid) {
    const moneyOnly = /^\$[\d,]+(?:\.\d{2})?$/.test(detail);
    return {
      method,
      badge: 'Paid',
      tone: 'paid',
      detail: detail && !moneyOnly ? detail : null,
      accessibilityLabel,
    };
  }

  if (detail) {
    return { method, badge: null, tone: 'muted', detail, accessibilityLabel };
  }

  return { method, badge: null, tone: 'muted', detail: null, accessibilityLabel };
}
