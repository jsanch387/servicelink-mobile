/** @typedef {'preparing' | 'success' | 'error'} TapToPayPhase */

/** @typedef {'loading_intent' | 'intent_error' | 'preparing' | 'processing' | 'success' | 'error'} TapToPaySheetPhase */

export const TAP_TO_PAY_RECEIPT_ROW_LABEL = 'Paid with card';

export const TAP_TO_PAY_SOMETHING_WENT_WRONG = 'Something went wrong';

export const TAP_TO_PAY_PAYMENT_NOT_COMPLETED = 'Payment not completed';

export const TAP_TO_PAY_PAYMENT_CANCELED = 'Payment was canceled.';

export const TAP_TO_PAY_PAYMENT_TIMED_OUT = 'Payment timed out. Try again or mark as paid.';

export const TAP_TO_PAY_PAYMENT_TIMED_OUT_TITLE = 'Payment timed out';

/** Short status line when {@link TAP_TO_PAY_PAYMENT_TIMED_OUT} is shown on the sheet. */
export const TAP_TO_PAY_PAYMENT_TIMED_OUT_STATUS = 'Payment timed out';

export const TAP_TO_PAY_SETUP_NOT_FINISHED = "Tap to Pay setup wasn't finished.";

export const TAP_TO_PAY_SETUP_NOT_FINISHED_TITLE = 'Tap to Pay not finished';

export const TAP_TO_PAY_PAYMENT_CANCELED_TITLE = 'Payment canceled';

export const TAP_TO_PAY_ERROR_RETRY_HINT =
  "Try again when you're ready, or mark as paid another way.";

export const TAP_TO_PAY_MERCHANT_LIMIT =
  "This iPhone has reached Apple's Tap to Pay merchant limit. Remove a merchant in Settings → Apple Account → Payment & Shipping, or try another iPhone.";

export const TAP_TO_PAY_TERMINAL_NOT_CONFIGURED =
  'Tap to Pay reader is not configured for your account yet.';

export const TAP_TO_PAY_PREPARING_COLD = 'Setting up Tap to Pay…';

export const TAP_TO_PAY_PREPARING_WARM = 'Opening Tap to Pay…';

export const TAP_TO_PAY_PREPARING_HINT =
  'Apple will show the contactless reader on your iPhone when it is ready.';

export const TAP_TO_PAY_PROCESSING_STATUS = 'Processing payment…';

export const TAP_TO_PAY_PROCESSING_HINT = 'Keep this screen open until payment completes.';

/** Apple checklist 5.1.3 — PaymentCardReaderError.osVersionNotSupported / unsupported iOS. */
export const TAP_TO_PAY_IOS_UPDATE_REQUIRED =
  'Tap to Pay on iPhone requires a newer version of iOS. Open Settings → General → Software Update, install the latest update, then try again.';

/** Short status line when {@link TAP_TO_PAY_IOS_UPDATE_REQUIRED} is shown on the sheet. */
export const TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS = 'Update iOS required';

/** @typedef {'intent' | 'collection'} TapToPayErrorContext */

/** Max length before we collapse API/terminal errors to the generic line. */
const TAP_TO_PAY_STATUS_LINE_MAX = 32;

/**
 * @param {string | null | undefined} code
 * @param {string | null | undefined} message
 */
export function isTapToPayCanceledTerminalError(code, message) {
  const normalizedCode = String(code ?? '')
    .trim()
    .toUpperCase();
  const lower = String(message ?? '').toLowerCase();
  if (normalizedCode.includes('CANCEL')) {
    return true;
  }
  return lower.includes('canceled') || lower.includes('cancelled');
}

/**
 * Stripe Terminal / reader timeouts during card presentation or collection.
 *
 * @param {string | null | undefined} code
 * @param {string | null | undefined} message
 */
export function isTapToPayTimeoutTerminalError(code, message) {
  const normalizedCode = String(code ?? '')
    .trim()
    .toUpperCase();
  const lower = String(message ?? '').toLowerCase();
  if (normalizedCode.includes('TIMEOUT') || normalizedCode === 'READER_BUSY') {
    return true;
  }
  return lower.includes('timed out') || lower.includes('timeout') || lower.includes('time out');
}

/**
 * Stripe often returns READER_SOFTWARE_UPDATE_FAILED when the merchant dismisses Apple linking.
 *
 * @param {string | null | undefined} code
 * @param {string | null | undefined} message
 */
export function isTapToPayAppleLinkTerminalError(code, message) {
  const normalizedCode = String(code ?? '')
    .trim()
    .toUpperCase();
  const lower = String(message ?? '').toLowerCase();
  if (normalizedCode === 'READER_MERCHANT_BLOCKED') {
    return true;
  }
  if (normalizedCode !== 'READER_SOFTWARE_UPDATE_FAILED') {
    return false;
  }
  return (
    lower.includes('link merchant') || lower.includes('apple id') || lower.includes('good standing')
  );
}

/**
 * User-facing hint under the sheet title — never show raw Stripe SDK paragraphs.
 *
 * @param {string | null | undefined} message
 * @param {TapToPayErrorContext} [context='collection']
 */
