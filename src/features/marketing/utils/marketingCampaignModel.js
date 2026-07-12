import { DEPOSIT_AMOUNT_MODE } from '../../payments/constants/depositAmount';
import {
  isPositiveDepositAmount,
  sanitizeFixedDepositInput,
  sanitizePercentageDepositInput,
} from '../../payments/utils/depositAmountModel';
import { isValidCalendarYyyyMmDd } from '../../quotes/utils/formatScheduledDateDisplay';
import { MARKETING_CAMPAIGN_KIND } from '../constants';

/**
 * @typedef {object} MarketingCampaign
 * @property {string} id
 * @property {import('../constants').MarketingCampaignKind} kind
 * @property {string} name
 * @property {string} [code]
 * @property {import('../../payments/constants/depositAmount').DEPOSIT_AMOUNT_MODE} discountMode
 * @property {string} discountAmount
 * @property {string} startDateYyyyMmDd
 * @property {string} endDateYyyyMmDd
 * @property {boolean} [isEnabled]
 * @property {string} createdAtIso
 */

function createCampaignId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `campaign_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {string} raw
 */
export function sanitizePromoCodeInput(raw) {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24);
}

/**
 * @param {string} yyyyMmDd
 */
function parseLocalYyyyMmDd(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  if (!isValidCalendarYyyyMmDd(s)) return null;
  const [y, mo, d] = s.split('-').map((x) => Number(x));
  return new Date(y, mo - 1, d);
}

/**
 * @param {string} startDateYyyyMmDd
 * @param {string} endDateYyyyMmDd
 * @returns {import('../constants').MarketingCampaignStatus}
 */
export function deriveMarketingCampaignStatus(startDateYyyyMmDd, endDateYyyyMmDd) {
  const start = parseLocalYyyyMmDd(startDateYyyyMmDd);
  const end = parseLocalYyyyMmDd(endDateYyyyMmDd);
  if (!start || !end) return 'active';

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (todayStart < start) return 'scheduled';
  if (todayStart > end) return 'ended';
  return 'active';
}

/**
 * @param {import('../constants').MarketingCampaignKind} kind
 */
export function marketingKindLabel(kind) {
  return kind === MARKETING_CAMPAIGN_KIND.SALE ? 'Sale' : 'Promo code';
}

/**
 * @param {import('../constants').MarketingCampaignStatus} status
 */
export function marketingStatusLabel(status) {
  if (status === 'disabled') return 'Off';
  if (status === 'active') return 'Active';
  if (status === 'ended') return 'Ended';
  return 'Scheduled';
}

/**
 * @param {MarketingCampaign} campaign
 */
export function isMarketingCampaignEnabled(campaign) {
  return campaign.isEnabled !== false;
}

/**
 * @param {MarketingCampaign} campaign
 * @returns {import('../constants').MarketingCampaignStatus}
 */
export function getMarketingCampaignDisplayStatus(campaign) {
  if (!isMarketingCampaignEnabled(campaign)) return 'disabled';
  return deriveMarketingCampaignStatus(campaign.startDateYyyyMmDd, campaign.endDateYyyyMmDd);
}

/**
 * @param {MarketingCampaign} campaign
 */
export function formatMarketingDiscountLabel(campaign) {
  const amount = String(campaign.discountAmount ?? '').trim();
  if (!amount) return 'Discount';
  if (campaign.discountMode === DEPOSIT_AMOUNT_MODE.PERCENTAGE) {
    return `${amount}% off`;
  }
  return `$${amount} off`;
}

/**
 * @param {string} startDateYyyyMmDd
 * @param {string} endDateYyyyMmDd
 */
export function formatMarketingDateRangeShort(startDateYyyyMmDd, endDateYyyyMmDd) {
  const start = parseLocalYyyyMmDd(startDateYyyyMmDd);
  const end = parseLocalYyyyMmDd(endDateYyyyMmDd);
  if (!start && !end) return 'No date limit';
  if (!start || !end) return 'No date limit';
  const fmt = (dt) =>
    dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

/**
 * @param {MarketingCampaign} campaign
 */
export function campaignHasDateRange(campaign) {
  return (
    isValidCalendarYyyyMmDd(String(campaign.startDateYyyyMmDd ?? '').trim()) &&
    isValidCalendarYyyyMmDd(String(campaign.endDateYyyyMmDd ?? '').trim())
  );
}

/**
 * @param {object} draft
 * @param {import('../constants').MarketingCampaignKind} draft.kind
 * @param {string} draft.name
 * @param {string} draft.code
 * @param {string} draft.discountMode
 * @param {string} draft.discountAmount
 * @param {string} draft.startDateYyyyMmDd
 * @param {string} draft.endDateYyyyMmDd
 * @param {boolean} [draft.useDates]
 */
export function validateMarketingCampaignDraft(draft) {
  const errors = {};

  const kind = draft.kind;
  const code = sanitizePromoCodeInput(draft.code);

  if (kind === MARKETING_CAMPAIGN_KIND.PROMO_CODE) {
    if (code.length < 3) {
      errors.code = 'Use at least 3 letters or numbers.';
    }
  } else {
    const name = String(draft.name ?? '').trim();
    if (!name) errors.name = 'Give this offer a name.';
  }

  if (!isPositiveDepositAmount(draft.discountMode, draft.discountAmount)) {
    errors.discountAmount = 'Enter a discount greater than zero.';
  }

  if (draft.useDates) {
    const start = String(draft.startDateYyyyMmDd ?? '').trim();
    const end = String(draft.endDateYyyyMmDd ?? '').trim();
    if (!isValidCalendarYyyyMmDd(start)) {
      errors.startDateYyyyMmDd = 'Choose a start date.';
    }
    if (!isValidCalendarYyyyMmDd(end)) {
      errors.endDateYyyyMmDd = 'Choose an end date.';
    }
    if (isValidCalendarYyyyMmDd(start) && isValidCalendarYyyyMmDd(end)) {
      const startDt = parseLocalYyyyMmDd(start);
      const endDt = parseLocalYyyyMmDd(end);
      if (startDt && endDt && endDt < startDt) {
        errors.endDateYyyyMmDd = 'End date must be on or after the start date.';
      }
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}

/**
 * @param {object} draft
 */
export function buildMarketingCampaignFromDraft(draft) {
  const kind = draft.kind;
  const code =
    kind === MARKETING_CAMPAIGN_KIND.PROMO_CODE ? sanitizePromoCodeInput(draft.code) : undefined;
  const name =
    kind === MARKETING_CAMPAIGN_KIND.PROMO_CODE ? (code ?? '') : String(draft.name ?? '').trim();

  const useDates = Boolean(draft.useDates);

  return {
    id: createCampaignId(),
    kind,
    name,
    code,
    discountMode: draft.discountMode,
    discountAmount:
      draft.discountMode === DEPOSIT_AMOUNT_MODE.PERCENTAGE
        ? sanitizePercentageDepositInput(draft.discountAmount)
        : sanitizeFixedDepositInput(draft.discountAmount),
    startDateYyyyMmDd: useDates ? String(draft.startDateYyyyMmDd ?? '').trim() : '',
    endDateYyyyMmDd: useDates ? String(draft.endDateYyyyMmDd ?? '').trim() : '',
    isEnabled: true,
    createdAtIso: new Date().toISOString(),
  };
}

/**
 * @param {MarketingCampaign} campaign
 * @returns {import('../constants').MarketingCampaignStatus}
 */
export function getMarketingCampaignStatus(campaign) {
  return deriveMarketingCampaignStatus(campaign.startDateYyyyMmDd, campaign.endDateYyyyMmDd);
}

/**
 * @param {object} draft
 */
export function validatePromoDraft(draft) {
  return validateMarketingCampaignDraft({
    ...draft,
    kind: MARKETING_CAMPAIGN_KIND.PROMO_CODE,
  });
}

/**
 * @param {object} draft
 */
export function validateSaleDraft(draft) {
  return validateMarketingCampaignDraft({
    ...draft,
    kind: MARKETING_CAMPAIGN_KIND.SALE,
    code: '',
  });
}

/**
 * @param {MarketingCampaign[]} campaigns
 * @param {import('../constants').MarketingCampaignKind} kind
 */
export function filterMarketingCampaignsByKind(campaigns, kind) {
  return campaigns.filter((c) => c.kind === kind);
}
