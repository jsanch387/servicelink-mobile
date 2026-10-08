import { DEPOSIT_AMOUNT_MODE } from '../../payments/constants/depositAmount';
import { CUSTOMER_PAYMENT_METHOD } from '../../payments/constants/customerPaymentMethods';

/** Methods the customer can be offered on a quote. */
export const QUOTE_PAYMENT_METHOD = Object.freeze({
  DEPOSIT: 'deposit',
  PAY_IN_FULL: 'pay_in_full',
  PAY_IN_PERSON: 'pay_in_person',
});

/** Value sent as `paymentCollection` on quote send. */
export const QUOTE_PAYMENT_COLLECTION = Object.freeze({
  NONE: 'none',
  DEPOSIT: 'deposit',
  FULL: 'full',
  CUSTOMER_CHOICE: 'customer_choice',
});

const METHOD_ORDER = [
  QUOTE_PAYMENT_METHOD.DEPOSIT,
  QUOTE_PAYMENT_METHOD.PAY_IN_FULL,
  QUOTE_PAYMENT_METHOD.PAY_IN_PERSON,
];

const METHOD_TITLES = {
  [QUOTE_PAYMENT_METHOD.DEPOSIT]: 'Require a deposit',
  [QUOTE_PAYMENT_METHOD.PAY_IN_FULL]: 'Require full payment',
  [QUOTE_PAYMENT_METHOD.PAY_IN_PERSON]: 'Pay in person',
};

const SUMMARY_NAMES = {
  [QUOTE_PAYMENT_METHOD.DEPOSIT]: 'a deposit',
  [QUOTE_PAYMENT_METHOD.PAY_IN_FULL]: 'full payment',
  [QUOTE_PAYMENT_METHOD.PAY_IN_PERSON]: 'pay in person',
};

/**
 * @typedef {object} QuotePaymentAvailability
 * @property {boolean} cardsReady Stripe is ready and ServiceLink payments are on.
 * @property {boolean} deposit Deposit can be required on this quote.
 * @property {boolean} payInFull Full card payment can be required.
 * @property {boolean} payInPerson In-person payment is always offered.
 * @property {string | null} depositLabel e.g. `$50.00` or `25%`.
 */

/**
 * @param {unknown} methods
 * @returns {string[]}
 */
export function orderQuotePaymentMethods(methods) {
  const selected = new Set(Array.isArray(methods) ? methods.map((id) => String(id)) : []);
  return METHOD_ORDER.filter((id) => selected.has(id));
}

/**
 * @param {QuotePaymentAvailability} availability
 * @returns {string[]}
 */
export function availableQuotePaymentMethods(availability) {
  return METHOD_ORDER.filter((id) => isQuotePaymentMethodAvailable(id, availability));
}

/**
 * True when every method the business can offer is selected, and there is a real choice.
 *
 * @param {unknown} methods
 * @param {QuotePaymentAvailability} availability
 */
export function quotePaymentCustomerChooses(methods, availability) {
  const available = availableQuotePaymentMethods(availability);
  if (available.length < 2) return false;
  const selected = new Set(orderQuotePaymentMethods(methods));
  return available.every((id) => selected.has(id));
}

/**
 * @param {string} methodId
 * @param {QuotePaymentAvailability} availability
 */
export function isQuotePaymentMethodAvailable(methodId, availability) {
  if (methodId === QUOTE_PAYMENT_METHOD.DEPOSIT) return Boolean(availability?.deposit);
  if (methodId === QUOTE_PAYMENT_METHOD.PAY_IN_FULL) return Boolean(availability?.payInFull);
  if (methodId === QUOTE_PAYMENT_METHOD.PAY_IN_PERSON) return availability?.payInPerson !== false;
  return false;
}

/**
 * @param {{
 *   requireDeposits?: boolean;
 *   depositMode?: string;
 *   depositAmount?: string;
 * }} hydration
 * @returns {string | null}
 */
export function formatQuoteDepositLabel(hydration) {
  if (!hydration?.requireDeposits) return null;
  const raw = String(hydration.depositAmount ?? '')
    .replace(/[$,%\s]/g, '')
    .trim();
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (hydration.depositMode === DEPOSIT_AMOUNT_MODE.FIXED) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount);
  }

  const percent = Math.min(100, amount);
  if (percent <= 0) return null;
  const label = Number.isInteger(percent)
    ? String(percent)
    : String(Math.round(percent * 100) / 100);
  return `${label}%`;
}

