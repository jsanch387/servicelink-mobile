import { quotesAcceptRequestsAccessCopy } from '../constants/quotesAccessCopy';

describe('quotesAcceptRequestsAccessCopy', () => {
  it('explains quotes and points free users to subscribe on the website', () => {
    expect(quotesAcceptRequestsAccessCopy.cardSubtitle).toMatch(/booking link/i);
    expect(quotesAcceptRequestsAccessCopy.cardSubtitle).toMatch(/accept/i);
    expect(quotesAcceptRequestsAccessCopy.cardHint).toMatch(/website/i);
    expect(quotesAcceptRequestsAccessCopy.inlineAction).toBe('Subscribe on the website');
    expect(quotesAcceptRequestsAccessCopy.alertMessage).toMatch(
      /Subscribe on the ServiceLink website/i,
    );
  });
});
