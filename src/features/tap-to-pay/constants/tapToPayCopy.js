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

export const TAP_TO_PAY_ERROR_RETRY_HINT = 'Try again, or mark as paid.';

export const TAP_TO_PAY_TRY_AGAIN_HINT = 'Try again.';

export const TAP_TO_PAY_MERCHANT_LIMIT_HINT =
  "This iPhone can't add another business. Try a different iPhone.";

/** Internal identity for Apple's merchant cap. The screen shows {@link TAP_TO_PAY_MERCHANT_LIMIT_HINT}. */
export const TAP_TO_PAY_MERCHANT_LIMIT =
  "This iPhone has reached Apple's Tap to Pay merchant limit. Remove a merchant in Settings → Apple Account → Payment & Shipping, or try another iPhone.";

export const TAP_TO_PAY_TERMINAL_NOT_CONFIGURED =
  'Tap to Pay reader is not configured for your account yet.';

export const TAP_TO_PAY_READER_NOT_CONNECTED =
  'Tap to Pay lost connection on this iPhone. Try again — keep the app open while collecting.';

export const TAP_TO_PAY_READER_NOT_CONNECTED_STATUS = "Couldn't connect";

export const TAP_TO_PAY_READER_NOT_CONNECTED_HINT = 'Try again and keep the app open.';

export const TAP_TO_PAY_PREPARING_COLD = 'Setting up Tap to Pay';

export const TAP_TO_PAY_PREPARING_WARM = 'Opening Tap to Pay';

export const TAP_TO_PAY_PREPARING_HINT =
  'Apple will show the contactless reader on your iPhone when it is ready.';

export const TAP_TO_PAY_PROCESSING_STATUS = 'Processing payment';

export const TAP_TO_PAY_PROCESSING_HINT = 'Keep this screen open until payment completes.';

/** Apple checklist 5.1.3 — PaymentCardReaderError.osVersionNotSupported / unsupported iOS. */
export const TAP_TO_PAY_IOS_UPDATE_REQUIRED =
  'Tap to Pay on iPhone requires a newer version of iOS. Open Settings → General → Software Update, install the latest update, then try again.';

/** Short status line when {@link TAP_TO_PAY_IOS_UPDATE_REQUIRED} is shown on the sheet. */
export const TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS = 'Update your iPhone';

export const TAP_TO_PAY_IOS_UPDATE_REQUIRED_HINT = 'Update iOS in Settings, then try again.';

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
  if (
    text === TAP_TO_PAY_IOS_UPDATE_REQUIRED ||
    lower.includes('newer version of ios') ||
    lower.includes('os version not supported') ||
    lower.includes('software update')
  ) {
    return TAP_TO_PAY_IOS_UPDATE_REQUIRED_HINT;
  }
  if (text === TAP_TO_PAY_MERCHANT_LIMIT || lower.includes('merchant limit')) {
    return TAP_TO_PAY_MERCHANT_LIMIT_HINT;
  }
  if (
    text === TAP_TO_PAY_READER_NOT_CONNECTED ||
    lower.includes('no reader is connected') ||
    lower.includes('connect to a reader') ||
    lower.includes('lost connection')
  ) {
    return TAP_TO_PAY_READER_NOT_CONNECTED_HINT;
  }
  if (isTapToPayCanceledTerminalError(null, text)) {
    return TAP_TO_PAY_ERROR_RETRY_HINT;
  }
  if (isTapToPayTimeoutTerminalError(null, text) || text === TAP_TO_PAY_PAYMENT_TIMED_OUT) {
    return TAP_TO_PAY_TRY_AGAIN_HINT;
  }
  if (lower.includes('declined')) {
    return 'Try another card, or mark as paid.';
  }
  if (
    lower.includes('link merchant') ||
    lower.includes('apple id') ||
    text === TAP_TO_PAY_SETUP_NOT_FINISHED
  ) {
    return TAP_TO_PAY_TRY_AGAIN_HINT;
  }
  if (lower.includes('sign in')) {
    return 'Sign in, then try again.';
  }
  if (lower.includes('nothing to collect')) {
    return 'Check the amount, then try again.';
  }
  if (lower.includes('network') || lower.includes('connection')) {
    return 'Check your internet, then try again.';
  }
  if (lower.includes('not found')) {
    return 'Go back and open the appointment again.';
  }
  if (lower.includes('mark work done')) {
    return 'Finish the visit, then take payment.';
  }
  if (lower.includes('too quickly')) {
    return 'Wait a moment, then try again.';
  }
  if (
    lower.includes('stripe') ||
    lower.includes('set up') ||
    lower.includes('setup') ||
    lower.includes('not configured') ||
    lower.includes('entitlement')
  ) {
    return 'Finish setup, then try again.';
  }
  return context === 'collection' ? TAP_TO_PAY_ERROR_RETRY_HINT : TAP_TO_PAY_TRY_AGAIN_HINT;
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
        ? 'Too many businesses'
        : "Setup didn't finish"
      : TAP_TO_PAY_SOMETHING_WENT_WRONG;
  }
  if (
    isTapToPayAppleLinkTerminalError(null, text) ||
    lower.includes('link merchant') ||
    lower.includes('apple id') ||
    lower.includes('good standing')
  ) {
    return context === 'collection' ? "Setup didn't finish" : TAP_TO_PAY_SOMETHING_WENT_WRONG;
  }
  if (lower.includes('merchant limit')) {
    return 'Too many businesses';
  }

  if (lower.includes('sign in')) {
    return 'Sign in again';
  }
  if (
    lower.includes('no reader is connected') ||
    lower.includes('connect to a reader') ||
    text === TAP_TO_PAY_READER_NOT_CONNECTED
  ) {
    return TAP_TO_PAY_READER_NOT_CONNECTED_STATUS;
  }
  if (
    lower.includes('terminal') ||
    lower.includes('reader') ||
    lower.includes('location') ||
    lower.includes('tap to pay reader') ||
    lower.includes('not configured')
  ) {
    return 'Not ready yet';
  }
  if (lower.includes('missing tap to pay on iphone') || lower.includes('entitlement')) {
    return 'Not available';
  }
  if (
    lower.includes('requires a newer version of ios') ||
    lower.includes('os version not supported') ||
    lower.includes('software update')
  ) {
    return TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS;
  }
  if (lower.includes('stripe') || lower.includes('set up') || lower.includes('setup')) {
    return "Payments aren't ready";
  }
  if (lower.includes('network') || lower.includes('connection')) {
    return 'No connection';
  }
  if (lower.includes('not found')) {
    return 'Appointment not found';
  }
  if (lower.includes('mark work done')) {
    return 'Finish the visit first';
  }
  if (lower.includes('too quickly')) {
    return 'Try again shortly';
  }
  if (lower.includes('nothing to collect')) {
    return 'Nothing to charge';
  }

  if (context === 'collection') {
    if (lower.includes('declined') || lower.includes('card')) {
      return 'Card declined';
    }
    if (lower.includes('reader') || lower.includes('connect')) {
      return TAP_TO_PAY_READER_NOT_CONNECTED_STATUS;
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
      title: 'Card declined',
      hint: 'Try another card, or mark as paid.',
      statusLine: 'Card declined',
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
      hint: formatTapToPayErrorHint(intentError, 'intent'),
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
    } else if (statusLine === "Setup didn't finish") {
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
