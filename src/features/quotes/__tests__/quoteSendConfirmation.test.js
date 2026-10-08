import { quoteSendConfirmationBody } from '../utils/quoteSendConfirmation';

describe('quoteSendConfirmationBody', () => {
  it('names both channels when the quote was emailed and texted', () => {
    expect(quoteSendConfirmationBody({ emailSent: true, smsSent: true })).toBe(
      "We've emailed and texted the quote.",
    );
  });

  it('names email when that is the only channel', () => {
    expect(quoteSendConfirmationBody({ emailSent: true, smsSent: false })).toBe(
      "We've emailed the quote.",
    );
  });

  it('names a text when that is the only channel', () => {
    expect(quoteSendConfirmationBody({ emailSent: false, smsSent: true })).toBe(
      "We've texted the quote.",
    );
  });
});
