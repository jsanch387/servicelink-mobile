import { CREATE_APPOINTMENT_STEP } from '../constants';
import {
  getCreateAppointmentProgressFraction,
  getCreateAppointmentVisibleStepOrder,
  getNextStepOnContinue,
  getPreviousStepOnBack,
  getStepAfterAddons,
  getStepAfterCustomer,
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
      expect(o).toEqual([
        CREATE_APPOINTMENT_STEP.SERVICE,
        CREATE_APPOINTMENT_STEP.CUSTOMER,
        CREATE_APPOINTMENT_STEP.VEHICLE,
        CREATE_APPOINTMENT_STEP.SCHEDULE,
        CREATE_APPOINTMENT_STEP.REVIEW,
      ]);
    });

    it('keeps pricing when not skipped', () => {
      const o = getCreateAppointmentVisibleStepOrder(false, true, true, true);
      expect(o).toEqual([
        CREATE_APPOINTMENT_STEP.SERVICE,
        CREATE_APPOINTMENT_STEP.PRICING,
        CREATE_APPOINTMENT_STEP.CUSTOMER,
        CREATE_APPOINTMENT_STEP.VEHICLE,
        CREATE_APPOINTMENT_STEP.SCHEDULE,
        CREATE_APPOINTMENT_STEP.REVIEW,
      ]);
    });

    it('places customer before location/address, then vehicle, then schedule', () => {
      const o = getCreateAppointmentVisibleStepOrder(true, true, false, false);
      expect(o).toEqual([
        CREATE_APPOINTMENT_STEP.SERVICE,
        CREATE_APPOINTMENT_STEP.CUSTOMER,
        CREATE_APPOINTMENT_STEP.LOCATION,
        CREATE_APPOINTMENT_STEP.ADDRESS,
        CREATE_APPOINTMENT_STEP.VEHICLE,
        CREATE_APPOINTMENT_STEP.SCHEDULE,
        CREATE_APPOINTMENT_STEP.REVIEW,
      ]);
    });

    it('omits customer, location, address, and schedule on job 2+', () => {
      const o = getCreateAppointmentVisibleStepOrder(true, true, false, false, 1);
      expect(o).toEqual([
        CREATE_APPOINTMENT_STEP.SERVICE,
        CREATE_APPOINTMENT_STEP.VEHICLE,
        CREATE_APPOINTMENT_STEP.REVIEW,
      ]);
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
      expect(f).toBeCloseTo(4 / 5);
    });
  });

  describe('getStepAfterAddons', () => {
    it('goes to customer first on job 1', () => {
      expect(
        getStepAfterAddons({ locationSkipped: false, addressSkipped: false, jobIndex: 0 }),
      ).toBe(CREATE_APPOINTMENT_STEP.CUSTOMER);
    });

    it('skips to vehicle on job 2+', () => {
      expect(
        getStepAfterAddons({ locationSkipped: false, addressSkipped: false, jobIndex: 1 }),
      ).toBe(CREATE_APPOINTMENT_STEP.VEHICLE);
    });
  });

  describe('getStepAfterCustomer', () => {
    it('goes to location when shown', () => {
      expect(getStepAfterCustomer({ locationSkipped: false, addressSkipped: false })).toBe(
        CREATE_APPOINTMENT_STEP.LOCATION,
      );
    });

    it('goes to address when location skipped', () => {
      expect(getStepAfterCustomer({ locationSkipped: true, addressSkipped: false })).toBe(
        CREATE_APPOINTMENT_STEP.ADDRESS,
      );
    });
  });

  describe('getNextStepOnContinue', () => {
    it('service → customer when pricing, add-ons, location, and address skipped', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.SERVICE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.CUSTOMER);
    });

    it('addons → customer on job 1', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.ADDONS,
          addonsSkipped: false,
          pricingSkipped: true,
          locationSkipped: false,
          addressSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.CUSTOMER);
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

    it('vehicle → schedule when visit has no time yet', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.VEHICLE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
          jobIndex: 0,
          hasScheduleSlot: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
    });

    it('vehicle → review when schedule already set', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.VEHICLE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
          jobIndex: 1,
          hasScheduleSlot: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.REVIEW);
    });

    it('vehicle → schedule on job 2+ when schedule not set yet', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.VEHICLE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
          jobIndex: 1,
          hasScheduleSlot: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
    });

    it('schedule → review', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.SCHEDULE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.REVIEW);
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
    it('vehicle → address when address shown', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.VEHICLE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: false,
          addressSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.ADDRESS);
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

    it('schedule → vehicle', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.SCHEDULE,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.VEHICLE);
    });

    it('review → vehicle on job 2+', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.REVIEW,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
          jobIndex: 1,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.VEHICLE);
    });

    it('review → schedule on job 1', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.REVIEW,
          addonsSkipped: true,
          pricingSkipped: true,
          locationSkipped: true,
          addressSkipped: true,
          jobIndex: 0,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
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

    it('customer → addons when addons shown', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.CUSTOMER,
          addonsSkipped: false,
          pricingSkipped: true,
          locationSkipped: false,
          addressSkipped: false,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.ADDONS);
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
