import {
  mapMaintenanceDetailModel,
  mapMaintenanceEnrollmentCard,
  partitionMaintenanceInbox,
} from '../utils/maintenancePresentation';

function customerRow(enrollmentId, status, extras = {}) {
  return {
    id: 'cust-1',
    fullName: 'Alex Rivera',
    email: 'alex@example.com',
    maintenanceEnrollment: {
      enrollmentId,
      status,
      paymentStatus: extras.paymentStatus ?? 'pending',
      serviceNameSnapshot: 'Maintenance',
      priceCents: extras.priceCents ?? 10000,
      frequencyWeeks: 0,
      durationMinutes: extras.durationMinutes ?? 120,
      anchorDate: extras.anchorDate ?? '2026-06-01',
      anchorTime: extras.anchorTime ?? '09:00:00',
      inviteToken: extras.inviteToken ?? 'tok-abc',
      initialBookingId: extras.initialBookingId ?? null,
      linkedBookingStatus: extras.linkedBookingStatus ?? null,
    },
  };
}

describe('maintenancePresentation', () => {
  describe('partitionMaintenanceInbox', () => {
    it('splits pending, confirmed, and completed into separate tabs', () => {
      const rows = [
        customerRow('e-pending', 'enrolled_pending_customer'),
        customerRow('e-confirmed', 'accepted', { paymentStatus: 'paid' }),
        customerRow('e-done', 'accepted', {
          paymentStatus: 'paid',
          initialBookingId: 'book-1',
          linkedBookingStatus: 'completed',
        }),
      ];

      const partitioned = partitionMaintenanceInbox(rows);

      expect(partitioned.pending.map((r) => r.maintenanceEnrollment?.enrollmentId)).toEqual([
        'e-pending',
      ]);
      expect(partitioned.confirmed.map((r) => r.maintenanceEnrollment?.enrollmentId)).toEqual([
        'e-confirmed',
      ]);
      expect(partitioned.completed.map((r) => r.maintenanceEnrollment?.enrollmentId)).toEqual([
        'e-done',
      ]);
    });

    it('does not double-count completed enrollments on confirmed tab', () => {
      const rows = [
        customerRow('e-done', 'accepted', {
          linkedBookingStatus: 'completed',
          initialBookingId: 'book-1',
        }),
      ];

      const partitioned = partitionMaintenanceInbox(rows);
      expect(partitioned.confirmed).toHaveLength(0);
      expect(partitioned.completed).toHaveLength(1);
    });
  });

  describe('mapMaintenanceEnrollmentCard', () => {
    it('maps list card fields and completed pill raw status', () => {
      const card = mapMaintenanceEnrollmentCard(
        customerRow('e-done', 'accepted', { linkedBookingStatus: 'completed' }),
      );

      expect(card).toMatchObject({
        customerId: 'cust-1',
        customerName: 'Alex Rivera',
        enrollmentId: 'e-done',
        statusLabel: 'Completed',
        statusRaw: 'visit_completed',
        line: '$100 · 2 hrs',
      });
    });
  });

  describe('mapMaintenanceDetailModel', () => {
    const origin = 'https://app.example.com';

    it('builds invite link and pending delete affordance', () => {
      const model = mapMaintenanceDetailModel(
        customerRow('e-pending', 'enrolled_pending_customer'),
        origin,
      );

      expect(model.inviteLink).toBe(`${origin}/maintenance/e/tok-abc`);
      expect(model.canCopyLink).toBe(true);
      expect(model.canDelete).toBe(true);
      expect(model.statusLabel).toBe('Pending');
      expect(model.payment.visible).toBe(false);
    });

    it('shows owner schedule and paid online payment for confirmed enrollment', () => {
      const model = mapMaintenanceDetailModel(
        customerRow('e-confirmed', 'accepted', { paymentStatus: 'paid' }),
        origin,
      );

      expect(model.statusLabel).toBe('Confirmed');
      expect(model.statusRaw).toBe('accepted');
      expect(model.showCustomerChoosesSchedule).toBe(false);
      expect(model.anchorDateDisplay).toMatch(/June 1, 2026/);
      expect(model.payment).toMatchObject({
        visible: true,
        status: 'Paid online',
        detail: '$100',
      });
      expect(model.canDelete).toBe(false);
    });

    it('marks completed when linked booking is done', () => {
      const model = mapMaintenanceDetailModel(
        customerRow('e-done', 'accepted', {
          paymentStatus: 'paid',
          linkedBookingStatus: 'completed',
          initialBookingId: 'book-1',
        }),
        origin,
      );

      expect(model.statusLabel).toBe('Completed');
      expect(model.statusRaw).toBe('visit_completed');
      expect(model.initialBookingId).toBe('book-1');
    });
  });
});
