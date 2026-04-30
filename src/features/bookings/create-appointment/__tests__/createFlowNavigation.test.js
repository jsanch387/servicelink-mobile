import { CREATE_APPOINTMENT_STEP } from '../constants';
import {
  getNextStepOnContinue,
  getPreviousStepOnBack,
  isAddonsStepSkipped,
} from '../utils/createFlowNavigation';

describe('createFlowNavigation', () => {
  describe('isAddonsStepSkipped', () => {
    it('is true only when catalog is known and there are no add-ons', () => {
      expect(isAddonsStepSkipped(false, 0)).toBe(false);
      expect(isAddonsStepSkipped(true, 2)).toBe(false);
      expect(isAddonsStepSkipped(true, 0)).toBe(true);
    });
  });

  describe('getNextStepOnContinue', () => {
    it('skips from pricing to schedule when add-ons are empty', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.PRICING,
          addonCatalogKnown: true,
          addonsCount: 0,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
    });

    it('goes to add-ons when service has add-ons', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.PRICING,
          addonCatalogKnown: true,
          addonsCount: 2,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.ADDONS);
    });

    it('increments normally otherwise', () => {
      expect(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.ADDONS,
          addonCatalogKnown: true,
          addonsCount: 1,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.SCHEDULE);
    });
  });

  describe('getPreviousStepOnBack', () => {
    it('jumps schedule → pricing when add-ons were skipped', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.SCHEDULE,
          addonCatalogKnown: true,
          addonsCount: 0,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.PRICING);
    });

    it('uses linear back when add-ons exist', () => {
      expect(
        getPreviousStepOnBack({
          step: CREATE_APPOINTMENT_STEP.SCHEDULE,
          addonCatalogKnown: true,
          addonsCount: 1,
        }),
      ).toBe(CREATE_APPOINTMENT_STEP.ADDONS);
    });
  });
});
