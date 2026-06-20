/** @typedef {'pending' | 'success' | 'error'} TapToPayPhase */

/** @typedef {'loading_intent' | 'intent_error' | 'pending' | 'success' | 'error'} TapToPaySheetPhase */

export const TAP_TO_PAY_RECEIPT_ROW_LABEL = 'Paid with card';

export const TAP_TO_PAY_SOMETHING_WENT_WRONG = 'Something went wrong';

export const TAP_TO_PAY_PAYMENT_NOT_COMPLETED = 'Payment not completed';

export const TAP_TO_PAY_TERMINAL_NOT_CONFIGURED =
  'Tap to Pay reader is not configured for your account yet.';

export const TAP_TO_PAY_READY_HINT = 'Hold their card or phone near the top of your iPhone.';

/** @typedef {'intent' | 'collection'} TapToPayErrorContext */

/** Max length before we collapse API/terminal errors to the generic line. */
const TAP_TO_PAY_STATUS_LINE_MAX = 32;

/**
 * Short label under the error icon — keeps long server messages off the sheet.
 *
 * @param {string | null | undefined} message
 * @param {TapToPayErrorContext} [context='intent']
 */
export function formatTapToPayErrorStatusLine(message, context = 'intent') {
  const text = message?.trim();
  if (!text) {
    return context === 'collection'
      ? TAP_TO_PAY_PAYMENT_NOT_COMPLETED
      : TAP_TO_PAY_SOMETHING_WENT_WRONG;
  }

  const lower = text.toLowerCase();

  if (lower.includes('sign in')) {
    return 'Sign in required';
  }
  if (
    lower.includes('terminal') ||
    lower.includes('reader') ||
    lower.includes('location') ||
    lower.includes('tap to pay reader') ||
    lower.includes('not configured')
  ) {
    return 'Tap to Pay not configured';
  }
  if (lower.includes('missing tap to pay on iphone') || lower.includes('entitlement')) {
    return 'App build not Tap to Pay ready';
  }
  if (lower.includes('stripe') || lower.includes('set up') || lower.includes('setup')) {
    return 'Payments not set up';
  }
  if (lower.includes('network') || lower.includes('connection')) {
    return 'Connection issue';
  }
  if (lower.includes('not found')) {
    return 'Appointment not found';
  }
  if (lower.includes('mark work done')) {
    return 'Mark work done first';
  }
  if (lower.includes('too quickly')) {
    return 'Try again shortly';
  }
  if (lower.includes('nothing to collect')) {
    return 'Nothing to collect';
  }

  if (context === 'collection') {
    if (lower.includes('declined') || lower.includes('card')) {
      return 'Payment declined';
    }
    if (lower.includes('reader') || lower.includes('connect')) {
      return 'Reader issue';
    }
    if (lower.includes('payment failed') || lower.includes('not completed')) {
      return TAP_TO_PAY_PAYMENT_NOT_COMPLETED;
    }
    return text.length <= TAP_TO_PAY_STATUS_LINE_MAX ? text : TAP_TO_PAY_PAYMENT_NOT_COMPLETED;
  }

  if (lower.includes('couldn') || lower.includes('start tap to pay') || lower.includes('connect')) {
    return TAP_TO_PAY_SOMETHING_WENT_WRONG;
  }

  if (text.length <= TAP_TO_PAY_STATUS_LINE_MAX) {
    return text;
  }

  return TAP_TO_PAY_SOMETHING_WENT_WRONG;
}

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
      title: 'Tap to Pay',
      hint: TAP_TO_PAY_READY_HINT,
      statusLine: 'Ready to accept payment',
    };
  }

  return {
    title: 'Tap to Pay',
    hint: TAP_TO_PAY_READY_HINT,
    statusLine: 'Ready to accept payment',
  };
}

export function formatTapToPayAmount(amount) {
  return formatUsd(amount);
}

/**
 * Sheet copy for loading, intent failures, and collection phases.
 *
 * @param {TapToPaySheetPhase} phase
 * @param {number} amountDue
 * @param {string | null | undefined} intentError
 */
export function resolveTapToPaySheetCopy(phase, amountDue, intentError) {
  if (phase === 'loading_intent') {
    return {
      title: 'Tap to Pay',
      hint: null,
      statusLine: null,
    };
  }

  if (phase === 'intent_error') {
    return {
      title: 'Tap to Pay',
      hint: intentError?.trim() || null,
      statusLine: formatTapToPayErrorStatusLine(intentError, 'intent'),
    };
  }

  if (phase === 'error') {
    return {
      title: TAP_TO_PAY_PAYMENT_NOT_COMPLETED,
      hint: intentError?.trim() || null,
      statusLine: formatTapToPayErrorStatusLine(intentError, 'collection'),
    };
  }

  const mappedPhase = phase === 'pending' || phase === 'success' ? phase : 'pending';
  return getTapToPayCopy(mappedPhase, amountDue);
}