export function formatTapToPayErrorHint(message, context = 'collection') {
  const text = message?.trim();
  if (!text) {
    return context === 'collection' ? TAP_TO_PAY_ERROR_RETRY_HINT : null;
  }

  const lower = text.toLowerCase();
  if (isTapToPayCanceledTerminalError(null, text)) {
    return TAP_TO_PAY_ERROR_RETRY_HINT;
  }
  if (isTapToPayTimeoutTerminalError(null, text) || text === TAP_TO_PAY_PAYMENT_TIMED_OUT) {
    return TAP_TO_PAY_ERROR_RETRY_HINT;
  }
  if (
    lower.includes('link merchant') ||
    lower.includes('apple id') ||
    lower.includes('merchant limit') ||
    text === TAP_TO_PAY_SETUP_NOT_FINISHED ||
    text === TAP_TO_PAY_MERCHANT_LIMIT
  ) {
    return TAP_TO_PAY_ERROR_RETRY_HINT;
  }
  if (lower.includes('declined')) {
    return TAP_TO_PAY_ERROR_RETRY_HINT;
  }
  if (text.length <= 96) {
    return text;
  }
  return TAP_TO_PAY_ERROR_RETRY_HINT;
}

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

  if (text === TAP_TO_PAY_PAYMENT_CANCELED || isTapToPayCanceledTerminalError(null, text)) {
    return context === 'collection' ? 'Payment canceled' : 'Setup canceled';
  }
  if (text === TAP_TO_PAY_PAYMENT_TIMED_OUT || isTapToPayTimeoutTerminalError(null, text)) {
    return TAP_TO_PAY_PAYMENT_TIMED_OUT_STATUS;
  }
  if (text === TAP_TO_PAY_SETUP_NOT_FINISHED || text === TAP_TO_PAY_MERCHANT_LIMIT) {
    return context === 'collection'
      ? text === TAP_TO_PAY_MERCHANT_LIMIT
        ? 'Merchant limit reached'
        : 'Setup not finished'
      : TAP_TO_PAY_SOMETHING_WENT_WRONG;
  }
  if (
    isTapToPayAppleLinkTerminalError(null, text) ||
    lower.includes('link merchant') ||
    lower.includes('apple id') ||
    lower.includes('good standing')
  ) {
    return context === 'collection' ? 'Setup not finished' : TAP_TO_PAY_SOMETHING_WENT_WRONG;
  }
  if (lower.includes('merchant limit')) {
    return 'Merchant limit reached';
  }

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
  if (
    lower.includes('requires a newer version of ios') ||
    lower.includes('os version not supported') ||
    lower.includes('software update')
  ) {
    return TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS;
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

  if (phase === 'preparing') {
    return {
      title: 'Tap to Pay',
      hint: TAP_TO_PAY_PREPARING_HINT,
      statusLine: TAP_TO_PAY_PREPARING_COLD,
    };
  }

  return {
    title: 'Tap to Pay',
    hint: TAP_TO_PAY_PREPARING_HINT,
    statusLine: TAP_TO_PAY_PREPARING_COLD,
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
 * @param {{ readerWasWarm?: boolean }} [options]
 */
export function resolveTapToPaySheetCopy(phase, amountDue, intentError, options = {}) {
  if (phase === 'loading_intent') {
    return {
      title: 'Tap to Pay',
      hint: TAP_TO_PAY_PREPARING_HINT,
      statusLine: options.readerWasWarm ? TAP_TO_PAY_PREPARING_WARM : TAP_TO_PAY_PREPARING_COLD,
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
    const statusLine = formatTapToPayErrorStatusLine(intentError, 'collection');
    let title = TAP_TO_PAY_PAYMENT_NOT_COMPLETED;
    if (statusLine === 'Payment canceled') {
      title = TAP_TO_PAY_PAYMENT_CANCELED_TITLE;
    } else if (statusLine === TAP_TO_PAY_PAYMENT_TIMED_OUT_STATUS) {
      title = TAP_TO_PAY_PAYMENT_TIMED_OUT_TITLE;
    } else if (statusLine === 'Setup not finished') {
      title = TAP_TO_PAY_SETUP_NOT_FINISHED_TITLE;
    }

    return {
      title,
      hint: formatTapToPayErrorHint(intentError, 'collection'),
      statusLine,
    };
  }

  if (phase === 'preparing') {
    return {
      title: 'Tap to Pay',
      hint: TAP_TO_PAY_PREPARING_HINT,
      statusLine: options.readerWasWarm ? TAP_TO_PAY_PREPARING_WARM : TAP_TO_PAY_PREPARING_COLD,
    };
  }

  if (phase === 'processing') {
    return {
      title: 'Tap to Pay',
      hint: TAP_TO_PAY_PROCESSING_HINT,
      statusLine: TAP_TO_PAY_PROCESSING_STATUS,
    };
  }

  const mappedPhase = phase === 'success' ? phase : 'preparing';
  return getTapToPayCopy(mappedPhase, amountDue);
}
