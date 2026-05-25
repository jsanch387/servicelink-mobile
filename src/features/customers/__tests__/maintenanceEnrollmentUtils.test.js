import {
  maintenanceEnrollmentHasCompletedVisit,
  maintenanceEnrollmentIsCompleted,
  maintenanceEnrollmentIsConfirmed,
  maintenanceEnrollmentIsPending,
  maintenanceEnrollmentStatusLabel,
} from '../../maintenance/utils/maintenanceEnrollmentUtils';

describe('maintenanceEnrollmentUtils', () => {
  const base = {
    enrollmentId: 'e1',
    status: 'enrolled_pending_customer',
    paymentStatus: 'pending',
    serviceNameSnapshot: 'Maintenance',
    priceCents: 10000,
    frequencyWeeks: 0,
    durationMinutes: 120,
    inviteToken: 'abc',
  };

  it('maps pending status label', () => {
    expect(maintenanceEnrollmentStatusLabel(base)).toBe('Pending');
  });

  it('partitions pending vs confirmed vs completed', () => {
    expect(maintenanceEnrollmentIsPending(base)).toBe(true);
    expect(maintenanceEnrollmentIsConfirmed({ ...base, status: 'accepted' })).toBe(true);
    expect(maintenanceEnrollmentIsCompleted({ ...base, status: 'accepted' })).toBe(false);
  });

  it('uses confirmed label for accepted pay in person (payment shown in detail section)', () => {
    expect(
      maintenanceEnrollmentStatusLabel({
        ...base,
        status: 'accepted',
        paymentStatus: 'pay_in_person',
      }),
    ).toBe('Confirmed');
  });

  it('shows completed when linked booking is completed (enrollment stays accepted)', () => {
    const enrollment = {
      ...base,
      status: 'accepted',
      initialBookingId: 'book-1',
      linkedBookingStatus: 'completed',
    };
    expect(maintenanceEnrollmentHasCompletedVisit(enrollment)).toBe(true);
    expect(maintenanceEnrollmentStatusLabel(enrollment)).toBe('Completed');
    expect(maintenanceEnrollmentIsCompleted(enrollment)).toBe(true);
    expect(maintenanceEnrollmentIsConfirmed(enrollment)).toBe(false);
  });
});
