import {
  formatAppointmentAddressPrimaryLine,
  formatAppointmentAddressSecondaryLine,
  formatAppointmentAddressSingleLine,
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

  it('formats single line for review', () => {
    expect(formatAppointmentAddressSingleLine(sample)).toBe(
      '123 Main St, Suite 4, Austin, tx, 78701',
    );
  });
});
