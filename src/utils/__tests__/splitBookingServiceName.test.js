import { splitBookingServiceName } from '../splitBookingServiceName';

describe('splitBookingServiceName', () => {
  it('splits base service and pricing option on em dash', () => {
    expect(splitBookingServiceName('Signature Shine — SUV')).toEqual({
      primary: 'Signature Shine',
      pricingOption: 'SUV',
    });
  });

  it('joins multiple tier segments after the first dash', () => {
    expect(splitBookingServiceName('A — B — C')).toEqual({
      primary: 'A',
      pricingOption: 'B — C',
    });
  });

  it('returns null pricing option for a single service name', () => {
    expect(splitBookingServiceName('Full detail')).toEqual({
      primary: 'Full detail',
      pricingOption: null,
    });
  });
});
