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
    it('drops pricing, add-ons, location, and address when all skipped', () => {
      const o = getCreateAppointmentVisibleStepOrder(true, true, true, true);
      expect(o).toEqual([0, 3, 4, 7, 8]);
    });

    it('keeps pricing when not skipped', () => {
      const o = getCreateAppointmentVisibleStepOrder(false, true, true, true);
      expect(o).toEqual([0, 1, 3, 4, 7, 8]);
    });

    it('keeps location and address when business offers both and mobile selected', () => {
      const o = getCreateAppointmentVisibleStepOrder(true, true, false, false);
      expect(o).toEqual([0, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('getCreateAppointmentProgressFraction', () => {
    it('uses visible step count when optional steps skipped', () => {
      const f = getCreateAppointmentProgressFraction(CREATE_APPOINTMENT_STEP.SCHEDULE, {
        appointmentConfirmed: false,
        pricingSkipped: true,
        addonsSkipped: true,
        locationSkipped: true,
        addressSkipped: true,
      });
      expect(f).toBeCloseTo(2 / 5);
    });
  });

  describe('getNextStepOnContinue', () => {
    it('service → schedule when pricing and add-ons skipped', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.SERVICE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
    });

    it('customer → location when business offers both', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.CUSTOMER,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: false,
          addressSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.LOCATION);
    });

    it('customer → vehicle when location and address skipped (shop only)', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.CUSTOMER,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.VEHICLE);
    });

    it('location → vehicle when address skipped (shop selected)', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.LOCATION,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: false,
          addressSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.VEHICLE);
    });

    it('location → address when mobile selected', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.LOCATION,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: false,
          addressSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.ADDRESS);
    });
  });

  describe('getPreviousStepOnBack', () => {
    it('vehicle → location when address skipped but location shown', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.VEHICLE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: false,
          addressSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.LOCATION);
    });

    it('vehicle → customer when location and address skipped', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.VEHICLE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.CUSTOMER);
    });

    it('address → location when location step shown', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.ADDRESS,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: false,
          addressSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.LOCATION);
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
