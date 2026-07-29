import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import { buildEditJobHubSections } from '../utils/buildEditJobHubSections';

describe('buildEditJobHubSections', () => {
  const base = {
    pricingSkipped: false,
    addonsSkipped: false,
    selectedServiceId: 'svc-1',
    selectedService: { name: 'Full Detail' },
    selectedPricingOption: { label: 'SUV' },
    selectedAddonRows: [{ name: 'Wax' }],
    vehicle: { year: '2017', make: 'Toyota', model: 'Tacoma' },
  };

  it('folds pricing into Service & pricing and omits a separate pricing row', () => {
    const sections = buildEditJobHubSections(base);
    const ids = sections.map((s) => s.id);

    expect(ids).toEqual(['job-service', 'job-addons', 'job-vehicle']);
    expect(sections.find((s) => s.id === 'job-service')).toMatchObject({
      title: 'Service & pricing',
      summary: 'Full Detail',
      step: CREATE_APPOINTMENT_STEP.PRICING,
    });
  });

  it('opens Service list when pricing is skipped', () => {
    const sections = buildEditJobHubSections({
      ...base,
      pricingSkipped: true,
      selectedPricingOption: { label: 'Standard' },
    });
    expect(sections.find((s) => s.id === 'job-service')?.title).toBe('Service');
    expect(sections.find((s) => s.id === 'job-service')?.summary).toBe('Full Detail');
    expect(sections.find((s) => s.id === 'job-service')?.step).toBe(
      CREATE_APPOINTMENT_STEP.SERVICE,
    );
  });
});
