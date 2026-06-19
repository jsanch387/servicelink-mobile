import {
  TAP_TO_PAY_GET_STARTED_LABEL,
  TAP_TO_PAY_NOT_SET_UP_HINT,
  TAP_TO_PAY_NOT_SET_UP_TITLE,
} from '../constants/tapToPayConnectCopy';

describe('tapToPayConnectCopy', () => {
  it('uses clear not-set-up messaging for the Complete sheet', () => {
    expect(TAP_TO_PAY_NOT_SET_UP_TITLE).toMatch(/not set up/i);
    expect(TAP_TO_PAY_NOT_SET_UP_HINT.length).toBeGreaterThan(10);
    expect(TAP_TO_PAY_GET_STARTED_LABEL).toBe('Get started');
  });
});
