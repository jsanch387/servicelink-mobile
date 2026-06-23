import {
  TAP_TO_PAY_NOT_SET_UP_TITLE,
  TAP_TO_PAY_SETUP_DISMISS_LABEL,
  TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL,
} from '../constants/tapToPayConnectCopy';

describe('tapToPayConnectCopy', () => {
  it('uses clear not-set-up messaging for the Complete sheet', () => {
    expect(TAP_TO_PAY_NOT_SET_UP_TITLE).toBe('Payments not set up');
    expect(TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL).toBe('Set up payments');
    expect(TAP_TO_PAY_SETUP_DISMISS_LABEL).toBe('Not now');
  });
});
