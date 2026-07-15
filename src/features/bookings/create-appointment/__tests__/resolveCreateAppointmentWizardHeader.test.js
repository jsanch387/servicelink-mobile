import { CREATE_APPOINTMENT_STEP } from '../constants';
import { resolveCreateAppointmentWizardHeader } from '../utils/resolveCreateAppointmentWizardHeader';

describe('resolveCreateAppointmentWizardHeader', () => {
  it('uses standard pricing copy instead of repeating the service name', () => {
    expect(
      resolveCreateAppointmentWizardHeader(CREATE_APPOINTMENT_STEP.PRICING, {
        title: 'Pricing',
        subtitle: 'Select a price tier for this service.',
      }),
    ).toEqual({
      title: 'Pricing',
      subtitle: 'Select a price tier for this service.',
    });
  });

  it('uses standard add-on copy instead of repeating the service name', () => {
    expect(
      resolveCreateAppointmentWizardHeader(CREATE_APPOINTMENT_STEP.ADDONS, {
        title: 'Add-ons',
        subtitle: 'Add extras if the customer wants them — or skip.',
      }),
    ).toEqual({
      title: 'Add-ons',
      subtitle: 'Add extras if the customer wants them — or skip.',
    });
  });

  it('uses default meta on other steps', () => {
    expect(
      resolveCreateAppointmentWizardHeader(CREATE_APPOINTMENT_STEP.SCHEDULE, {
        title: 'Date and time',
        subtitle: 'Pick a slot.',
      }),
    ).toEqual({
      title: 'Date and time',
      subtitle: 'Pick a slot.',
    });
  });

  it('matches quote-style copy while browsing services', () => {
    expect(
      resolveCreateAppointmentWizardHeader(
        CREATE_APPOINTMENT_STEP.SERVICE,
        { title: "What's the job?", subtitle: 'Your services, or a custom job.' },
        null,
        { servicePickPhase: 'catalog' },
      ),
    ).toEqual({
      title: 'Choose a service',
      subtitle: 'Pick one of your services for this appointment.',
    });
  });

  it('uses custom job copy for custom details', () => {
    expect(
      resolveCreateAppointmentWizardHeader(
        CREATE_APPOINTMENT_STEP.PRICING,
        { title: 'Pricing', subtitle: 'Select pricing.' },
        null,
        { isCustomJob: true },
      ),
    ).toEqual({
      title: 'Custom job',
      subtitle: 'Name it, set a price, and estimate duration.',
    });
  });
});
