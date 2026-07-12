import { DEPOSIT_AMOUNT_MODE } from '../../../payments/constants/depositAmount';
import { isValidCalendarYyyyMmDd } from '../../../quotes/utils/formatScheduledDateDisplay';
import {
  formatMarketingDiscountLabel,
  isMarketingCampaignEnabled,
} from '../../../marketing/utils/marketingCampaignModel';
import { discountModeToDb } from '../../../marketing/utils/marketingDbMap';

/**
 * @param {string | null | undefined} yyyyMmDd
 * @returns {Date | null}
 */
function parseLocalYyyyMmDd(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  if (!isValidCalendarYyyyMmDd(s)) return null;
  const [y, mo, d] = s.split('-').map((x) => Number(x));
  return new Date(y, mo - 1, d);
}

/**
 * Whether a sale applies to a given appointment calendar date.
 * Enabled sales with no date window always qualify.
 * Enabled sales with a start+end window qualify when the appointment date is inclusive.
 *
 * @param {import('../../../marketing/utils/marketingCampaignModel').MarketingCampaign | null | undefined} sale
 * @param {string | null | undefined} appointmentYyyyMmDd
 */
export function saleQualifiesForAppointmentDate(sale, appointmentYyyyMmDd) {
  if (!sale || !isMarketingCampaignEnabled(sale)) return false;
  const appointment = parseLocalYyyyMmDd(appointmentYyyyMmDd);
  if (!appointment) return false;

  const start = parseLocalYyyyMmDd(sale.startDateYyyyMmDd);
  const end = parseLocalYyyyMmDd(sale.endDateYyyyMmDd);
  if (!start && !end) return true;
  if (!start || !end) return true;
  if (appointment < start) return false;
  if (appointment > end) return false;
  return true;
}

/**
 * Picks the qualifying active sale for an appointment date.
 * At most one sale should be `is_active`; if several qualify, prefer the first enabled match.
 *
 * @param {import('../../../marketing/utils/marketingCampaignModel').MarketingCampaign[]} sales
 * @param {string | null | undefined} appointmentYyyyMmDd
 */
export function pickActiveSaleForAppointmentDate(sales, appointmentYyyyMmDd) {
  const list = Array.isArray(sales) ? sales : [];
  return list.find((sale) => saleQualifiesForAppointmentDate(sale, appointmentYyyyMmDd)) ?? null;
}

/**
 * @param {number} subtotalCents
 * @param {import('../../../marketing/utils/marketingCampaignModel').MarketingCampaign | null | undefined} sale
 * @returns {number}
 */
export function computeSaleDiscountCents(subtotalCents, sale) {
  const subtotal = Math.max(0, Math.round(Number(subtotalCents) || 0));
  if (!sale || subtotal <= 0) return 0;

  const raw = Number(String(sale.discountAmount ?? '').replace(/,/g, ''));
  if (!Number.isFinite(raw) || raw <= 0) return 0;

  if (sale.discountMode === DEPOSIT_AMOUNT_MODE.PERCENTAGE) {
    const pct = Math.min(100, raw);
    return Math.min(subtotal, Math.round((subtotal * pct) / 100));
  }

  return Math.min(subtotal, Math.round(raw * 100));
}

/**
 * @param {object} args
 * @param {number} args.subtotalCents service + add-ons, pre-discount
 * @param {import('../../../marketing/utils/marketingCampaignModel').MarketingCampaign | null | undefined} args.sale
 * @returns {{
 *   sale: import('../../../marketing/utils/marketingCampaignModel').MarketingCampaign | null;
 *   subtotalCents: number;
 *   discountCents: number;
 *   totalCents: number;
 *   discountLabel: string;
 *   lineLabel: string;
 *   discountType: 'percentage' | 'fixed_amount' | null;
 *   discountValue: number | null;
 * } | null}
 */
export function buildAppliedSaleDiscount({ subtotalCents, sale }) {
  if (!sale) return null;
  const subtotal = Math.max(0, Math.round(Number(subtotalCents) || 0));
  const discountCents = computeSaleDiscountCents(subtotal, sale);
  if (discountCents <= 0) return null;

  const discountLabel = formatMarketingDiscountLabel(sale);
  const name = String(sale.name ?? '').trim() || 'Sale';

  return {
    sale,
    subtotalCents: subtotal,
    discountCents,
    totalCents: Math.max(0, subtotal - discountCents),
    discountLabel,
    lineLabel: `${name} · ${discountLabel}`,
    discountType: discountModeToDb(sale.discountMode),
    discountValue: Number(String(sale.discountAmount ?? '').replace(/,/g, '')) || null,
  };
}
