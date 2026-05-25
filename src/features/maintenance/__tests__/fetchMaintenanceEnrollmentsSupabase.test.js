import {
  mapMaintenanceCustomerRecord,
  mapMaintenanceEnrollmentRowsForInbox,
  parseMaintenanceEnrollmentRow,
} from '../api/fetchMaintenanceEnrollmentsSupabase';
import { attachLinkedBookingStatuses } from '../api/fetchLinkedBookingStatuses';
import {
  mapMaintenanceEnrollmentCard,
  partitionMaintenanceInbox,
} from '../utils/maintenancePresentation';

describe('fetchMaintenanceEnrollmentsSupabase', () => {
  it('parses a maintenance_enrollments row from Supabase', () => {
    expect(
      parseMaintenanceEnrollmentRow({
        id: 'e1',
        status: 'enrolled_pending_customer',
        payment_status: 'pending',
        service_name_snapshot: 'Maintenance',
        price_cents: 10000,
        frequency_weeks: 0,
        duration_minutes: 120,
        anchor_date: '2026-06-15',
        anchor_time: '10:00:00',
        customer_invite_token: 'abc',
      }),
    ).toEqual({
      enrollmentId: 'e1',
      status: 'enrolled_pending_customer',
      paymentStatus: 'pending',
      customerSelectedPayment: null,
      serviceNameSnapshot: 'Maintenance',
      priceCents: 10000,
      frequencyWeeks: 0,
      durationMinutes: 120,
      anchorDate: '2026-06-15',
      anchorTime: '10:00:00',
      inviteToken: 'abc',
      createdAt: null,
      initialBookingId: null,
      linkedBookingStatus: null,
    });
  });

  it('normalizes ISO anchor_date from Supabase', () => {
    expect(
      parseMaintenanceEnrollmentRow({
        id: 'e2',
        status: 'enrolled_pending_customer',
        anchor_date: '2026-06-15T00:00:00.000Z',
        anchor_time: '10:00:00',
      })?.anchorDate,
    ).toBe('2026-06-15');
  });

  it('maps customer + enrollment into CRM list shape', () => {
    const customer = mapMaintenanceCustomerRecord(
      {
        id: 'c1',
        full_name: 'Tristan Martinez',
        email: 't@example.com',
        maintenance_visits_completed: 2,
      },
      {
        id: 'e1',
        status: 'accepted',
        payment_status: 'paid',
        service_name_snapshot: 'Maintenance',
        price_cents: 8000,
        frequency_weeks: 0,
        duration_minutes: 90,
      },
    );

    expect(customer?.id).toBe('c1');
    expect(customer?.fullName).toBe('Tristan Martinez');
    expect(customer?.maintenanceEnrollment?.enrollmentId).toBe('e1');
    expect(customer?.maintenanceVisitsCompleted).toBe(2);
  });

  it('maps every enrollment for inbox (not just latest per customer)', () => {
    const customerById = {
      c1: {
        id: 'c1',
        full_name: 'Tristan Martinez',
        email: 't@example.com',
      },
    };

    const rows = mapMaintenanceEnrollmentRowsForInbox(customerById, [
      {
        id: 'e-pending',
        customer_id: 'c1',
        status: 'enrolled_pending_customer',
        payment_status: 'pending',
        price_cents: 9000,
        duration_minutes: 60,
      },
      {
        id: 'e-confirmed',
        customer_id: 'c1',
        status: 'accepted',
        payment_status: 'paid',
        price_cents: 8000,
        duration_minutes: 90,
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.maintenanceEnrollment?.enrollmentId)).toEqual([
      'e-pending',
      'e-confirmed',
    ]);

    const pendingCards = partitionMaintenanceInbox(rows).pending.map(mapMaintenanceEnrollmentCard);
    const confirmedCards = partitionMaintenanceInbox(rows).confirmed.map(
      mapMaintenanceEnrollmentCard,
    );
    const completedCards = partitionMaintenanceInbox(rows).completed.map(
      mapMaintenanceEnrollmentCard,
    );

    expect(pendingCards).toHaveLength(1);
    expect(confirmedCards).toHaveLength(1);
    expect(completedCards).toHaveLength(0);
    expect(pendingCards[0].enrollmentId).toBe('e-pending');
    expect(confirmedCards[0].enrollmentId).toBe('e-confirmed');
  });

  it('puts linked booking complete enrollments in completed tab only', () => {
    const customerById = {
      c1: { id: 'c1', full_name: 'Alex', email: 'a@example.com' },
    };

    const rows = attachLinkedBookingStatuses(
      mapMaintenanceEnrollmentRowsForInbox(customerById, [
        {
          id: 'e-done',
          customer_id: 'c1',
          status: 'accepted',
          initial_booking_id: 'book-1',
          price_cents: 8000,
          duration_minutes: 90,
        },
      ]),
      new Map([['book-1', 'completed']]),
    );

    const partitioned = partitionMaintenanceInbox(rows);
    expect(partitioned.pending).toHaveLength(0);
    expect(partitioned.confirmed).toHaveLength(0);
    expect(partitioned.completed).toHaveLength(1);
  });
});
