import { CREATE_APPOINTMENT_MAX_JOBS } from '../../create-appointment/constants';
import {
  appendAddedEditJob,
  removeEditJobAtIndex,
  visitGrossCentsFromEditJobs,
} from '../utils/commitAddedEditJob';
import { buildEditBookingUpdatePayload } from '../utils/buildEditBookingUpdatePayload';

const existingJob = {
  localId: 'j1',
  selectedServiceId: 'svc-1',
  isCustomJob: false,
  serviceName: 'Full Detail',
  selectedPricingOption: { label: 'Standard', priceCents: 15000, durationMinutes: 90 },
  selectedAddonRows: [],
  totalDurationMinutes: 90,
  vehicle: { year: '2019', make: 'Honda', model: 'Civic' },
};

const addedJob = {
  localId: 'j2',
  selectedServiceId: 'svc-2',
  isCustomJob: false,
  serviceName: 'Interior',
  selectedPricingOption: { label: 'Standard', priceCents: 8000, durationMinutes: 45 },
  selectedAddonRows: [{ id: 'addon-1', name: 'Pet hair', priceCents: 2000 }],
  totalDurationMinutes: 45,
  vehicle: { year: '2021', make: 'Toyota', model: 'Camry' },
};

describe('appendAddedEditJob', () => {
  it('appends the new job so the list shows both vehicles', () => {
    const next = appendAddedEditJob([existingJob], addedJob);
    expect(next).toHaveLength(2);
    expect(next[1].serviceName).toBe('Interior');
    expect(next[1].vehicle.model).toBe('Camry');
  });

  it('does not add past the visit cap', () => {
    const full = Array.from({ length: CREATE_APPOINTMENT_MAX_JOBS }, (_, i) => ({
      ...existingJob,
      localId: `j${i}`,
    }));
    expect(appendAddedEditJob(full, addedJob)).toHaveLength(CREATE_APPOINTMENT_MAX_JOBS);
  });
});

describe('removeEditJobAtIndex', () => {
  it('removes the job and keeps at least one', () => {
    const next = removeEditJobAtIndex([existingJob, addedJob], 1);
    expect(next).toHaveLength(1);
    expect(next[0].serviceName).toBe('Full Detail');
    expect(removeEditJobAtIndex([existingJob], 0)).toHaveLength(1);
  });
});

describe('visitGrossCentsFromEditJobs', () => {
  it('sums service and add-on prices across jobs', () => {
    expect(visitGrossCentsFromEditJobs([existingJob, addedJob])).toBe(25000);
  });
});

describe('commit added job payload', () => {
  it('writes visit count, duration, and rolled-up prices for save', () => {
    const jobs = appendAddedEditJob([existingJob], addedJob);
    const payload = buildEditBookingUpdatePayload({
      selectedService: { name: 'Full Detail' },
      selectedServiceId: 'svc-1',
      selectedPricingOption: existingJob.selectedPricingOption,
      selectedAddonRows: [],
      totalDurationMinutes: 90,
      selectedDateKey: '2026-09-13',
      selectedTime: '9:00 AM',
      customer: { fullName: 'Alex', email: '', phone: '5125550101' },
      address: { street: '1 Main', unit: '', city: 'Austin', state: 'TX', zip: '78701' },
      vehicle: existingJob.vehicle,
      notes: '',
      appointmentLocationType: 'shop',
      jobs,
    });

    expect(payload.visit_job_count).toBe(2);
    expect(payload.duration_minutes).toBe(135);
    expect(payload.service_price_cents).toBe(23000);
    expect(payload.job_details).toHaveLength(2);
    expect(visitGrossCentsFromEditJobs(jobs)).toBe(25000);
  });
});