/**
 * Card options need a connected Stripe account and ServiceLink payments turned on.
 * A deposit also needs a saved deposit amount.
 *
 * @param {{
 *   stripeConnectReady?: boolean;
 *   paymentsEnabled?: boolean;
 *   requireDeposits?: boolean;
 *   depositMode?: string;
 *   depositAmount?: string;
 * }} input
 * @returns {QuotePaymentAvailability}
 */
export function resolveQuotePaymentAvailability(input) {
  const cardsReady = Boolean(input?.stripeConnectReady && input?.paymentsEnabled);
  const depositLabel = formatQuoteDepositLabel({
    requireDeposits: input?.requireDeposits,
    depositMode: input?.depositMode,
    depositAmount: input?.depositAmount,
  });
  return {
    cardsReady,
    deposit: cardsReady && Boolean(depositLabel),
    payInFull: cardsReady,
    payInPerson: true,
    depositLabel,
  };
}

/**
 * Starting selection from the business payment settings. The owner can change it per quote.
 *
 * @param {QuotePaymentAvailability} availability
 * @param {string | null | undefined} checkoutMode `in_person` | `in_app` | `customer_choice`, or a payments-screen radio id.
 * @returns {string[]}
 */
export function defaultQuotePaymentMethods(availability, checkoutMode) {
  if (!availability?.payInFull) {
    return [QUOTE_PAYMENT_METHOD.PAY_IN_PERSON];
  }

  const mode = normalizeCheckoutMode(checkoutMode);
  if (mode === 'in_person') {
    return [QUOTE_PAYMENT_METHOD.PAY_IN_PERSON];
  }
  if (mode === 'in_app') {
    return availability.deposit
      ? [QUOTE_PAYMENT_METHOD.DEPOSIT]
      : [QUOTE_PAYMENT_METHOD.PAY_IN_FULL];
  }

  const methods = [];
  if (availability.deposit) methods.push(QUOTE_PAYMENT_METHOD.DEPOSIT);
  methods.push(QUOTE_PAYMENT_METHOD.PAY_IN_FULL);
  methods.push(QUOTE_PAYMENT_METHOD.PAY_IN_PERSON);
  return methods;
}

/**
 * @param {string | null | undefined} checkoutMode
 */
function normalizeCheckoutMode(checkoutMode) {
  const raw = String(checkoutMode ?? '').trim();
  if (raw === 'in_person' || raw === CUSTOMER_PAYMENT_METHOD.IN_PERSON_ONLY) return 'in_person';
  if (raw === 'in_app' || raw === CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY) return 'in_app';
  return 'customer_choice';
}

/**
 * Drop methods the business can no longer offer. Falls back to pay in person.
 *
 * @param {unknown} methods
 * @param {QuotePaymentAvailability} availability
 * @returns {string[]}
 */
export function sanitizeQuotePaymentMethods(methods, availability) {
  const next = orderQuotePaymentMethods(methods).filter((id) =>
    isQuotePaymentMethodAvailable(id, availability),
  );
  return next.length > 0 ? next : [QUOTE_PAYMENT_METHOD.PAY_IN_PERSON];
}

/**
 * @param {string[]} methods
 * @param {string} methodId
 * @returns {string[]}
 */
export function toggleQuotePaymentMethod(methods, methodId) {
  const current = orderQuotePaymentMethods(methods);
  if (!METHOD_ORDER.includes(methodId)) return current;
  if (current.includes(methodId)) {
    return current.filter((id) => id !== methodId);
  }
  return orderQuotePaymentMethods([...current, methodId]);
}

/**
 * @param {string} methodId
 * @param {string | null} [depositLabel]
 */
export function quotePaymentMethodSubtitle(methodId, depositLabel) {
  if (methodId === QUOTE_PAYMENT_METHOD.DEPOSIT) {
    return depositLabel ? `They pay a ${depositLabel} deposit.` : 'They pay a deposit.';
  }
  if (methodId === QUOTE_PAYMENT_METHOD.PAY_IN_FULL) {
    return 'They pay the full amount.';
  }
  return 'They pay when you meet.';
}

/**
 * @param {string} methodId
 */
export function quotePaymentMethodTitle(methodId) {
  return METHOD_TITLES[methodId] ?? methodId;
}

/**
 * @param {string[]} methods
 */
export function quotePaymentSelectionHint(methods) {
  const selected = orderQuotePaymentMethods(methods);
  if (selected.length === 0) return 'Choose at least one option.';
  if (selected.length === 1) return 'The customer will only see this option.';
  return 'The customer chooses among the options you selected.';
}

