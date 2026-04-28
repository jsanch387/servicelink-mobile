const DESCRIPTION_PREVIEW_CHARS = 100;

export function mapServicesForCards(rows) {
  return (rows ?? []).map((row) => {
    const description = String(row?.description ?? '').trim();

    return {
      id: String(row?.id ?? `service-${row?.name ?? 'unknown'}`),
      title: String(row?.name ?? 'Service'),
      price: formatPriceLabel(row?.price_cents),
      description: description || 'No description yet.',
      isLongDescription: description.length > DESCRIPTION_PREVIEW_CHARS,
      duration: formatDurationLabel(row?.duration_minutes),
    };
  });
}

export function getServiceDescriptionCopy(service, isExpanded) {
  if (!service.isLongDescription || isExpanded) {
    return service.description;
  }
  return `${service.description.slice(0, DESCRIPTION_PREVIEW_CHARS).trimEnd()}...`;
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
