import { canAdvanceMaintenanceInviteStep } from '../maintenance-invite/utils/maintenanceInviteStepGuards';

describe('canAdvanceMaintenanceInviteStep', () => {
  const planOk = { priceUsdText: '50', durationHhMm: '01:00' };

  it('allows skipping schedule when no date is chosen', () => {
    expect(
      canAdvanceMaintenanceInviteStep(1, {
        ...planOk,
        preferredDateYyyyMmDd: '',
        preferredTime12h: '10:00 AM',
      }),
    ).toBe(true);
  });

  it('requires time when a date is chosen', () => {
    expect(
      canAdvanceMaintenanceInviteStep(1, {
        ...planOk,
        preferredDateYyyyMmDd: '2026-06-15',
        preferredTime12h: '',
      }),
    ).toBe(false);
    expect(
      canAdvanceMaintenanceInviteStep(1, {
        ...planOk,
        preferredDateYyyyMmDd: '2026-06-15',
        preferredTime12h: '10:00 AM',
      }),
    ).toBe(true);
  });
});
