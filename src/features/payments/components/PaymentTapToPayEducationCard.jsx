import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  getTapToPayEducationUnavailableMessage,
  isTapToPayEducationAvailable,
  presentTapToPayEducation,
} from '../../tap-to-pay/native/presentTapToPayEducation';
import { paymentLayoutStyles, paymentTextStyles } from '../constants/paymentTypography';

/**
 * Opens Apple's Tap to Pay merchant education ("How to Tap") from Payments settings.
 */
export function PaymentTapToPayEducationCard() {
  const { colors } = useTheme();
  const [opening, setOpening] = useState(false);

  const openEducation = useCallback(async () => {
    if (!isTapToPayEducationAvailable()) {
      Alert.alert('Tap to Pay education', getTapToPayEducationUnavailableMessage());
      return;
    }

    setOpening(true);
    try {
      await presentTapToPayEducation({ markSeen: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open Tap to Pay education.';
      Alert.alert('Tap to Pay education', message);
    } finally {
      setOpening(false);
    }
  }, []);

  return (
    <SurfaceCard style={styles.card} testID="payments-tap-to-pay-education-card">
      <View style={paymentLayoutStyles.headerTextGroup}>
        <AppText style={[paymentTextStyles.sectionTitle, { color: colors.text }]}>
          Tap to Pay
        </AppText>
        <AppText style={[paymentTextStyles.sectionBody, { color: colors.textMuted }]}>
          Accept contactless payments on your iPhone.
        </AppText>
      </View>
      <Button
        disabled={opening}
        fullWidth
        iconLibrary="material-community"
        iconName="contactless-payment"
        iconPosition="left"
        loading={opening}
        title="Tap to Pay"
        variant="surfaceDark"
        onPress={() => {
          void openEducation();
        }}
      />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
});
