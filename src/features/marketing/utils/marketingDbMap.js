import { isValidCalendarYyyyMmDd } from '../../quotes/utils/formatScheduledDateDisplay';
import { DEPOSIT_AMOUNT_MODE } from '../../payments/constants/depositAmount';
import { MARKETING_CAMPAIGN_KIND } from '../constants';

export const MARKETING_DISCOUNT_TYPE_DB = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
};

/**
 * @param {string | null | undefined} yyyyMmDd
 * @returns {string | null}
 */
export function yyyyMmDdToStartsAtIso(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  if (!isValidCalendarYyyyMmDd(s)) return null;
  return `${s}T00:00:00.000Z`;
}

/**
 * @param {string | null | undefined} yyyyMmDd
 * @returns {string | null}
 */
export function yyyyMmDdToEndsAtIso(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  if (!isValidCalendarYyyyMmDd(s)) return null;
  return `${s}T23:59:59.999Z`;
}

/**
 * @param {string | null | undefined} iso
 * @returns {string}
 */
export function isoToYyyyMmDd(iso) {
  const s = String(iso ?? '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

/**
 * @param {string | null | undefined} discountMode UI mode
 * @returns {'percentage' | 'fixed_amount'}
 */
export function discountModeToDb(discountMode) {
  return discountMode === DEPOSIT_AMOUNT_MODE.PERCENTAGE
    ? MARKETING_DISCOUNT_TYPE_DB.PERCENTAGE
    : MARKETING_DISCOUNT_TYPE_DB.FIXED_AMOUNT;
}

/**
 * @param {string | null | undefined} discountType DB type
 */
export function discountModeFromDb(discountType) {
  return discountType === MARKETING_DISCOUNT_TYPE_DB.FIXED_AMOUNT
    ? DEPOSIT_AMOUNT_MODE.FIXED
    : DEPOSIT_AMOUNT_MODE.PERCENTAGE;
}

/**
 * @param {object} row
 * @returns {import('./marketingCampaignModel').MarketingCampaign}
 */
export function mapPromoRowToCampaign(row) {
  const redemptionWrap = row?.promo_code_redemptions;
  const useCount = Array.isArray(redemptionWrap)
    ? Number(redemptionWrap[0]?.count ?? 0)
    : Number(redemptionWrap?.count ?? 0);

  const code = String(row?.code ?? '')
    .trim()
    .toUpperCase();

  return {
    id: String(row?.id ?? ''),
    kind: MARKETING_CAMPAIGN_KIND.PROMO_CODE,
    name: code,
    code,
    discountMode: discountModeFromDb(row?.discount_type),
    discountAmount: String(row?.discount_value ?? '').trim(),
    startDateYyyyMmDd: isoToYyyyMmDd(row?.starts_at),
    endDateYyyyMmDd: isoToYyyyMmDd(row?.ends_at),
    isEnabled: row?.is_active !== false,
    createdAtIso: String(row?.created_at ?? new Date().toISOString()),
    currentUseCount: Number.isFinite(useCount) ? useCount : 0,
    oneUsePerCustomer: row?.one_use_per_customer !== false,
  };
}

/**
 * @param {object} row
 * @returns {import('./marketingCampaignModel').MarketingCampaign}
 */
export function mapSaleRowToCampaign(row) {
  return {
    id: String(row?.id ?? ''),
    kind: MARKETING_CAMPAIGN_KIND.SALE,
    name: String(row?.name ?? '').trim(),
    discountMode: discountModeFromDb(row?.discount_type),
    discountAmount: String(row?.discount_value ?? '').trim(),
    startDateYyyyMmDd: isoToYyyyMmDd(row?.starts_at),
    endDateYyyyMmDd: isoToYyyyMmDd(row?.ends_at),
    isEnabled: row?.is_active !== false,
    createdAtIso: String(row?.created_at ?? new Date().toISOString()),
  };
}

/**
 * @param {import('./marketingCampaignModel').MarketingCampaign} campaign
 * @param {{ includeActive?: boolean }} [opts]
 */
export function campaignToPromoInsertPayload(campaign, opts = {}) {
  const useDates = Boolean(campaign.startDateYyyyMmDd && campaign.endDateYyyyMmDd);
  const payload = {
    code: String(campaign.code ?? '')
      .trim()
      .toUpperCase(),
    description: null,
    discount_type: discountModeToDb(campaign.discountMode),
    discount_value: Number(String(campaign.discountAmount ?? '').replace(/,/g, '')),
    starts_at: useDates ? yyyyMmDdToStartsAtIso(campaign.startDateYyyyMmDd) : null,
    ends_at: useDates ? yyyyMmDdToEndsAtIso(campaign.endDateYyyyMmDd) : null,
    one_use_per_customer: campaign.oneUsePerCustomer !== false,
  };
  if (opts.includeActive) {
    payload.is_active = campaign.isEnabled !== false;
  }
  return payload;
}

/**
 * @param {import('./marketingCampaignModel').MarketingCampaign} campaign
 * @param {{ includeActive?: boolean }} [opts]
 */
export function campaignToSaleInsertPayload(campaign, opts = {}) {
  const useDates = Boolean(campaign.startDateYyyyMmDd && campaign.endDateYyyyMmDd);
  const payload = {
    name: String(campaign.name ?? '')
      .trim()
      .slice(0, 64),
    description: null,
    discount_type: discountModeToDb(campaign.discountMode),
    discount_value: Number(String(campaign.discountAmount ?? '').replace(/,/g, '')),
    starts_at: useDates ? yyyyMmDdToStartsAtIso(campaign.startDateYyyyMmDd) : null,
    ends_at: useDates ? yyyyMmDdToEndsAtIso(campaign.endDateYyyyMmDd) : null,
  };
  if (opts.includeActive) {
    payload.is_active = campaign.isEnabled !== false;
  }
  return payload;
}

/**
 * @param {unknown} error
 */
export function marketingErrorMessage(error, fallback = 'Something went wrong. Try again.') {
  const raw = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  const msg = raw.trim();
  if (!msg) return fallback;
  if (/duplicate|unique/i.test(msg)) {
    return 'That promo code already exists. Try a different code.';
  }
  return msg;
}
