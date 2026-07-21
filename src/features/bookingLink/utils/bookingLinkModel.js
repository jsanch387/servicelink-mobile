import { computeSaleDiscountCents } from '../../bookings/create-appointment/utils/applyOwnerBookingSale';
import {
  SERVICE_DESCRIPTION_PREVIEW_CHARS,
  getServiceDescriptionCopy,
} from '../../services/utils/servicePreviewCopy';

export { getServiceDescriptionCopy };

/**
 * @param {Array<Record<string, unknown>> | null | undefined} rows
 * @param {{
 *   activeSale?: import('../../marketing/utils/marketingCampaignModel').MarketingCampaign | null;
 * }} [options]
 */
export function mapServicesForCards(rows, options = {}) {
  const activeSale = options.activeSale ?? null;

  return (rows ?? []).map((row) => {
    const raw = String(row?.description ?? '').trim();
    const description = raw || 'No description yet.';
    const priceCents = Math.max(0, Math.round(Number(row?.price_cents) || 0));
    const discountCents = computeSaleDiscountCents(priceCents, activeSale);
    const salePriceCents = discountCents > 0 ? Math.max(0, priceCents - discountCents) : null;

    return {
      id: String(row?.id ?? `service-${row?.name ?? 'unknown'}`),
      title: String(row?.name ?? 'Service'),
      price: formatPriceLabel(salePriceCents != null ? salePriceCents : priceCents),
      ...(salePriceCents != null ? { compareAtPrice: formatPriceLabel(priceCents) } : null),
      description,
      isLongDescription: description.length > SERVICE_DESCRIPTION_PREVIEW_CHARS,
      duration: formatDurationLabel(row?.duration_minutes),
      categoryId:
        row?.category_id != null && String(row.category_id).trim() !== ''
          ? String(row.category_id)
          : null,
    };
  });
}

function formatPriceLabel(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return '$0';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function formatDurationLabel(minutesValue) {
  const minutes = Number(minutesValue);
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours <= 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}
