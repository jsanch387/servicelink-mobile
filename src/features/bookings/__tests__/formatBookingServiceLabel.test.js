import {
  formatBookingServiceLabel,
  getBookingServiceLabelParts,
} from '../utils/formatBookingServiceLabel';

describe('formatBookingServiceLabel', () => {
  it('strips pricing option from service_name', () => {
    expect(
      formatBookingServiceLabel({
        service_name: 'Signature Shine — SUV',
      }),
    ).toBe('Signature Shine');
  });

  it('appends +N more from job_details', () => {
    expect(
      formatBookingServiceLabel({
        service_name: 'Signature Shine — SUV',
        visit_job_count: 2,
        job_details: [
          { serviceName: 'Signature Shine', servicePriceOptionLabel: 'SUV' },
          { serviceName: 'Touch-up paint' },
        ],
      }),
    ).toBe('Signature Shine +1 more');
  });

  it('uses visit_job_count when job_details is missing', () => {
    expect(
      formatBookingServiceLabel({
        service_name: 'Full detail — Large',
        visit_job_count: 3,
      }),
    ).toBe('Full detail +2 more');
  });

  it('reads camelCase job fields', () => {
    expect(
      getBookingServiceLabelParts({
        serviceName: 'Wash',
        visitJobCount: 2,
        jobDetails: [{ serviceName: 'Wash' }, { serviceName: 'Wax' }],
      }),
    ).toEqual({
      primary: 'Wash',
      extraCount: 1,
      label: 'Wash +1 more',
    });
  });

  it('falls back to Service when empty', () => {
    expect(formatBookingServiceLabel({})).toBe('Service');
  });
});
