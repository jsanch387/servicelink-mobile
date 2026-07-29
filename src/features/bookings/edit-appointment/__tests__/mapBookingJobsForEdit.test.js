import {
  draftFieldsFromEditJob,
  flushEditDraftToJobSnapshot,
  isEditJobCustom,
  mergeActiveJobIntoJobs,
  resolvePricingIdFromLabelHint,
} from '../utils/editJobDraft';
import {
  formatEditJobsHubSummary,
  isMultiJobEdit,
  mapBookingJobsForEdit,
  sumEditJobsDurationMinutes,
} from '../utils/mapBookingJobsForEdit';

describe('mapBookingJobsForEdit', () => {
  it('maps multi-job job_details into edit snapshots', () => {
    const jobs = mapBookingJobsForEdit({
      service_name: 'Signature Shine',
      job_details: [
        {
          clientJobId: 'j1',
          serviceId: 'svc-1',
          serviceName: 'Signature Shine',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 22500,
          selectedAddOns: [{ id: 'a1', name: 'Pet hair', priceCents: 2500 }],
          durationMinutes: 120,
          vehicle: { year: '2022', make: 'Toyota', model: 'Highlander' },
        },
        {
          clientJobId: 'j2',
          serviceName: 'Touch-up paint',
          servicePriceCents: 7500,
          durationMinutes: 45,
          vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
        },
      ],
    });

    expect(jobs).toHaveLength(2);
    expect(isMultiJobEdit(jobs)).toBe(true);
    expect(formatEditJobsHubSummary(jobs)).toBe('Signature Shine +1 more');
    expect(sumEditJobsDurationMinutes(jobs)).toBe(165);
    expect(jobs[0]).toMatchObject({
      localId: 'j1',
      selectedServiceId: 'svc-1',
      serviceName: 'Signature Shine',
      selectedPricingOption: { label: 'SUV', priceCents: 22500 },
    });
    expect(jobs[0].vehicle).toEqual({
      year: '2022',
      make: 'Toyota',
      model: 'Highlander',
    });
    expect(isEditJobCustom(jobs[1])).toBe(true);
    expect(jobs[1].serviceName).toBe('Touch-up paint');
  });

  it('falls back to a single legacy job from flat columns', () => {
    const jobs = mapBookingJobsForEdit({
      service_id: 'svc-1',
      service_name: 'Wash',
      service_price_cents: 5000,
      duration_minutes: 60,
      customer_vehicle_year: 2020,
      customer_vehicle_make: 'Honda',
      customer_vehicle_model: 'Civic',
    });

    expect(jobs).toHaveLength(1);
    expect(isMultiJobEdit(jobs)).toBe(false);
    expect(jobs[0].selectedServiceId).toBe('svc-1');
    expect(jobs[0].vehicle.make).toBe('Honda');
  });
});

describe('editJobDraft', () => {
  it('hydrates and flushes an active job draft', () => {
    const mapped = mapBookingJobsForEdit({
      job_details: [
        {
          clientJobId: 'j1',
          serviceId: 'svc-1',
          serviceName: 'Detail',
          servicePriceCents: 10000,
          durationMinutes: 90,
          vehicle: { year: '2021', make: 'Ford', model: 'F-150' },
        },
      ],
    })[0];

    const draft = draftFieldsFromEditJob(mapped);
    expect(draft.selectedServiceId).toBe('svc-1');
    expect(draft.vehicle.model).toBe('F-150');

    const flushed = flushEditDraftToJobSnapshot({
      localId: mapped.localId,
      isCustomJob: false,
      selectedServiceId: 'svc-1',
      selectedService: { name: 'Detail Plus' },
      selectedPricingOption: { label: 'SUV', priceCents: 12000, durationMinutes: 90 },
      selectedAddonRows: [],
      totalDurationMinutes: 90,
      vehicle: draft.vehicle,
      selectedPricingId: 'tier-1',
      selectedAddonIds: [],
    });

    expect(flushed.serviceName).toBe('Detail Plus');
    expect(flushed.selectedPricingOption.priceCents).toBe(12000);
    expect(mergeActiveJobIntoJobs([mapped], 0, flushed)[0].serviceName).toBe('Detail Plus');
  });

  it('resolves pricing ids from label hints', () => {
    const options = [
      { id: 'a', label: 'Sedan' },
      { id: 'b', label: 'SUV' },
    ];
    expect(resolvePricingIdFromLabelHint(options, 'SUV', null)).toBe('b');
    expect(resolvePricingIdFromLabelHint(options, null, 'a')).toBe('a');
  });
});
