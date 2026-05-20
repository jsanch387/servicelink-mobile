import {
  PAYMENTS_WEB_ACCESS_CTA,
  PAYMENTS_WEB_ACCESS_SUBTITLE,
  PAYMENTS_WEB_ACCESS_TITLE,
} from '../constants/paymentsAccessCopy';

describe('paymentsAccessCopy', () => {
  it('avoids upgrade and Pro product language', () => {
    const blob = `${PAYMENTS_WEB_ACCESS_TITLE} ${PAYMENTS_WEB_ACCESS_SUBTITLE} ${PAYMENTS_WEB_ACCESS_CTA}`;
    expect(blob).not.toMatch(/upgrade/i);
    expect(blob).not.toMatch(/\bpro\b/i);
    expect(PAYMENTS_WEB_ACCESS_CTA).toBe('Sign in on the web');
  });
});
