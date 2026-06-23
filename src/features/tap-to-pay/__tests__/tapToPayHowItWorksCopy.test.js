import {
  TAP_TO_PAY_HOW_IT_WORKS_LABEL,
  TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE,
  TAP_TO_PAY_HOW_IT_WORKS_STEPS,
  TAP_TO_PAY_PAYMENTS_CARD_TITLE,
  TAP_TO_PAY_VIEW_DEMO_LABEL,
} from '../constants/tapToPayHowItWorksCopy';

describe('tapToPayHowItWorksCopy', () => {
  it('defines payments card and sheet copy', () => {
    expect(TAP_TO_PAY_PAYMENTS_CARD_TITLE).toBe('Tap to Pay');
    expect(TAP_TO_PAY_HOW_IT_WORKS_LABEL).toBe('How it works');
    expect(TAP_TO_PAY_VIEW_DEMO_LABEL).toBe('View demo');
    expect(TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE).toBe('How Tap to Pay works');
    expect(TAP_TO_PAY_HOW_IT_WORKS_STEPS).toHaveLength(4);
    expect(TAP_TO_PAY_HOW_IT_WORKS_STEPS[1]).toMatch(/complete screen/i);
  });
});
