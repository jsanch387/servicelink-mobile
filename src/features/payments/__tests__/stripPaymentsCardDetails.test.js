import { stripPaymentsCardDetails } from '../utils/stripPaymentsCardDetails';

describe('stripPaymentsCardDetails', () => {
  it('keeps customer and how they paid', () => {
    expect(stripPaymentsCardDetails('Jordan Lee · Tap to pay')).toBe('Jordan Lee · Tap to pay');
    expect(stripPaymentsCardDetails('Jordan Lee · Card')).toBe('Jordan Lee · Card');
  });

  it('drops brand and last four', () => {
    expect(stripPaymentsCardDetails('Jordan Lee · Visa •••• 4242')).toBe('Jordan Lee');
  });
});
