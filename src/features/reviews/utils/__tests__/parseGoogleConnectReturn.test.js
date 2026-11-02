import { parseGoogleConnectReturn } from '../parseGoogleConnectReturn';

describe('parseGoogleConnectReturn', () => {
  it('reads a successful return', () => {
    expect(parseGoogleConnectReturn('servicelinkmobile://reviews/google?google=connected')).toBe(
      'connected',
    );
  });

  it('reads a failed return', () => {
    expect(parseGoogleConnectReturn('servicelinkmobile://reviews/google?google=error')).toBe(
      'error',
    );
  });

  it('ignores other links', () => {
    expect(parseGoogleConnectReturn('servicelinkmobile://payments/connect?connect=return')).toBe(
      null,
    );
    expect(parseGoogleConnectReturn('')).toBeNull();
  });
});
