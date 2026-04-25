import {
  formatAddonDurationMinutes,
  minutesToServiceDurationHHmm,
} from '../../../components/ui/durationTime';

function pick(row, keys) {
  for (const key of keys) {
    if (row?.[key] != null) return row[key];
  }
  return null;
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function centsToInput(cents) {
  const n = asNumber(cents);
  if (n == null || n < 0) return '';
  return (n / 100).toFixed(2);
}

function centsToDisplay(cents) {
  const n = asNumber(cents);
  if (n == null || n < 0) return '$0';
  return `$${Math.round(n / 100)}`;
}

/**
 * Normalizes a `service_addons` row for the service editor and mutate hooks.
 * @param {Record<string, unknown>} row
 */
export function mapServiceAddonRowToEditorOption(row) {
  const id = String(pick(row, ['id']) ?? '');
  const name = String(pick(row, ['name', 'addon_name', 'title']) ?? 'Add-on').trim();
  const durationM = pick(row, ['duration_minutes', 'durationMinutes']);
  const priceCents = pick(row, ['price_cents', 'priceCents']);
  const durationHHmm = minutesToServiceDurationHHmm(durationM) || '';

  return {
    id,
    name,
    durationLabel: formatAddonDurationMinutes(durationM),
    priceLabel: centsToDisplay(priceCents),
    price: centsToInput(priceCents),
    durationHHmm,
  };
}

/** Aligns half-hour duration strings for add-on forms (same rules as service editor). */
export function normalizeAddonDurationHHmm(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const [h = '0', m = '00'] = raw.split(':');
  const hour = String(Math.max(0, Math.min(10, parseInt(h, 10) || 0))).padStart(2, '0');
  const minute = m === '30' ? '30' : '00';
  return `${hour}:${minute}`;
}
