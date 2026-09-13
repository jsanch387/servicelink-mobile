import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import { buildEditJobHubSections } from '../utils/buildEditJobHubSections';

describe('buildEditJobHubSections', () => {
  const base = {
    pricingSkipped: false,
    selectedServiceId: 'svc-1',
    selectedService: { name: 'Full Detail' },
    vehicle: { year: '2017', make: 'Toyota', model: 'Tacoma' },
  };

  it('keeps Service & pricing and Vehicle only for a single-job visit', () => {
    const sections = buildEditJobHubSections(base);
    const ids = sections.map((s) => s.id);

    expect(ids).toEqual(['job-service', 'job-vehicle']);
    expect(sections.find((s) => s.id === 'job-service')).toMatchObject({
      title: 'Service & pricing',
      summary: 'Full Detail',
      step: CREATE_APPOINTMENT_STEP.PRICING,
    });
  });

  it('puts Add-ons on the job hub when the visit has multiple jobs', () => {
    const sections = buildEditJobHubSections({
      ...base,
      showAddonsSection: true,
      selectedAddonRows: [{ name: 'Pet hair' }],
    });
    expect(sections.map((s) => s.id)).toEqual(['job-service', 'job-addons', 'job-vehicle']);
    expect(sections.find((s) => s.id === 'job-addons')).toMatchObject({
      title: 'Add-ons',
      summary: 'Pet hair',
      step: CREATE_APPOINTMENT_STEP.ADDONS,
    });
  });

  it('hides Add-ons when the service has none', () => {
    const sections = buildEditJobHubSections({
      ...base,
      showAddonsSection: false,
      selectedAddonRows: [],
    });
    expect(sections.map((s) => s.id)).toEqual(['job-service', 'job-vehicle']);
  });

  it('does not put Add-ons on a custom job', () => {
    const sections = buildEditJobHubSections({
      ...base,
      isCustomJob: true,
      selectedServiceId: null,
      showAddonsSection: true,
      selectedAddonRows: [{ name: 'Pet hair' }],
    });
    expect(sections.map((s) => s.id)).toEqual(['job-service', 'job-vehicle']);
  });

  it('opens Service list when pricing is skipped', () => {
    const sections = buildEditJobHubSections({
      ...base,
      pricingSkipped: true,
    });
    expect(sections.find((s) => s.id === 'job-service')?.title).toBe('Service');
    expect(sections.find((s) => s.id === 'job-service')?.summary).toBe('Full Detail');
    expect(sections.find((s) => s.id === 'job-service')?.step).toBe(
      CREATE_APPOINTMENT_STEP.SERVICE,
    );
  });
});
