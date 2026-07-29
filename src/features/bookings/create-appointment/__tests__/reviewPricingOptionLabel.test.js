import { createFlowBasePricingId, reviewPricingOptionLabel } from '../utils/createFlowPricing';

describe('reviewPricingOptionLabel', () => {
  it('hides synthetic single-tier Standard', () => {
    const serviceId = 'svc-boat';
    expect(
      reviewPricingOptionLabel({
        selectedServiceId: serviceId,
        selectedPricingOption: {
          id: createFlowBasePricingId(serviceId),
          label: 'Standard',
        },
      }),
    ).toBe('');
  });

  it('keeps real pricing option labels', () => {
    expect(
      reviewPricingOptionLabel({
        selectedServiceId: 'svc-1',
        selectedPricingOption: { id: 'opt-suv', label: 'SUV' },
      }),
    ).toBe('SUV');
  });

  it('keeps a real option that happens to be named Standard', () => {
    expect(
      reviewPricingOptionLabel({
        selectedServiceId: 'svc-1',
        selectedPricingOption: { id: 'opt-1', label: 'Standard' },
      }),
    ).toBe('Standard');
  });
});
