import {
  TAP_TO_PAY_IOS_UPDATE_REQUIRED,
  TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS,
} from '../constants/tapToPayCopy';
import { mapTapToPayTerminalErrorMessage } from '../terminal/tapToPayTerminalConnect';
import {
  isTapToPayOsVersionTerminalError,
  mapTapToPayOsVersionTerminalError,
} from '../utils/tapToPayOsVersionError';

describe('tapToPayOsVersionError', () => {
  it('detects Stripe unsupported mobile device configuration by code', () => {
    expect(isTapToPayOsVersionTerminalError('UNSUPPORTED_MOBILE_DEVICE_CONFIGURATION', null)).toBe(
      true,
    );
    expect(isTapToPayOsVersionTerminalError('2910', null)).toBe(true);
  });

  it('detects OS version errors from SDK message text', () => {
    expect(
      isTapToPayOsVersionTerminalError(null, 'OS version not supported for this reader.'),
    ).toBe(true);
    expect(
      isTapToPayOsVersionTerminalError(
        'READER_ERROR.OS_VERSION_NOT_SUPPORTED',
        'PaymentCardReaderError.osVersionNotSupported',
      ),
    ).toBe(true);
  });

  it('returns the iOS update message for os version errors', () => {
    expect(mapTapToPayOsVersionTerminalError('2910', null)).toBe(TAP_TO_PAY_IOS_UPDATE_REQUIRED);
    expect(mapTapToPayOsVersionTerminalError('OTHER', 'random failure')).toBeNull();
  });
});

describe('mapTapToPayTerminalErrorMessage', () => {
  it('maps os version not supported to the iOS update copy', () => {
    expect(
      mapTapToPayTerminalErrorMessage(
        'UNSUPPORTED_MOBILE_DEVICE_CONFIGURATION',
        'OS version not supported',
      ),
    ).toBe(TAP_TO_PAY_IOS_UPDATE_REQUIRED);
  });

  it('still maps entitlement failures separately', () => {
    expect(mapTapToPayTerminalErrorMessage('UNSUPPORTED_OPERATION', 'missing entitlement')).toBe(
      'This app build is missing Tap to Pay on iPhone. Install a new development build with the Tap to Pay entitlement enabled.',
    );
  });

  it('maps user cancel and Apple link dismiss errors to friendly copy', () => {
    expect(mapTapToPayTerminalErrorMessage('CANCELED', 'The command was canceled.')).toBe(
      'Payment was canceled.',
    );
    expect(
      mapTapToPayTerminalErrorMessage(
        'READER_SOFTWARE_UPDATE_FAILED',
        'Failed to link merchant account to the provided Apple ID. Ensure the Apple ID is still active and in good standing and try again.',
      ),
    ).toBe("Tap to Pay setup wasn't finished.");
  });
});

describe('TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS', () => {
  it('is a short label for the sheet status line', () => {
    expect(TAP_TO_PAY_IOS_UPDATE_REQUIRED_STATUS).toBe('Update iOS required');
  });
});
