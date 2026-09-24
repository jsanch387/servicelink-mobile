import {
  formatAppointmentAddressPrimaryLine,
  formatAppointmentAddressSecondaryLine,
  formatAppointmentAddressSingleLine,
  formatLocationCardLines,
} from '../utils/formatAppointmentAddress';

describe('formatAppointmentAddress', () => {
  const sample = {
    street: '123 Main St',
    unit: 'Suite 4',
    city: 'Austin',
    state: 'tx',
    zip: '78701',
  };

  it('formats primary line with unit', () => {
    expect(formatAppointmentAddressPrimaryLine(sample)).toBe('123 Main St, Suite 4');
  });

  it('formats secondary line as city, state zip', () => {
    expect(formatAppointmentAddressSecondaryLine(sample)).toBe('Austin, TX 78701');
  });

  it('splits location card into street and locality', () => {
    expect(formatLocationCardLines(sample)).toEqual({
      primary: '123 Main St, Suite 4',
      secondary: 'Austin, TX 78701',
    });
  });

  it('uses locality alone when street is missing', () => {
    expect(formatLocationCardLines({ city: 'Austin', state: 'TX', zip: '78701' })).toEqual({
      primary: 'Austin, TX 78701',
      secondary: '',
    });
  });

  it('formats single line for review', () => {
    expect(formatAppointmentAddressSingleLine(sample)).toBe(
      '123 Main St, Suite 4, Austin, tx, 78701',
    );
  });
});
