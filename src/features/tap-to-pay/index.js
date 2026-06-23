/** Tap to Pay on iPhone — Complete sheet overlay, Terminal SDK, and server intent APIs. */

export { StripeTerminalAppProvider } from './providers/StripeTerminalAppProvider';
export { TapToPaySheet } from './components/TapToPaySheet';

export { useTapToPayConnectReadiness } from './hooks/useTapToPayConnectReadiness';
export { navigateToPaymentsSetup } from './utils/navigateToPaymentsSetup';
export {
  TAP_TO_PAY_NOT_SET_UP_TITLE,
  TAP_TO_PAY_NOT_SET_UP_HINT,
  TAP_TO_PAY_GET_STARTED_LABEL,
  TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL,
  TAP_TO_PAY_SETUP_DISMISS_LABEL,
  TAP_TO_PAY_SETUP_ACCESSIBILITY_HINT,
  TAP_TO_PAY_COLLECT_ACCESSIBILITY_HINT,
} from './constants/tapToPayConnectCopy';

export { buildTapToPaySessionFees } from './utils/buildTapToPaySessionFees';
export {
  TAP_TO_PAY_USE_SERVER_APIS,
  TAP_TO_PAY_USE_TERMINAL_SDK,
  isTapToPayPlatformSupported,
  isTapToPayUiEnabled,
} from './constants/tapToPayFeatureFlags';
export { TAP_TO_PAY_RECEIPT_ROW_LABEL } from './constants/tapToPayCopy';
