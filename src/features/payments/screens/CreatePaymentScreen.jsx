import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  HeaderTextButton,
  androidBalancedHeaderLeft,
  androidHeaderTitleBalanceRight,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { CreatePaymentConnectSetup } from '../create-payment/components/CreatePaymentConnectSetup';
import { CreatePaymentFlow } from '../create-payment/CreatePaymentFlow';
import { useCreatePaymentAccess } from '../create-payment/hooks/useCreatePaymentAccess';
import { useTapToPayConnectReadiness } from '../../tap-to-pay/hooks/useTapToPayConnectReadiness';
import { navigateToPaymentsSetup } from '../../tap-to-pay/utils/navigateToPaymentsSetup';

const DEFAULT_LEADING = {
  label: 'Cancel',
  accessibilityLabel: 'Cancel new payment',
};

/**
 * Entry point for creating a payment from the home FAB.
 * Leading header action is Cancel on the chooser, Back on inner steps.
 */
export function CreatePaymentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const access = useCreatePaymentAccess();
  const { isConnectReady, isLoading: isConnectLoading } = useTapToPayConnectReadiness();
  const [leading, setLeading] = useState(DEFAULT_LEADING);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        loading: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
        },
      }),
    [colors],
  );

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSetupPayments = useCallback(() => {
    navigateToPaymentsSetup(navigation);
  }, [navigation]);

  const handleLeadingChange = useCallback((next) => {
    setLeading({
      label: next.label,
      accessibilityLabel: next.accessibilityLabel,
      onPress: next.onPress,
    });
  }, []);

  useEffect(() => {
    if (access.isReady && !access.featureEnabled) {
      navigation.goBack();
      return;
    }
    if (access.isReady && access.featureEnabled && access.showUpsell) {
      navigateToPaymentsSetup(navigation);
    }
  }, [access.featureEnabled, access.isReady, access.showUpsell, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: androidBalancedHeaderLeft(() => (
        <HeaderTextButton
          accessibilityLabel={leading.accessibilityLabel}
          label={leading.label}
          onPress={() => (leading.onPress ? leading.onPress() : navigation.goBack())}
        />
      )),
      headerRight: androidHeaderTitleBalanceRight(),
    });

    return () => {
      navigation.setOptions({ headerShown: true, headerLeft: undefined, headerRight: undefined });
    };
  }, [leading, navigation]);

  const showLoading = !access.isReady || isConnectLoading || access.showUpsell;
  const showConnectSetup =
    access.isReady &&
    access.featureEnabled &&
    !access.showUpsell &&
    !isConnectLoading &&
    !isConnectReady;
  const showFlow =
    access.isReady &&
    access.featureEnabled &&
    !access.showUpsell &&
    !isConnectLoading &&
    isConnectReady;

  return (
    <View style={styles.root} testID="create-payment-screen">
      {showLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Loading payment options" color={colors.accent} />
        </View>
      ) : null}
      {showConnectSetup ? <CreatePaymentConnectSetup onSetupPress={handleSetupPayments} /> : null}
      {showFlow ? (
        <CreatePaymentFlow onClose={handleClose} onHeaderLeadingChange={handleLeadingChange} />
      ) : null}
    </View>
  );
}
