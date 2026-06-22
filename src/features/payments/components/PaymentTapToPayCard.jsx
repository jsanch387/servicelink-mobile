import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { TapToPayHowItWorksSheet } from '../../tap-to-pay/components/TapToPayHowItWorksSheet';
import {
  TAP_TO_PAY_HOW_IT_WORKS_LABEL,
  TAP_TO_PAY_PAYMENTS_CARD_BODY,
  TAP_TO_PAY_PAYMENTS_CARD_TITLE,
} from '../../tap-to-pay/constants/tapToPayHowItWorksCopy';
import { paymentLayoutStyles, paymentTextStyles } from '../constants/paymentTypography';

/**
 * Tap to Pay entry on Payments — opens the in-app ServiceLink checkout explainer.
 */
export function PaymentTapToPayCard() {
  const { colors } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <SurfaceCard style={styles.card} testID="payments-tap-to-pay-card">
        <View style={paymentLayoutStyles.headerTextGroup}>
          <AppText style={[paymentTextStyles.sectionTitle, { color: colors.text }]}>
            {TAP_TO_PAY_PAYMENTS_CARD_TITLE}
          </AppText>
          <AppText style={[paymentTextStyles.sectionBody, { color: colors.textMuted }]}>
            {TAP_TO_PAY_PAYMENTS_CARD_BODY}
          </AppText>
        </View>
        <Button
          fullWidth
          title={TAP_TO_PAY_HOW_IT_WORKS_LABEL}
          variant="secondary"
          onPress={() => setSheetVisible(true)}
        />
      </SurfaceCard>
      <TapToPayHowItWorksSheet
        visible={sheetVisible}
        onRequestClose={() => setSheetVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
});
