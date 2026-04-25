function parsePriceLabelToInput(priceLabel) {
  const normalized = String(priceLabel ?? '').replace(/[^0-9.]/g, '');
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    return '0.00';
  }
  return n.toFixed(2);
}

function parseDurationLabelToSelect(durationLabel) {
  const value = String(durationLabel ?? '').toLowerCase();
  if (value.includes('30') && value.includes('3')) return '03:30';
  if (value.includes('2h') || value.includes('120')) return '02:00';
  if (value.includes('90')) return '01:30';
  if (value.includes('60') || value.includes('1h')) return '01:00';
  return '03:30';
}

export function buildServiceEditDraft(service) {
  const baseName = String(service?.name ?? 'Service').trim();
  return {
    serviceId: String(service?.id ?? ''),
    serviceName: baseName,
    description: String(service?.description ?? '').trim(),
    price: parsePriceLabelToInput(service?.priceLabel),
    durationHHmm: parseDurationLabelToSelect(service?.durationLabel),
  };
}
