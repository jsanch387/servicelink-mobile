import {
  customerDetailMaintenanceActionLabel,
  maintenanceEnrollmentBlocksNewOwnerInvite,
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

  it('blocks a new invite when pending with invite token', () => {
    expect(maintenanceEnrollmentBlocksNewOwnerInvite(base)).toBe(true);
  });

  it('allows a new invite when pending without token', () => {
    expect(maintenanceEnrollmentBlocksNewOwnerInvite({ ...base, inviteToken: null })).toBe(false);
  });

  it('maps pending status label', () => {
    expect(maintenanceEnrollmentStatusLabel(base)).toBe('Pending');
  });

  it('uses service wording on customer detail action row', () => {
    expect(customerDetailMaintenanceActionLabel(null)).toBe('Offer maintenance service');
    expect(customerDetailMaintenanceActionLabel(base)).toBe('Maintenance · Pending');
  });

  it('partitions pending vs confirmed', () => {
    expect(maintenanceEnrollmentIsPending(base)).toBe(true);
    expect(maintenanceEnrollmentIsConfirmed({ ...base, status: 'accepted' })).toBe(true);
  });
});
