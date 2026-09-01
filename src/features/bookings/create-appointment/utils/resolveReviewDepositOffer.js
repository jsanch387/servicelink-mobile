import { DEPOSIT_AMOUNT_MODE } from '../../../payments/constants/depositAmount';
import { CREATE_PAYMENT_MIN_AMOUNT } from '../../../payments/create-payment/utils/createPaymentAmount';
import { isPositiveDepositAmount } from '../../../payments/utils/depositAmountModel';

export const REVIEW_PAYMENT_CHOICE = {
  NONE: 'none',
  DEPOSIT: 'deposit',
};

/**
 * @param {string | number | null | undefined} raw
 */
function parseAmount(raw) {
  const n = parseFloat(String(raw ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Owner Review: whether we can offer “send a deposit link”, and the amount from Payments settings.
 *
 * @param {object} args
 * @param {{
 *   paymentsEnabled?: boolean;
 *   requireDeposits?: boolean;
 *   depositMode?: string;
 *   depositAmount?: string;
 * } | null | undefined} args.formHydration
 * @param {boolean} args.stripeConnectReady
 * @param {boolean} args.isMembershipVisit
 * @param {number} args.totalUsd
 * @returns {{ visible: boolean; depositUsd: number }}
 */
export function resolveReviewDepositOffer({
  formHydration,
  stripeConnectReady,
  isMembershipVisit,
  totalUsd,
}) {
  const hidden = { visible: false, depositUsd: 0 };

  if (isMembershipVisit) return hidden;
  if (!stripeConnectReady) return hidden;
  if (!formHydration?.paymentsEnabled || !formHydration.requireDeposits) return hidden;
  if (!isPositiveDepositAmount(formHydration.depositMode, formHydration.depositAmount)) {
    return hidden;
  }

  const total = Number(totalUsd);
  if (!Number.isFinite(total) || total <= 0) return hidden;

  const totalUsdRounded = Math.round(total * 100) / 100;
  let depositUsd = 0;
  if (formHydration.depositMode === DEPOSIT_AMOUNT_MODE.FIXED) {
    depositUsd = parseAmount(formHydration.depositAmount);
  } else {
    depositUsd = (totalUsdRounded * parseAmount(formHydration.depositAmount)) / 100;
  }

  if (!Number.isFinite(depositUsd) || depositUsd <= 0) return hidden;
  depositUsd = Math.min(Math.round(depositUsd * 100) / 100, totalUsdRounded);
  if (depositUsd < CREATE_PAYMENT_MIN_AMOUNT) return hidden;

  return { visible: true, depositUsd };
}
