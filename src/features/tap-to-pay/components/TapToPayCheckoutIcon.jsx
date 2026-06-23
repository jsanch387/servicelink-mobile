import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { requireNativeViewManager } from 'expo-modules-core';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';

/** Apple Tap to Pay checkout symbol (iOS 15+). */
const TAP_TO_PAY_SF_SYMBOL = 'wave.3.right.circle.fill';

let symbolModuleLinked = null;

function isTapToPaySymbolModuleLinked() {
  if (Platform.OS !== 'ios') {
    return false;
  }
  if (symbolModuleLinked !== null) {
    return symbolModuleLinked;
  }
  try {
    requireNativeViewManager('SymbolModule');
    symbolModuleLinked = true;
  } catch {
    symbolModuleLinked = false;
  }
  return symbolModuleLinked;
}

function ContactlessPaymentIcon({ color, size }) {
  return <MaterialCommunityIcons color={color} name="contactless-payment" size={size} />;
}

/**
 * Apple HIG checkout icon (`wave.3.right.circle.fill`) when the native SF Symbol module
 * is in the build; contactless waves fallback otherwise (e.g. before rebuild).
 */
export function TapToPayCheckoutIcon({ color, size = 22 }) {
  const fallback = <ContactlessPaymentIcon color={color} size={size} />;

  if (!isTapToPaySymbolModuleLinked()) {
    return fallback;
  }

  return (
    <SymbolView
      fallback={fallback}
      name={TAP_TO_PAY_SF_SYMBOL}
      resizeMode="scaleAspectFit"
      scale="medium"
      size={size}
      style={{ height: size, width: size }}
      tintColor={color}
      weight="semibold"
    />
  );
}

export { isTapToPaySymbolModuleLinked, TAP_TO_PAY_SF_SYMBOL };
