import {
  formatAddonDurationMinutes,
  minutesToServiceDurationHHmm,
} from '../../../components/ui/durationTime';

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pick(row, keys) {
  for (const key of keys) {
    if (row?.[key] != null) {
      return row[key];
    }
  }
  return null;
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

function formatDurationLabel(minutesValue, withPlus = false) {
  const minutes = numberOrNull(minutesValue);
  if (minutes == null || minutes <= 0) {
    return withPlus ? '+0 min' : '0 min';
  }
  if (withPlus) {
    return `+${minutes} min`;
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

function isActiveFromRow(row) {
  const active = pick(row, ['is_active', 'active', 'enabled']);
  if (active == null) {
    return true;
  }
  return Boolean(active);
}

function sortByOrderThenCreatedThenName(a, b) {
  const orderA = numberOrNull(a.sortOrder);
  const orderB = numberOrNull(b.sortOrder);
  if (orderA != null && orderB != null && orderA !== orderB) {
    return orderA - orderB;
  }
  if (orderA != null && orderB == null) return -1;
  if (orderA == null && orderB != null) return 1;

  const createdA = Date.parse(a.createdAt ?? '') || 0;
  const createdB = Date.parse(b.createdAt ?? '') || 0;
  if (createdA !== createdB) {
    return createdA - createdB;
  }
  return String(a.name).localeCompare(String(b.name));
}

function countAddonsByService(assignments) {
  const map = new Map();
  for (const row of assignments ?? []) {
    const serviceId = pick(row, ['service_id', 'business_service_id']);
    if (!serviceId) continue;
    map.set(serviceId, (map.get(serviceId) ?? 0) + 1);
  }
  return map;
}

export function buildServicesCatalogModel(servicesRows, addonsRows, assignmentRows) {
  const addonCounts = countAddonsByService(assignmentRows);

  const services = (servicesRows ?? [])
    .map((row) => {
      const id = String(pick(row, ['id']) ?? '');
      const name = String(pick(row, ['name', 'service_name', 'title']) ?? 'Service');
      const durationMinutes = pick(row, ['duration_minutes', 'durationMinutes']);
      const priceCents = pick(row, ['price_cents', 'priceCents']);
      const serviceIdKey = pick(row, ['id']);
      const addonsCount = addonCounts.get(serviceIdKey) ?? 0;
      const sortOrder = pick(row, ['sort_order', 'display_order', 'position']);
      const createdAt = pick(row, ['created_at', 'createdAt']);

      const dm = numberOrNull(durationMinutes);
      return {
        id: id || `service-${name}`,
        name,
        /** Raw minutes for booking duration when raw service row is not handy. */
        durationMinutes: dm != null && dm > 0 ? Math.max(15, dm) : 60,
        durationLabel: formatDurationLabel(durationMinutes),
        addonsCountLabel:
          addonsCount > 0 ? `${addonsCount} add-on${addonsCount === 1 ? '' : 's'}` : null,
        priceLabel: formatPriceLabel(priceCents),
        description: String(pick(row, ['description', 'details']) ?? '').trim(),
        isEnabled: isActiveFromRow(row),
        sortOrder: numberOrNull(sortOrder),
        createdAt: typeof createdAt === 'string' ? createdAt : null,
      };
    })
    .sort(sortByOrderThenCreatedThenName);

  const addons = (addonsRows ?? [])
    .map((row) => {
      const id = String(pick(row, ['id']) ?? '');
      const name = String(pick(row, ['name', 'addon_name', 'title']) ?? 'Add-on');
      const durationMinutes = pick(row, ['duration_minutes', 'durationMinutes']);
      const priceCents = pick(row, ['price_cents', 'priceCents']);
      const sortOrder = pick(row, ['sort_order', 'display_order', 'position']);
      const createdAt = pick(row, ['created_at', 'createdAt']);

      const priceInput =
        priceCents != null && Number.isFinite(Number(priceCents)) && Number(priceCents) >= 0
          ? (Number(priceCents) / 100).toFixed(2)
          : '';

      return {
        id: id || `addon-${name}`,
        name,
        /** Raw minutes for booking duration math (0 = price-only add-on). */
        durationMinutes: numberOrNull(durationMinutes) ?? 0,
        durationLabel: formatAddonDurationMinutes(durationMinutes),
        priceLabel: `+${formatPriceLabel(priceCents)}`,
        /** Raw price for editor forms (no $). */
        price: priceInput,
        durationHHmm: minutesToServiceDurationHHmm(durationMinutes) || '',
        isEnabled: isActiveFromRow(row),
        sortOrder: numberOrNull(sortOrder),
        createdAt: typeof createdAt === 'string' ? createdAt : null,
      };
    })
    .sort(sortByOrderThenCreatedThenName);

  return { services, addons };
}

/** Strip legacy "+" prefix from duration copy on cards. */
export function normalizeAddonDurationLabelForCard(durationLabel) {
  return String(durationLabel ?? '')
    .replace(/^\+\s*/, '')
    .trim();
}

export function deriveServicesSummary(model) {
  return {
    totalServices: numberOrZero(model?.services?.length),
    totalAddons: numberOrZero(model?.addons?.length),
  };
}
