import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  HeaderTextButton,
  androidBalancedHeaderLeft,
  androidHeaderTitleBalanceRight,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { navigateNestedTabScreen } from '../../../navigation/navigateNestedTabScreen';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { PaymentsNonProUpsell } from '../components/PaymentsNonProUpsell';
import { PAYMENTS_SCREEN_TAB } from '../constants/paymentsScreenTabs';
import { CreatePaymentConnectSetup } from '../create-payment/components/CreatePaymentConnectSetup';
import { CreatePaymentFlow } from '../create-payment/CreatePaymentFlow';
import { CREATE_PAYMENT_PAGE_PAD_TOP } from '../create-payment/constants';
import { useCreatePaymentAccess } from '../create-payment/hooks/useCreatePaymentAccess';
import { useTapToPayConnectReadiness } from '../../tap-to-pay/hooks/useTapToPayConnectReadiness';

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
        gate: {
          flexGrow: 1,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: CREATE_PAYMENT_PAGE_PAD_TOP,
        },
      }),
    [colors],
  );

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSetupPayments = useCallback(() => {
    navigateNestedTabScreen(navigation, {
      tab: ROUTES.MORE,
      screen: ROUTES.MORE_PAYMENTS,
      params: { initialTab: PAYMENTS_SCREEN_TAB.SETTINGS },
    });
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
    }
  }, [access.featureEnabled, access.isReady, navigation]);

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

  const showLoading = !access.isReady || isConnectLoading;
  const showUpsell = access.isReady && access.featureEnabled && access.showUpsell;
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
      {showUpsell ? (
        <ScrollView contentContainerStyle={styles.gate} testID="create-payment-pro-upsell">
          <PaymentsNonProUpsell />
        </ScrollView>
      ) : null}
      {showConnectSetup ? <CreatePaymentConnectSetup onSetupPress={handleSetupPayments} /> : null}
      {showFlow ? (
        <CreatePaymentFlow onClose={handleClose} onHeaderLeadingChange={handleLeadingChange} />
      ) : null}
    </View>
  );
}
