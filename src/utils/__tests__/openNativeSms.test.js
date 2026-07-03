import { Platform } from 'react-native';

import { buildSmsDeepLink } from '../openNativeSms';

describe('buildSmsDeepLink', () => {
  const platform = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: platform });
  });

  it('builds iOS sms link with recipient and body', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    expect(
      buildSmsDeepLink({
        address: '+12125551234',
        body: "Hey, I'm heading your way.",
      }),
    ).toBe("sms:+12125551234&body=Hey%2C%20I'm%20heading%20your%20way.");
  });

  it('builds Android smsto link with recipient and body', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    expect(
      buildSmsDeepLink({
        address: '+12125551234',
        body: "Hey, I'm heading your way.",
      }),
    ).toBe("smsto:+12125551234?body=Hey%2C%20I'm%20heading%20your%20way.");
  });

  it('builds compose-only link when no recipient', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    expect(buildSmsDeepLink({ body: 'On my way' })).toBe('sms:?body=On%20my%20way');
  });
});
