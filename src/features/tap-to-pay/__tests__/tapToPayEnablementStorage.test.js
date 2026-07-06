import {
  buildTapToPayMerchantEnablementKey,
  clearTapToPayMerchantEnabled,
  isTapToPayMerchantEnabled,
  markTapToPayMerchantEnabled,
} from '../utils/tapToPayEnablementStorage';

describe('tapToPayEnablementStorage', () => {
  beforeEach(async () => {
    await clearTapToPayMerchantEnabled();
  });

  it('builds a stable merchant key', () => {
    expect(buildTapToPayMerchantEnablementKey('acct_1', 'tml_1')).toBe('acct_1|tml_1');
    expect(buildTapToPayMerchantEnablementKey('  ', 'tml_1')).toBeNull();
  });

  it('marks and reads enablement for the same merchant', async () => {
    await markTapToPayMerchantEnabled('acct_1', 'tml_1');
    await expect(isTapToPayMerchantEnabled('acct_1', 'tml_1')).resolves.toBe(true);
    await expect(isTapToPayMerchantEnabled('acct_2', 'tml_1')).resolves.toBe(false);
  });
});
