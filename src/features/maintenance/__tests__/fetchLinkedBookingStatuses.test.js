import {
  attachLinkedBookingStatuses,
  collectInitialBookingIdsFromCustomers,
} from '../api/fetchLinkedBookingStatuses';
import { maintenanceEnrollmentStatusLabel } from '../utils/maintenanceEnrollmentUtils';

describe('fetchLinkedBookingStatuses', () => {
  const baseCustomer = {
    id: 'c1',
    fullName: 'Alex',
    email: 'a@example.com',
    maintenanceEnrollment: {
      enrollmentId: 'e1',
      status: 'accepted',
      paymentStatus: 'paid',
      serviceNameSnapshot: 'Maintenance',
      priceCents: 10000,
      frequencyWeeks: 0,
      durationMinutes: 60,
      initialBookingId: 'book-1',
      linkedBookingStatus: null,
    },
  };

  it('collects initial booking ids from enrollments', () => {
    expect(collectInitialBookingIdsFromCustomers([baseCustomer])).toEqual(['book-1']);
  });

  it('attaches linked booking status for completed UI', () => {
    const enriched = attachLinkedBookingStatuses(
      [baseCustomer],
      new Map([['book-1', 'completed']]),
    );

    expect(enriched[0].maintenanceEnrollment?.linkedBookingStatus).toBe('completed');
    expect(maintenanceEnrollmentStatusLabel(enriched[0].maintenanceEnrollment)).toBe('Completed');
  });
});
