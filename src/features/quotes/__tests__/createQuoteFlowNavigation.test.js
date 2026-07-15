import { CREATE_QUOTE_STEP } from '../constants/createQuoteWizard';
import {
  getCreateQuoteWizardStepCount,
  getNextCreateQuoteStepOnContinue,
  getPreviousCreateQuoteStepOnBack,
  isCreateQuoteAddonsStepSkipped,
  isCreateQuoteDetailsStepSkipped,
} from '../utils/createQuoteFlowNavigation';

describe('createQuoteFlowNavigation', () => {
  it('skips details for catalog services with at most one pricing tier', () => {
    expect(isCreateQuoteDetailsStepSkipped({ isCustomJob: false, pricingOptionsCount: 1 })).toBe(
      true,
    );
    expect(isCreateQuoteDetailsStepSkipped({ isCustomJob: false, pricingOptionsCount: 2 })).toBe(
      false,
    );
  });

  it('skips add-ons for custom jobs and services without add-ons', () => {
    expect(isCreateQuoteAddonsStepSkipped({ isCustomJob: true, addonsCount: 2 })).toBe(true);
    expect(isCreateQuoteAddonsStepSkipped({ isCustomJob: false, addonsCount: 0 })).toBe(true);
  });

  it('continues from service into details, add-ons, or schedule depending on skips', () => {
    expect(
      getNextCreateQuoteStepOnContinue({
        step: CREATE_QUOTE_STEP.SERVICE,
        detailsSkipped: true,
        addonsSkipped: true,
      }),
    ).toBe(CREATE_QUOTE_STEP.SCHEDULE);
  });

  it('moves from calendar pick to review', () => {
    expect(
      getNextCreateQuoteStepOnContinue({
        step: CREATE_QUOTE_STEP.SCHEDULE_PICK,
        detailsSkipped: true,
        addonsSkipped: true,
        schedulePickIncluded: true,
      }),
    ).toBe(CREATE_QUOTE_STEP.REVIEW);
  });

  it('backs from review to calendar when owner picked a date', () => {
    expect(
      getPreviousCreateQuoteStepOnBack({
        step: CREATE_QUOTE_STEP.REVIEW,
        detailsSkipped: true,
        addonsSkipped: true,
        schedulePickIncluded: true,
      }),
    ).toBe(CREATE_QUOTE_STEP.SCHEDULE_PICK);
    expect(
      getPreviousCreateQuoteStepOnBack({
        step: CREATE_QUOTE_STEP.REVIEW,
        detailsSkipped: true,
        addonsSkipped: true,
        schedulePickIncluded: false,
      }),
    ).toBe(CREATE_QUOTE_STEP.SCHEDULE);
  });

  it('counts the calendar step only when included', () => {
    expect(
      getCreateQuoteWizardStepCount({
        detailsSkipped: true,
        addonsSkipped: true,
        schedulePickIncluded: false,
      }),
    ).toBe(5);
    expect(
      getCreateQuoteWizardStepCount({
        detailsSkipped: true,
        addonsSkipped: true,
        schedulePickIncluded: true,
      }),
    ).toBe(6);
  });
});
