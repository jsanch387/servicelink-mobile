/**
 * UI-only pricing tiers until `service_price_options` is loaded from the API.
 * One row uses the catalog service’s listed price and duration so the screen stays tied to real data.
 *
 * @param {{ id: string; name?: string; priceLabel?: string; durationLabel?: string } | null} service
 * @returns {Array<{ id: string; label: string; durationLabel: string; priceLabel: string }>}
 */
export function buildPricingOptionsForUi(service) {
  if (!service) return [];
  const sid = String(service.id);
  const basePrice = service.priceLabel ?? '$0';

  return [
    {
      id: `${sid}-truck`,
      label: 'Truck',
      durationLabel: '3 hrs 30 min',
      priceLabel: '$200',
    },
    {
      id: `${sid}-suv`,
      label: 'SUV',
      durationLabel: '3 hrs 30 min',
      priceLabel: basePrice,
    },
    {
      id: `${sid}-sedan`,
      label: 'Sedan',
      durationLabel: '2 hrs',
      priceLabel: '$120',
    },
  ];
}

/**
 * @param {{ id: string } | null} service
 * @param {string | null} selectedPricingId
 */
export function getSelectedPricingOption(service, selectedPricingId) {
  if (!service || !selectedPricingId) return null;
  const opts = buildPricingOptionsForUi(service);
  return opts.find((o) => o.id === selectedPricingId) ?? null;
}
