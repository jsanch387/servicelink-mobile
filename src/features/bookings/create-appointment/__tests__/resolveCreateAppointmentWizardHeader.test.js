import { CREATE_APPOINTMENT_STEP } from '../constants';
import { resolveCreateAppointmentWizardHeader } from '../utils/resolveCreateAppointmentWizardHeader';

describe('resolveCreateAppointmentWizardHeader', () => {
  it('uses service name on pricing step', () => {
    expect(
      resolveCreateAppointmentWizardHeader(
        CREATE_APPOINTMENT_STEP.PRICING,
        { title: 'Pricing', subtitle: 'Select a price tier for this service.' },
        { name: 'Black label detail' },
        null,
      ),
    ).toEqual({
      title: 'Black label detail',
      subtitle: 'Choose a price tier',
    });
  });

  it('uses default meta on other steps', () => {
    expect(
      resolveCreateAppointmentWizardHeader(
        CREATE_APPOINTMENT_STEP.SCHEDULE,
        { title: 'Date and time', subtitle: 'Pick a slot.' },
        { name: 'Wash' },
        null,
      ),
    ).toEqual({
      title: 'Date and time',
      subtitle: 'Pick a slot.',
    });
  });
});
