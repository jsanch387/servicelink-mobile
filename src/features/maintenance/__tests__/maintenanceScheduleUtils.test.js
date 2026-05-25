import {
  maintenanceEnrollmentHasOwnerSuggestedSchedule,
  maintenanceEnrollmentShowsCustomerChoosesSchedule,
} from '../utils/maintenanceScheduleUtils';
import { MAINTENANCE_ENROLLMENT_PENDING_STATUS } from '../utils/maintenanceEnrollmentUtils';

const pending = {
  enrollmentId: 'e1',
  status: MAINTENANCE_ENROLLMENT_PENDING_STATUS,
  paymentStatus: 'pending',
  serviceNameSnapshot: 'Maintenance',
  priceCents: 10000,
  frequencyWeeks: 0,
  durationMinutes: 60,
};

describe('maintenanceScheduleUtils', () => {
  it('treats missing anchor as customer chooses schedule on pending rows', () => {
    expect(maintenanceEnrollmentHasOwnerSuggestedSchedule({ ...pending, anchorDate: null })).toBe(
      false,
    );
    expect(
      maintenanceEnrollmentShowsCustomerChoosesSchedule({ ...pending, anchorDate: null }),
    ).toBe(true);
  });

  it('recognizes owner-suggested date and time', () => {
    const enrollment = {
      ...pending,
      anchorDate: '2026-08-20',
      anchorTime: '14:30:00',
      createdAt: '2026-06-01T12:00:00.000Z',
    };
    expect(maintenanceEnrollmentHasOwnerSuggestedSchedule(enrollment)).toBe(true);
    expect(maintenanceEnrollmentShowsCustomerChoosesSchedule(enrollment)).toBe(false);
  });

  it('ignores create-day 10:00 anchor stamped on pending enrollments without owner schedule', () => {
    const enrollment = {
      ...pending,
      anchorDate: '2026-06-15T00:00:00.000Z',
      anchorTime: '10:00:00',
      createdAt: '2026-06-15T18:22:00.000Z',
    };
    expect(maintenanceEnrollmentHasOwnerSuggestedSchedule(enrollment)).toBe(false);
    expect(maintenanceEnrollmentShowsCustomerChoosesSchedule(enrollment)).toBe(true);
  });

  it('does not show customer-chooses copy on confirmed enrollments', () => {
    expect(
      maintenanceEnrollmentShowsCustomerChoosesSchedule({
        ...pending,
        status: 'accepted',
        paymentStatus: 'paid',
        anchorDate: null,
      }),
    ).toBe(false);
  });
});
