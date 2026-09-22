import { DetailsLeadRow, DetailsSectionCard } from '../../../../components/ui';

/**
 * @param {object} payment
 * @returns {{ icon: string; iconLibrary?: 'ionicons' | 'material-community' }}
 */
function paymentGlyph(payment) {
  if (payment.showMembershipMark || payment.variant === 'membership') {
    return { icon: 'repeat' };
  }
  if (payment.variant === 'session_paid') {
    const status = String(payment.status ?? '').toLowerCase();
    if (status.includes('tap')) return { icon: 'phone-portrait' };
    if (status.includes('cash')) {
      return { icon: 'cash-multiple', iconLibrary: 'material-community' };
    }
    if (status.includes('app')) return { icon: 'wallet' };
    return { icon: 'card' };
  }
  if (payment.variant === 'pay_in_person') {
    return { icon: 'cash-multiple', iconLibrary: 'material-community' };
  }
  if (payment.variant === 'deposit') return { icon: 'card-outline' };
  if (payment.variant === 'paid_full') return { icon: 'card' };
  return { icon: 'card-outline' };
}

/**
 * Compact payment status for booking details.
 *
 * @param {object} props
 * @param {object} props.payment — output of {@link buildBookingPaymentSection}
 */
export function BookingPaymentSection({ payment }) {
  if (!payment?.visible || !payment.status) {
    return null;
  }

  const { status, detail, accessibilityLabel } = payment;
  const glyph = paymentGlyph(payment);

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Payment">
      <DetailsLeadRow
        accessibilityLabel={accessibilityLabel}
        icon={glyph.icon}
        iconLibrary={glyph.iconLibrary}
        primary={status}
        secondary={detail}
      />
    </DetailsSectionCard>
  );
}
