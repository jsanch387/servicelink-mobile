import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { isTapToPayPlatformSupported } from '../../tap-to-pay/constants/tapToPayFeatureFlags';
import { TapToPayEnablePromptSheet } from '../../tap-to-pay/components/TapToPayEnablePromptSheet';
import { useTapToPayEnablement } from '../../tap-to-pay/hooks/useTapToPayEnablement';
import { logTapToPayDebug } from '../../tap-to-pay/utils/logTapToPayDebug';
import { PaymentTapToPayCard } from './PaymentTapToPayCard';

/**
 * Tap to Pay on Payments — explicit enable, optional post–Stripe prompt, how-it-works.
 *
 * @param {{ enablePromptSignal?: number }} props — increment after Stripe Connect succeeds
 */
export function PaymentsTapToPaySection({ enablePromptSignal = 0 }) {
  const { canEnable, checking, enable, isEnabled, isEnabling, needsReconnect, refresh } =
    useTapToPayEnablement();
  const [promptVisible, setPromptVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      logTapToPayDebug('enablement.payments.focus');
      void refresh('payments_focus');
    }, [refresh]),
  );

  useEffect(() => {
    const showEnableCta = canEnable && !checking && !isEnabled;
    const showEnabledPill = isEnabled && !checking;
    logTapToPayDebug('enablement.payments.card', {
      canEnable,
      checking,
      isEnabled,
      needsReconnect,
      isEnabling,
      showEnableCta,
      showEnabledPill,
      uiNote:
        !showEnableCta && !showEnabledPill
          ? 'dead_zone: setup subtext + how it works only'
          : undefined,
    });
  }, [canEnable, checking, isEnabled, isEnabling, needsReconnect]);

  useEffect(() => {
    if (enablePromptSignal <= 0 || checking || isEnabled) {
      return;
    }
    setPromptVisible(true);
  }, [enablePromptSignal, checking, isEnabled]);

  if (!isTapToPayPlatformSupported()) {
    return null;
  }

  const handleEnable = () => {
    void (async () => {
      const ok = await enable();
      if (ok) {
        setPromptVisible(false);
      }
    })();
  };

  return (
    <>
      <PaymentTapToPayCard
        canEnable={canEnable}
        checking={checking}
        isEnabled={isEnabled}
        isEnabling={isEnabling}
        onEnablePress={handleEnable}
      />
      <TapToPayEnablePromptSheet
        enabling={isEnabling}
        visible={promptVisible}
        onEnablePress={handleEnable}
        onRequestClose={() => setPromptVisible(false)}
      />
    </>
  );
}
