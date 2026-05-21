import { bookingLinkRequestQuoteOwnerHintCopy } from '../bookingLinkQuotePreviewCopy';

describe('bookingLinkRequestQuoteOwnerHintCopy', () => {
  it('explains customers use Request Quote on the booking link', () => {
    expect(bookingLinkRequestQuoteOwnerHintCopy.message).toMatch(/customers can request a quote/i);
    expect(bookingLinkRequestQuoteOwnerHintCopy.message).toMatch(/booking link/i);
    expect(bookingLinkRequestQuoteOwnerHintCopy.message).toMatch(/for them/i);
  });
});
