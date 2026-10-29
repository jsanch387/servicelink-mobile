import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { ReviewStep } from '../steps/ReviewStep';

const baseProps = {
  selectedService: { name: 'Detail', priceLabel: '$85' },
  selectedPricingOption: { label: 'Standard', priceLabel: '$85' },
  serviceAddons: [],
  selectedAddonIds: [],
  selectedDateKey: null,
  selectedTime: null,
  customer: { fullName: 'Ada Lovelace', phone: '', email: '' },
  address: { street: '1 Main', unit: '', city: 'Austin', state: 'TX', zip: '78701' },
  vehicle: { year: '', make: '', model: '' },
  notes: '',
  totalDurationMinutes: 60,
  jobs: [{ localId: 'j1', serviceName: 'Detail', priceLabel: '$85', addonRows: [] }],
};

describe('ReviewStep tax preview', () => {
  it('shows the price, tax, and total when the shop rate applies', () => {
    renderWithProviders(
      <ReviewStep {...baseProps} priceAfterDiscountCents={8500} taxCents={191} taxRateBps={225} />,
    );

    expect(screen.getByText('Job price')).toBeTruthy();
    expect(screen.getByText('Tax (2.25%)')).toBeTruthy();
    expect(screen.getByText(/1\.91/)).toBeTruthy();
    expect(screen.getByText(/86\.91/)).toBeTruthy();
  });

  it('hides the tax line when tax is off', () => {
    renderWithProviders(<ReviewStep {...baseProps} priceAfterDiscountCents={8500} taxCents={0} />);

    expect(screen.queryByText('Job price')).toBeNull();
    expect(screen.queryByText(/Tax/)).toBeNull();
    expect(screen.getByText('Total')).toBeTruthy();
  });

  it('does not tax a membership visit', () => {
    renderWithProviders(
      <ReviewStep
        {...baseProps}
        isMembershipVisit
        priceAfterDiscountCents={0}
        taxCents={191}
        taxRateBps={225}
      />,
    );

    expect(screen.queryByText('Tax (2.25%)')).toBeNull();
  });
});
