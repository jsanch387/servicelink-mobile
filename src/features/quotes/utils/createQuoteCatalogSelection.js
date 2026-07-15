import { minutesToServiceDurationHHmm } from '../../../components/ui/durationTime';
import { parsePriceLabelToUsd } from '../../bookings/create-appointment/utils/priceLabelMath';
import { isCreateFlowBasePricingId } from '../../bookings/create-appointment/utils/createFlowPricing';
import { CREATE_QUOTE_CUSTOM_JOB_ID } from '../constants/createQuoteWizard';

/**
 * Formats a USD number for the quote price text field (no `$` prefix).
 * @param {number} usd
 */
export function formatQuotePriceUsdText(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n) || n < 0) return '';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, '') || String(n);
}

/**
 * @param {object | null | undefined} service Catalog service (`buildServicesCatalogModel`)
 * @param {{
 *   label?: string;
 *   priceCents?: number;
 *   priceLabel?: string;
 *   durationMinutes?: number;
 * } | null | undefined} selectedPricingOption
 * @param {Array<{ id: string; name: string; priceLabel?: string }> | null | undefined} selectedAddons
 */
export function deriveCatalogQuoteFields(service, selectedPricingOption, selectedAddons) {
  if (!service) {
    return {
      serviceName: '',
      priceUsdText: '',
      durationHhMm: '01:00',
      totalDurationMinutes: 60,
      serviceId: null,
      servicePriceOptionId: null,
      servicePriceCents: null,
      addonDetails: [],
      pricingOptionLabel: null,
      selectedAddons: [],
    };
  }

  const serviceId = String(service.id ?? '').trim();
  const hasCatalogPriceOption = Boolean(
    selectedPricingOption?.id && !isCreateFlowBasePricingId(selectedPricingOption.id, serviceId),
  );
  const servicePriceCents =
    selectedPricingOption?.priceCents != null &&
    Number.isFinite(Number(selectedPricingOption.priceCents))
      ? Math.max(0, Math.round(Number(selectedPricingOption.priceCents)))
      : Math.max(
          0,
          Math.round(
            parsePriceLabelToUsd(selectedPricingOption?.priceLabel ?? service.priceLabel) * 100,
          ),
        );

  const baseDurationMinutes =
    selectedPricingOption?.durationMinutes != null &&
    Number.isFinite(Number(selectedPricingOption.durationMinutes))
      ? Math.max(1, Math.round(Number(selectedPricingOption.durationMinutes)))
      : Math.max(1, Math.round(Number(service.durationMinutes) || 60));

  const addons = Array.isArray(selectedAddons) ? selectedAddons : [];
  const addonDetails = addons.map((addon) => {
    const durationMinutes = Math.round(Number(addon.durationMinutes) || 0);
    return {
      id: String(addon.id ?? '').trim(),
      name: String(addon.name ?? '').trim(),
      priceCents: Math.max(
        0,
        Math.round(parsePriceLabelToUsd(addon.priceLabel ?? addon.price) * 100),
      ),
      ...(durationMinutes > 0 ? { durationMinutes } : {}),
    };
  });
  const addonsPriceCents = addonDetails.reduce((sum, addon) => sum + addon.priceCents, 0);
  const addonsDurationMinutes = addonDetails.reduce(
    (sum, addon) => sum + (addon.durationMinutes ?? 0),
    0,
  );
  const totalDurationMinutes = baseDurationMinutes + addonsDurationMinutes;
  const optionLabel = hasCatalogPriceOption
    ? String(selectedPricingOption?.label ?? '').trim() || null
    : null;
  const baseServiceName = String(service.name ?? '').trim();

  return {
    serviceName: optionLabel ? `${baseServiceName} — ${optionLabel}` : baseServiceName,
    priceUsdText: formatQuotePriceUsdText((servicePriceCents + addonsPriceCents) / 100),
    durationHhMm: minutesToServiceDurationHHmm(totalDurationMinutes) || '01:00',
    totalDurationMinutes,
    serviceId: serviceId || null,
    servicePriceOptionId: hasCatalogPriceOption
      ? String(selectedPricingOption.id).trim() || null
      : null,
    servicePriceCents,
    addonDetails,
    pricingOptionLabel: optionLabel,
    selectedAddons: addons,
  };
}

/**
 * @param {string | null | undefined} selectedServiceId
 */
export function isCreateQuoteCustomJobSelection(selectedServiceId) {
  return String(selectedServiceId ?? '') === CREATE_QUOTE_CUSTOM_JOB_ID;
}
