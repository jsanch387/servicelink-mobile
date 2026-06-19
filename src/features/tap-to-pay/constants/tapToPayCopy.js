/** @typedef {'ready' | 'pending' | 'success' | 'error'} TapToPayPhase */

export const TAP_TO_PAY_RECEIPT_ROW_LABEL = 'Paid with card';

function formatUsd(amount) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * @param {TapToPayPhase} phase
 * @param {number} amountDue
 */
export function getTapToPayCopy(phase, amountDue) {
  const amount = formatUsd(amountDue);

  if (phase === 'success') {
    return {
      title: 'Payment received',
      hint: `${amount} was charged to the customer’s card.`,
      statusLine: 'Returning to your receipt',
    };
  }

  if (phase === 'error') {
    return {
      title: 'Payment declined',
      hint: 'The card couldn’t be read or was declined. Try again or choose another way to get paid.',
      statusLine: 'Payment not completed',
    };
  }

  if (phase === 'pending') {
    return {
      title: 'Processing',
      hint: `Authorizing ${amount}. Keep your phone steady until this finishes.`,
      statusLine: 'Contacting reader',
    };
  }

  return {
    title: 'Tap to Pay',
    hint: `Collect ${amount}. Have your customer hold their card or phone near the top of your device.`,
    statusLine: 'Ready to accept payment',
  };
}

/** @deprecated Use {@link TAP_TO_PAY_RECEIPT_ROW_LABEL} */
export function getTapToPayRowLabel() {
  return TAP_TO_PAY_RECEIPT_ROW_LABEL;
}

export function formatTapToPayAmount(amount) {
  return formatUsd(amount);
}
