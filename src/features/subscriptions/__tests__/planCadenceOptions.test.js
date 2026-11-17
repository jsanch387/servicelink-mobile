import { PLAN_CADENCE_PRESETS, cadenceKeyFromParts } from '../constants/planCadence';
import { buildMembershipPlanWriteBody } from '../utils/buildMembershipPlanWriteBody';

describe('plan cadence options', () => {
  it('offers every 3 months and every 6 months', () => {
    expect(PLAN_CADENCE_PRESETS.map((preset) => preset.key)).toEqual([
      'every_1_week',
      'every_2_weeks',
      'monthly',
      'every_3_months',
      'every_6_months',
    ]);
    expect(cadenceKeyFromParts(3, 'month')).toBe('every_3_months');
    expect(cadenceKeyFromParts(6, 'month')).toBe('every_6_months');
  });

  it('writes 3-month and 6-month prices as month cadence options', () => {
    expect(
      buildMembershipPlanWriteBody({
        name: 'Exterior Wash',
        visitDurationMinutes: 60,
        offeredSchedules: [
          { count: 3, interval: 'month', priceCents: 15000 },
          { count: 6, interval: 'month', priceCents: 24000 },
        ],
      }),
    ).toMatchObject({
      name: 'Exterior Wash',
      visitDurationMinutes: 60,
      cadenceOptions: [
        { intervalUnit: 'month', intervalCount: 3, priceCents: 15000 },
        { intervalUnit: 'month', intervalCount: 6, priceCents: 24000 },
      ],
    });
  });
});
