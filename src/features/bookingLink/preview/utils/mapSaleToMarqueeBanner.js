import { DEPOSIT_AMOUNT_MODE } from '../../../payments/constants/depositAmount';

/**
 * @param {import('../../../marketing/utils/marketingCampaignModel').MarketingCampaign | null | undefined} sale
 * @returns {{ name: string; discountType: 'percentage' | 'fixed'; discountValue: number } | null}
 */
export function mapSaleToMarqueeBanner(sale) {
  if (!sale) return null;
  const discountValue = Number(String(sale.discountAmount ?? '').replace(/,/g, ''));
  if (!Number.isFinite(discountValue) || discountValue <= 0) return null;
  const name = String(sale.name ?? '').trim() || 'Sale';
  return {
    name,
    discountType: sale.discountMode === DEPOSIT_AMOUNT_MODE.PERCENTAGE ? 'percentage' : 'fixed',
    discountValue,
  };
}

/**
 * @param {'percentage' | 'fixed'} type
 * @param {number} value
 * @returns {string | null}
 */
export function formatSaleDiscountHighlight(type, value) {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (type === 'percentage') return `${value}%`;
  return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2).replace(/\.?0+$/, '')}`;
}
