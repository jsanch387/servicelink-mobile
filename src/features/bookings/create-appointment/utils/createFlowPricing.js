import { detectPriceOptionLabelColumn } from '../../../services/api/services';

const CREATE_FLOW_BASE_SUFFIX = '-create-flow-base';

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatPriceLabel(cents) {
  const centsNumber = numberOrNull(cents);
  if (centsNumber == null) {
    return '$0';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(centsNumber / 100);
}

function formatDurationLabel(minutesValue) {
  const minutes = numberOrNull(minutesValue);
  if (minutes == null || minutes <= 0) {
    return '—';
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) {
    return `${m} min`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

function pick(row, keys) {
  for (const key of keys) {
    if (row?.[key] != null) {
      return row[key];
    }
  }
  return null;
}

export function createFlowBasePricingId(serviceId) {
  return `${String(serviceId)}${CREATE_FLOW_BASE_SUFFIX}`;
}

export function isCreateFlowBasePricingId(selectedPricingId, serviceId) {
  return String(selectedPricingId ?? '') === createFlowBasePricingId(serviceId);
}

/**
 * @param {Record<string, unknown> | null} serviceRow raw `business_services` row
 * @param {Record<string, unknown>[]} priceOptionRows active `service_price_options` rows
 * @param {boolean} ownerHasPro
 * @returns {{ options: Array<{ id: string; label: string; durationLabel: string; priceLabel: string; priceCents: number; durationMinutes: number }>; labelKey: string }}
 */
export function buildCreateFlowPricingOptions(serviceRow, priceOptionRows, ownerHasPro) {
  if (!serviceRow) {
    return { options: [], labelKey: 'label' };
  }

  const sid = String(pick(serviceRow, ['id']) ?? '');
  const priceOptionsEnabled = Boolean(
    pick(serviceRow, ['price_options_enabled', 'priceOptionsEnabled']),
  );
  const basePriceCents = numberOrNull(pick(serviceRow, ['price_cents', 'priceCents'])) ?? 0;
  const baseDuration =
    numberOrNull(pick(serviceRow, ['duration_minutes', 'durationMinutes'])) ??
    Math.max(15, (Number(pick(serviceRow, ['hours_to_complete', 'hoursToComplete'])) || 1) * 60);

  const rows = (priceOptionRows ?? []).filter((r) => pick(r, ['is_active', 'isActive']) !== false);

  if (ownerHasPro && priceOptionsEnabled && rows.length > 0) {
    const sample = rows[0];
    const labelKey = detectPriceOptionLabelColumn(sample);
    const options = rows.map((row) => {
      const id = String(pick(row, ['id']) ?? '');
      const label = String(pick(row, [labelKey]) ?? 'Option');
      const priceCents = numberOrNull(pick(row, ['price_cents', 'priceCents'])) ?? 0;
      const durationMinutes = Math.max(
        15,
        numberOrNull(pick(row, ['duration_minutes', 'durationMinutes'])) || baseDuration,
      );
      return {
        id,
        label,
        durationLabel: formatDurationLabel(durationMinutes),
        priceLabel: formatPriceLabel(priceCents),
        priceCents,
        durationMinutes,
      };
    });
    return { options, labelKey };
  }

  const id = createFlowBasePricingId(sid);
  return {
    options: [
      {
        id,
        label: 'Standard',
        durationLabel: formatDurationLabel(baseDuration),
        priceLabel: formatPriceLabel(basePriceCents),
        priceCents: basePriceCents,
        durationMinutes: Math.max(15, baseDuration),
      },
    ],
    labelKey: 'label',
  };
}

/**
 * @param {ReturnType<typeof buildCreateFlowPricingOptions>['options']} options
 */
export function getSelectedCreateFlowPricingOption(options, selectedPricingId) {
  if (!selectedPricingId || !options?.length) return null;
  return options.find((o) => o.id === selectedPricingId) ?? null;
}
