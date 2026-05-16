import { buildOnMyWaySmsBody } from '../utils/appointmentOutbound';

describe('buildOnMyWaySmsBody', () => {
  it('includes business name when set', () => {
    expect(buildOnMyWaySmsBody({}, { businessName: "Mike's Mobile Detailing" })).toBe(
      "Hey, this is Mike's Mobile Detailing. I'm heading your way for your appointment. See you soon!",
    );
  });

  it('does not include customer name even when present on the booking', () => {
    expect(
      buildOnMyWaySmsBody({ customer_name: 'Alex' }, { businessName: 'Sunrise Auto Spa' }),
    ).toBe(
      "Hey, this is Sunrise Auto Spa. I'm heading your way for your appointment. See you soon!",
    );
  });

  it('uses a generic message when business name is missing', () => {
    expect(buildOnMyWaySmsBody({ customer_name: 'Jordan' })).toBe(
      "Hey, I'm heading your way for your appointment. See you soon!",
    );
  });
});
