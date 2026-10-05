jest.mock('../../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: () => 'https://myservicelink.app',
}));

import { invoicePublicUrl } from '../invoicePublicUrl';

describe('invoicePublicUrl', () => {
  it('builds the public short link', () => {
    expect(invoicePublicUrl(' abc123 ')).toBe('https://myservicelink.app/b/abc123');
  });

  it('returns an empty string when there is no short code', () => {
    expect(invoicePublicUrl('')).toBe('');
    expect(invoicePublicUrl(null)).toBe('');
  });
});
