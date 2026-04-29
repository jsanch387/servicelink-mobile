import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';
import { CUSTOMER_PAYMENT_METHOD } from '../constants/customerPaymentMethods';

const VALID_CHECKOUT = new Set(['in_person', 'in_app', 'customer_choice']);

/** DB `checkout_mode` → mobile radio `CUSTOMER_PAYMENT_METHOD` id. */
const CHECKOUT_DB_TO_UI = {
  in_person: CUSTOMER_PAYMENT_METHOD.IN_PERSON_ONLY,
  in_app: CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY,
  customer_choice: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
};

const CHECKOUT_UI_TO_DB = {
  [CUSTOMER_PAYMENT_METHOD.IN_PERSON_ONLY]: 'in_person',
  [CUSTOMER_PAYMENT_METHOD.IN_APP_ONLY]: 'in_app',
  [CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES]: 'customer_choice',
};

/** Mobile radio id → `payment_settings.checkout_mode`. */
export function mapUiCheckoutMethodToCheckoutMode(uiId) {
  const key = CHECKOUT_UI_TO_DB[uiId];
  return key ?? 'customer_choice';
}

/**
 * @typedef {object} PaymentFormHydration
 * @property {boolean} paymentsEnabled
 * @property {string} selectedMethodId
 * @property {boolean} requireDeposits
 * @property {string} depositAmount
 * @property {string} depositMode - `DEPOSIT_AMOUNT_MODE` value
 */

/**
 * Fixed `deposit_value` is stored in cents — show dollars in the text field.
 *
 * @param {number} cents
 */
export function centsToDepositAmountString(cents) {
  const c = Math.round(Number(cents));
  if (!Number.isFinite(c)) return '0';
  const dollars = c / 100;
  if (Number.isInteger(dollars)) return String(dollars);
  const s = dollars.toFixed(2);
  return s.replace(/\.?0+$/, '') || '0';
}

/**
 * Percent `deposit_value` is whole 0–100.
 *
 * @param {number} pct
 */
export function percentDepositToAmountString(pct) {
  const n = Math.round(Number(pct));
  if (!Number.isFinite(n)) return '0';
  return String(Math.min(100, Math.max(0, n)));
}

/** Defaults when there is no `payment_settings` row (or before load). */
export function defaultPaymentFormHydration() {
  return {
    paymentsEnabled: false,
    selectedMethodId: CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES,
    requireDeposits: false,
    depositAmount: '0',
    depositMode: DEPOSIT_AMOUNT_MODE.PERCENTAGE,
  };
}

/**
 * Map a `payment_settings` row to mobile form state (read path; mirrors web `paymentSettingsRowToDashboardInitial` rules).
 *
 * @param {import('../api/fetchPaymentDashboard').PaymentSettingsRow | null | undefined} row
 * @returns {PaymentFormHydration}
 */
export function mapPaymentSettingsToFormHydration(row) {
  if (!row) {
    return defaultPaymentFormHydration();
  }

  const rawMode = row.checkout_mode;
  const checkoutMode =
    rawMode != null && typeof rawMode === 'string' && VALID_CHECKOUT.has(String(rawMode).trim())
      ? String(rawMode).trim()
      : null;

  const selectedMethodId =
    checkoutMode != null && CHECKOUT_DB_TO_UI[checkoutMode]
      ? CHECKOUT_DB_TO_UI[checkoutMode]
      : CUSTOMER_PAYMENT_METHOD.CUSTOMER_CHOOSES;

  const depositTypeRaw = row.deposit_type;
  const depositType =
    depositTypeRaw === 'fixed' || depositTypeRaw === 'percent' ? depositTypeRaw : 'percent';

  const depositMode =
    depositType === 'fixed' ? DEPOSIT_AMOUNT_MODE.FIXED : DEPOSIT_AMOUNT_MODE.PERCENTAGE;

  const rawVal = row.deposit_value;
  const n = typeof rawVal === 'number' ? rawVal : Number(rawVal);
  const depositValue = Number.isFinite(n) ? n : 0;

  const depositAmount =
    depositType === 'fixed'
      ? centsToDepositAmountString(depositValue)
      : percentDepositToAmountString(depositValue);

  return {
    paymentsEnabled: Boolean(row.payments_enabled),
    selectedMethodId,
    requireDeposits: Boolean(row.deposits_enabled),
    depositAmount,
    depositMode,
  };
}
