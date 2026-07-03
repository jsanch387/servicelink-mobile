import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import { buildEditHubSections, truncateHubSummary } from '../utils/buildEditHubSections';

describe('buildEditHubSections', () => {
  const base = {
    pricingSkipped: false,
    addonsSkipped: true,
    locationSkipped: true,
    addressSkipped: true,
    selectedService: { name: 'Full Detail' },
    selectedPricingOption: { label: 'Sedan/Coupe' },
    selectedAddonRows: [],
    selectedDateKey: '2026-07-15',
    selectedTime: '2:30 PM',
    customer: { fullName: 'Jane Doe', phone: '5123214324' },
    appointmentLocationType: 'mobile',
    address: { street: '12 Main', city: 'Austin', state: 'TX', zip: '78701' },
    vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
    notes: 'Side gate',
  };

  it('includes pricing and schedule sections with summaries', () => {
    const sections = buildEditHubSections(base);
    const ids = sections.map((s) => s.id);

    expect(ids).toContain('service');
    expect(ids).toContain('pricing');
    expect(ids).not.toContain('addons');
    expect(ids).toContain('schedule');
    expect(ids).toContain('customer');
    expect(ids).not.toContain('location');
    expect(ids).not.toContain('address');

    const service = sections.find((s) => s.id === 'service');
    expect(service?.summary).toBe('Full Detail');
    expect(service?.summary).not.toContain('Sedan/Coupe');
    expect(service?.step).toBe(CREATE_APPOINTMENT_STEP.SERVICE);

    const pricing = sections.find((s) => s.id === 'pricing');
    expect(pricing?.summary).toBe('Sedan/Coupe');

    const customer = sections.find((s) => s.id === 'customer');
    expect(customer?.summary).toBe('Jane Doe');

    const schedule = sections.find((s) => s.id === 'schedule');
    expect(schedule?.summary).toMatch(/2:30 PM/);
  });

  it('omits pricing section when pricing is skipped', () => {
    const sections = buildEditHubSections({ ...base, pricingSkipped: true });
    expect(sections.some((s) => s.id === 'pricing')).toBe(false);
    expect(sections.find((s) => s.id === 'service')?.title).toBe('Service');
  });

  it('includes addons, location, and address when not skipped', () => {
    const sections = buildEditHubSections({
      ...base,
      addonsSkipped: false,
      locationSkipped: false,
      addressSkipped: false,
      selectedAddonRows: [{ name: 'Wax' }, { name: 'Interior' }],
      appointmentLocationType: 'shop',
      address: { street: '100 Shop Way', city: 'Austin', state: 'TX', zip: '78701' },
    });

    expect(sections.find((s) => s.id === 'addons')?.summary).toBe('2 add-ons selected');
    expect(sections.find((s) => s.id === 'location')?.summary).toBe('At your shop');
    expect(sections.find((s) => s.id === 'address')?.summary).toMatch(/100 Shop Way/);
  });

  it('shows fallbacks for incomplete schedule and customer', () => {
    const sections = buildEditHubSections({
      ...base,
      selectedDateKey: null,
      selectedTime: null,
      customer: { fullName: '', phone: '' },
      vehicle: { year: '', make: '', model: '' },
      notes: '',
    });

    expect(sections.find((s) => s.id === 'schedule')?.summary).toBe('Not scheduled');
    expect(sections.find((s) => s.id === 'customer')?.summary).toBe('Not set');
    expect(sections.find((s) => s.id === 'vehicle')?.summary).toBe('Not set');
  });

  it('combines vehicle and notes in one summary line', () => {
    const sections = buildEditHubSections({
      ...base,
      vehicle: { year: '2019', make: 'Toyota', model: 'Camry' },
      notes: 'Gate code 1234',
    });

    expect(sections.find((s) => s.id === 'vehicle')?.summary).toBe(
      '2019 Toyota Camry · Gate code 1234',
    );
  });

  it('truncates very long service names for the hub preview', () => {
    const longName = `${'Premium ceramic coating '.repeat(6)}package`;
    const sections = buildEditHubSections({
      ...base,
      pricingSkipped: true,
      selectedService: { name: longName },
      selectedPricingOption: null,
    });

    const service = sections.find((s) => s.id === 'service');
    expect(service?.summary.length).toBeLessThan(longName.length);
    expect(service?.summary.endsWith('…')).toBe(true);
    expect(service?.summaryMaxLines).toBe(3);
  });

  it('truncateHubSummary leaves short strings unchanged', () => {
    expect(truncateHubSummary('Short name')).toBe('Short name');
    expect(truncateHubSummary('  padded  ')).toBe('padded');
  });
});
