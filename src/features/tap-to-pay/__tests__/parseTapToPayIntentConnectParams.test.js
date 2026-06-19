import { parseTapToPayIntentConnectParams } from '../utils/parseTapToPayIntentConnectParams';

describe('parseTapToPayIntentConnectParams', () => {
  it('reads connect fields from intent payload', () => {
    expect(
      parseTapToPayIntentConnectParams({
        terminalLocationId: 'tml_123',
        stripeAccountId: 'acct_456',
        merchantDisplayName: 'Bright Detail',
      }),
    ).toEqual({
      terminalLocationId: 'tml_123',
      stripeAccountId: 'acct_456',
      merchantDisplayName: 'Bright Detail',
    });
  });

  it('supports alternate server field names', () => {
    expect(
      parseTapToPayIntentConnectParams({
        locationId: 'tml_alt',
        onBehalfOf: 'acct_alt',
        merchant_display_name: 'Alt Name',
      }),
    ).toEqual({
      terminalLocationId: 'tml_alt',
      stripeAccountId: 'acct_alt',
      merchantDisplayName: 'Alt Name',
    });
  });
});
