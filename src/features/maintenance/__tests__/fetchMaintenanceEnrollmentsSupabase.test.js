import {
  mapMaintenanceCustomerRecord,
  parseMaintenanceEnrollmentRow,
} from '../api/fetchMaintenanceEnrollmentsSupabase';

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
      serviceNameSnapshot: 'Maintenance',
      priceCents: 10000,
      frequencyWeeks: 0,
      durationMinutes: 120,
      anchorDate: '2026-06-15',
      anchorTime: '10:00:00',
      inviteToken: 'abc',
    });
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
});
