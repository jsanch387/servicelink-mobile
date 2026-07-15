import { createFlowBasePricingId } from '../../bookings/create-appointment/utils/createFlowPricing';
import { deriveCatalogQuoteFields } from '../utils/createQuoteCatalogSelection';

describe('deriveCatalogQuoteFields', () => {
  const service = {
    id: 'service-1',
    name: 'Interior detail',
    priceLabel: '$150',
    durationMinutes: 60,
  };

  it('builds an option and add-on snapshot with final totals', () => {
    const result = deriveCatalogQuoteFields(
      service,
      {
        id: 'option-1',
        label: 'SUV',
        priceCents: 19900,
        durationMinutes: 90,
      },
      [
        {
          id: 'addon-1',
          name: 'Pet hair',
          price: '25.00',
          priceLabel: '+$25.00',
          durationMinutes: 30,
        },
        {
          id: 'addon-2',
          name: 'Odor treatment',
          price: '10.00',
          priceLabel: '+$10.00',
          durationMinutes: 0,
        },
      ],
    );

    expect(result).toEqual(
      expect.objectContaining({
        serviceId: 'service-1',
        servicePriceOptionId: 'option-1',
        servicePriceCents: 19900,
        serviceName: 'Interior detail — SUV',
        priceUsdText: '234',
        durationHhMm: '02:00',
        totalDurationMinutes: 120,
        addonDetails: [
          {
            id: 'addon-1',
            name: 'Pet hair',
            priceCents: 2500,
            durationMinutes: 30,
          },
          {
            id: 'addon-2',
            name: 'Odor treatment',
            priceCents: 1000,
          },
        ],
      }),
    );
  });

  it('does not send the synthetic base price as a price option', () => {
    const result = deriveCatalogQuoteFields(
      service,
      {
        id: createFlowBasePricingId(service.id),
        label: 'Standard',
        priceCents: 15000,
        durationMinutes: 60,
      },
      [],
    );

    expect(result.servicePriceOptionId).toBeNull();
    expect(result.pricingOptionLabel).toBeNull();
    expect(result.serviceName).toBe('Interior detail');
  });
});
