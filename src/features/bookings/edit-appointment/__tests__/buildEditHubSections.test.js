import { CREATE_APPOINTMENT_STEP } from '../../create-appointment/constants';
import {
  EDIT_APPOINTMENT_ADDONS_ENTRY,
  EDIT_APPOINTMENT_JOBS_LIST,
  EDIT_APPOINTMENT_NOTES,
} from '../constants';
import {
  buildEditHubSections,
  formatEditHubScheduleSummary,
  formatEditVisitAddonsHubSummary,
  truncateHubSummary,
} from '../utils/buildEditHubSections';

describe('buildEditHubSections', () => {
  const base = {
    locationSkipped: true,
    addressSkipped: true,
    selectedDateKey: '2026-07-15',
    selectedTime: '2:30 PM',
    customer: { fullName: 'Jane Doe', phone: '5123214324' },
    appointmentLocationType: 'mobile',
    address: { street: '12 Main', city: 'Austin', state: 'TX', zip: '78701' },
    notes: 'Side gate',
    jobs: [
      {
        serviceName: 'Full Detail',
        isCustomJob: false,
        selectedServiceId: 'svc-1',
        selectedAddonRows: [{ name: 'Wax' }],
      },
    ],
  };

  it('puts Jobs and Add-ons on the visit hub', () => {
    const sections = buildEditHubSections(base);
    const ids = sections.map((s) => s.id);

    expect(ids).toEqual(['jobs', 'addons', 'schedule', 'customer', 'notes']);
    expect(sections.find((s) => s.id === 'jobs')?.step).toBe(EDIT_APPOINTMENT_JOBS_LIST);
    expect(sections.find((s) => s.id === 'addons')?.step).toBe(EDIT_APPOINTMENT_ADDONS_ENTRY);
    expect(sections.find((s) => s.id === 'addons')?.summary).toBe('Wax');
    expect(sections.find((s) => s.id === 'notes')?.step).toBe(EDIT_APPOINTMENT_NOTES);
    expect(ids).not.toContain('pricing');
    expect(ids).not.toContain('vehicle');

    const schedule = sections.find((s) => s.id === 'schedule');
    expect(schedule?.summary).toBe('Wed, Jul 15 · 2:30 PM');
    expect(schedule?.step).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
  });

  it('hides Add-ons when every job is custom', () => {
    const sections = buildEditHubSections({
      ...base,
      showAddonsSection: false,
      jobs: [{ serviceName: 'Touch-up', isCustomJob: true, selectedServiceId: null }],
    });
    expect(sections.map((s) => s.id)).not.toContain('addons');
  });

  it('summarizes add-ons across multiple jobs', () => {
    expect(
      formatEditVisitAddonsHubSummary([
        {
          isCustomJob: false,
          selectedServiceId: 'a',
          selectedAddonRows: [{ name: 'Wax' }, { name: 'Pet hair' }],
        },
        {
          isCustomJob: false,
          selectedServiceId: 'b',
          selectedAddonRows: [{ name: 'Shampoo' }],
        },
      ]),
    ).toBe('3 add-ons selected');
  });

  it('includes location and address when not skipped', () => {
    const sections = buildEditHubSections({
      ...base,
      locationSkipped: false,
      addressSkipped: false,
      appointmentLocationType: 'shop',
      address: { street: '100 Shop Way', city: 'Austin', state: 'TX', zip: '78701' },
    });

    expect(sections.find((s) => s.id === 'location')?.summary).toBe('At your shop');
    expect(sections.find((s) => s.id === 'address')?.summary).toMatch(/100 Shop Way/);
  });

  it('shows fallbacks for incomplete schedule, customer, and notes', () => {
    const sections = buildEditHubSections({
      ...base,
      selectedDateKey: null,
      selectedTime: null,
      customer: { fullName: '', phone: '' },
      notes: '',
    });

    expect(sections.find((s) => s.id === 'schedule')?.summary).toBe('Not scheduled');
    expect(sections.find((s) => s.id === 'customer')?.summary).toBe('Not set');
    expect(sections.find((s) => s.id === 'notes')?.summary).toBe('No notes');
  });

  it('truncateHubSummary leaves short strings unchanged', () => {
    expect(truncateHubSummary('Short name')).toBe('Short name');
    expect(truncateHubSummary('  padded  ')).toBe('padded');
  });

  it('formats hub schedule with compact clock times', () => {
    expect(formatEditHubScheduleSummary('2026-07-27', '9:00 AM')).toBe('Mon, Jul 27 · 9 AM');
    expect(formatEditHubScheduleSummary('2026-07-27', '9:30 AM')).toBe('Mon, Jul 27 · 9:30 AM');
  });
});
