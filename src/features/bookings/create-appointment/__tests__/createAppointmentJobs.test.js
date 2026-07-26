import {
  mergeVisitJobNotes,
  snapshotCommittedJob,
  sumJobDurationsMinutes,
} from '../utils/createAppointmentJobs';
import { addMinutesToTime12h, parseTime12hToMinutes } from '../utils/scheduleTimeMath';

describe('scheduleTimeMath', () => {
  it('parses 12h times', () => {
    expect(parseTime12hToMinutes('9:00 AM')).toBe(9 * 60);
    expect(parseTime12hToMinutes('12:30 PM')).toBe(12 * 60 + 30);
    expect(parseTime12hToMinutes('12:00 AM')).toBe(0);
  });

  it('advances start time by job duration', () => {
    expect(addMinutesToTime12h('10:00 AM', 90)).toBe('11:30 AM');
    expect(addMinutesToTime12h('11:00 AM', 60)).toBe('12:00 PM');
  });
});

describe('createAppointmentJobs', () => {
  it('sums job durations', () => {
    expect(
      sumJobDurationsMinutes([{ totalDurationMinutes: 60 }, { totalDurationMinutes: 45 }]),
    ).toBe(105);
  });

  it('prefixes multi-job visit notes', () => {
    expect(mergeVisitJobNotes('Park in driveway', 0, 2)).toBe('Visit job 1 of 2. Park in driveway');
    expect(mergeVisitJobNotes('', 1, 2)).toBe('Visit job 2 of 2');
    expect(mergeVisitJobNotes('Only one', 0, 1)).toBe('Only one');
  });

  it('snapshots a committed job with price override', () => {
    const snap = snapshotCommittedJob({
      localId: 'job-stable-1',
      selectedServiceId: 'svc-1',
      isCustomJob: false,
      selectedService: { name: 'Full detail' },
      selectedPricingOption: {
        id: 'tier-1',
        label: 'SUV',
        priceCents: 19900,
        priceLabel: '$199',
        durationMinutes: 120,
      },
      selectedAddonRows: [],
      totalDurationMinutes: 120,
      vehicle: { year: '2021', make: 'Tesla', model: 'Model 3' },
      catalogPriceUsdText: '199',
      selectedPricingId: 'tier-1',
      selectedAddonIds: [],
    });
    expect(snap.localId).toBe('job-stable-1');
    expect(snap.serviceName).toBe('Full detail');
    expect(snap.selectedPricingOption.priceCents).toBe(19900);
    expect(snap.vehicle.make).toBe('Tesla');
  });
});