/**
 * @param {QuotePaymentAvailability} availability
 * @returns {string | null}
 */
export function quotePaymentUnavailableNote(availability) {
  if (!availability?.cardsReady) {
    return 'Connect Stripe in Payments to offer a deposit or full payment.';
  }
  if (!availability.deposit) {
    return 'Set a deposit in Payments to require one.';
  }
  return null;
}

/**
 * One tile per selected payment option for the review screen.
 * Deposit and full payment show a label plus the amount.
 *
 * @param {unknown} methods
 * @param {{ depositLabel?: string | null; totalLabel?: string | null }} [amounts]
 * @returns {Array<{ id: string; title: string; detail: string }>}
 */
export function quotePaymentReviewTiles(methods, amounts = {}) {
  const depositAmount = String(amounts.depositLabel ?? '').trim();
  const totalAmount = String(amounts.totalLabel ?? '').trim();
  return orderQuotePaymentMethods(methods).map((id) => {
    if (id === QUOTE_PAYMENT_METHOD.DEPOSIT) {
      return { id, title: 'Deposit', detail: depositAmount };
    }
    if (id === QUOTE_PAYMENT_METHOD.PAY_IN_FULL) {
      return { id, title: 'Full payment', detail: totalAmount };
    }
    return { id, title: 'In person', detail: 'On site' };
  });
}

/**
 * Review-screen line for the chosen methods.
 *
 * @param {unknown} methods
 */
export function quotePaymentSelectionSummary(methods) {
  const selected = orderQuotePaymentMethods(methods);
  if (selected.length === 0) return 'Choose how they pay';
  if (selected.length === 1) return METHOD_TITLES[selected[0]];
  if (selected.length === METHOD_ORDER.length) return 'Customer chooses';
  return `Customer chooses: ${formatChoiceList(selected.map((id) => SUMMARY_NAMES[id]))}`;
}

/**
 * @param {string[]} parts
 */
function formatChoiceList(parts) {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} or ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, or ${parts[parts.length - 1]}`;
}

/**
 * @param {unknown} methods
 * @param {QuotePaymentAvailability | null | undefined} [availability]
 * @returns {{ ok: true, methods: string[] } | { ok: false, message: string }}
 */
export function normalizeQuotePaymentOptions(methods, availability) {
  const raw = methods == null ? [QUOTE_PAYMENT_METHOD.PAY_IN_PERSON] : methods;
  if (!Array.isArray(raw)) {
    return { ok: false, message: 'Choose how the customer can pay.' };
  }

  const unknown = raw.some((id) => !METHOD_ORDER.includes(String(id)));
  const selected = orderQuotePaymentMethods(raw);
  if (unknown || selected.length === 0) {
    return { ok: false, message: 'Choose how the customer can pay.' };
  }

  if (availability) {
    const blocked = selected.find((id) => !isQuotePaymentMethodAvailable(id, availability));
    if (blocked === QUOTE_PAYMENT_METHOD.DEPOSIT) {
      return {
        ok: false,
        message: 'A deposit is not available with the current payment settings.',
      };
    }
    if (blocked === QUOTE_PAYMENT_METHOD.PAY_IN_FULL) {
      return {
        ok: false,
        message: 'Full card payment needs Stripe connected and ServiceLink payments turned on.',
      };
    }
    if (blocked) {
      return { ok: false, message: 'Choose how the customer can pay.' };
    }
  }

  return { ok: true, methods: selected };
}

/**
 * Maps the owner's selection to the send-body `paymentCollection` value.
 * One card method is required. Two or more means the customer chooses.
 * Pay in person alone does not collect payment to accept.
 *
 * @param {unknown} methods
 * @returns {'none' | 'deposit' | 'full' | 'customer_choice'}
 */
export function quotePaymentCollection(methods) {
  const selected = orderQuotePaymentMethods(methods);
  if (selected.length > 1) return QUOTE_PAYMENT_COLLECTION.CUSTOMER_CHOICE;
  if (selected[0] === QUOTE_PAYMENT_METHOD.DEPOSIT) return QUOTE_PAYMENT_COLLECTION.DEPOSIT;
  if (selected[0] === QUOTE_PAYMENT_METHOD.PAY_IN_FULL) return QUOTE_PAYMENT_COLLECTION.FULL;
  return QUOTE_PAYMENT_COLLECTION.NONE;
}
