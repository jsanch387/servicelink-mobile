import {
  SERVICE_DESCRIPTION_PREVIEW_CHARS,
  getServiceDescriptionCopy,
} from '../../services/utils/servicePreviewCopy';

export { getServiceDescriptionCopy };

export function mapServicesForCards(rows) {
  return (rows ?? []).map((row) => {
    const raw = String(row?.description ?? '').trim();
    const description = raw || 'No description yet.';

    return {
      id: String(row?.id ?? `service-${row?.name ?? 'unknown'}`),
      title: String(row?.name ?? 'Service'),
      price: formatPriceLabel(row?.price_cents),
      description,
      isLongDescription: description.length > SERVICE_DESCRIPTION_PREVIEW_CHARS,
      duration: formatDurationLabel(row?.duration_minutes),
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
