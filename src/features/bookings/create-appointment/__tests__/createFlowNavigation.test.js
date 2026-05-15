import { CREATE_APPOINTMENT_STEP } from '../constants';
import {
  getCreateAppointmentProgressFraction,
  getCreateAppointmentVisibleStepOrder,
  getNextStepOnContinue,
  getPreviousStepOnBack,
  isAddonsStepSkipped,
} from '../utils/createFlowNavigation';
import { shouldSkipCreateFlowPricingStep } from '../utils/createFlowPricing';

describe('createFlowNavigation', () => {
  describe('isAddonsStepSkipped', () => {
    it('is true only when catalog is known and there are no add-ons', () => {
      expect(isAddonsStepSkipped(false, 0)).toBe(false);
      expect(isAddonsStepSkipped(true, 2)).toBe(false);
      expect(isAddonsStepSkipped(true, 0)).toBe(true);
    });
  });

  describe('getCreateAppointmentVisibleStepOrder', () => {
    it('drops pricing and add-ons when both skipped', () => {
      const o = getCreateAppointmentVisibleStepOrder(true, true);
      expect(o).toEqual([0, 3, 4, 5, 6, 7]);
    });

    it('keeps pricing when not skipped', () => {
      const o = getCreateAppointmentVisibleStepOrder(false, true);
      expect(o).toEqual([0, 1, 3, 4, 5, 6, 7]);
    });
  });

  describe('getCreateAppointmentProgressFraction', () => {
    it('uses visible step count when both optional steps skipped', () => {
      const f = getCreateAppointmentProgressFraction(CREATE_APPOINTMENT_STEP.SCHEDULE, {
        appointmentConfirmed: false,
        pricingSkipped: true,
        addonsSkipped: true,
      });
      expect(f).toBeCloseTo(2 / 6);
    });
  });

  describe('getNextStepOnContinue', () => {
    it('service → schedule when pricing and add-ons skipped', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.SERVICE,
          addonsSkipped: true,
          pricingSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
    });

    it('service → add-ons when only pricing skipped', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.SERVICE,
          addonsSkipped: false,
          pricingSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.ADDONS);
    });

    it('service → pricing when pricing not skipped', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.SERVICE,
          addonsSkipped: true,
          pricingSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.PRICING);
    });

    it('pricing → schedule when add-ons skipped', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.PRICING,
          addonsSkipped: true,
          pricingSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
    });

    it('pricing → add-ons when add-ons exist', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.PRICING,
          addonsSkipped: false,
          pricingSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.ADDONS);
    });

    it('increments normally from add-ons', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.ADDONS,
          addonsSkipped: false,
          pricingSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
    });
  });

  describe('getPreviousStepOnBack', () => {
    it('schedule → service when both optional steps were skipped', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.SCHEDULE,
          addonsSkipped: true,
          pricingSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SERVICE);
    });

    it('schedule → pricing when only add-ons skipped', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.SCHEDULE,
          addonsSkipped: true,
          pricingSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.PRICING);
    });

    it('schedule → add-ons when add-ons exist', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.SCHEDULE,
          addonsSkipped: false,
          pricingSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.ADDONS);
    });

    it('add-ons → service when pricing was skipped', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.ADDONS,
          addonsSkipped: false,
          pricingSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SERVICE);
    });

    it('add-ons → pricing when pricing was shown', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.ADDONS,
          addonsSkipped: false,
          pricingSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.PRICING);
    });
  });
});

describe('shouldSkipCreateFlowPricingStep', () => {
  const row = { id: 's1', price_options_enabled: true };

  it('is false while price options load for Pro tiered service', () => {
    expect(
      shouldSkipCreateFlowPricingStep({
        selectedServiceId: 's1',
        selectedServiceRow: row,
        ownerHasPro: true,
        priceOptionsEnabled: true,
        priceOptionsLoading: true,
        pricingOptionsCount: 1,
      }),
    ).toBe(false);
  });

  it('is true after load when only one tier', () => {
    expect(
      shouldSkipCreateFlowPricingStep({
        selectedServiceId: 's1',
        selectedServiceRow: row,
        ownerHasPro: true,
        priceOptionsEnabled: true,
        priceOptionsLoading: false,
        pricingOptionsCount: 1,
      }),
    ).toBe(true);
  });

  it('is false when multiple tiers', () => {
    expect(
      shouldSkipCreateFlowPricingStep({
        selectedServiceId: 's1',
        selectedServiceRow: row,
        ownerHasPro: true,
        priceOptionsEnabled: true,
        priceOptionsLoading: false,
        pricingOptionsCount: 2,
      }),
    ).toBe(false);
  });
});
