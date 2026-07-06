import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  TAP_TO_PAY_NOT_SET_UP_HINT,
  TAP_TO_PAY_NOT_SET_UP_TITLE,
  TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL,
  TAP_TO_PAY_SETUP_DISMISS_LABEL,
} from '../constants/tapToPayConnectCopy';

/**
 * Shown from Complete when Tap to Pay is tapped but Stripe / Terminal is not ready.
 */
export function TapToPaySetupRequiredSheet({ visible, onRequestClose, onSetupPress }) {
  const { colors } = useTheme();
  const dismiss = onRequestClose ?? (() => {});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        footer: {
          gap: 10,
          marginTop: 20,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <Button
            fullWidth
            title={TAP_TO_PAY_SETUP_PAYMENTS_CTA_LABEL}
            variant="primary"
            onPress={() => {
              onSetupPress?.();
            }}
          />
          <Button
            fullWidth
            title={TAP_TO_PAY_SETUP_DISMISS_LABEL}
            variant="secondary"
            onPress={dismiss}
          />
        </View>
      }
      sheetHeightPercent={40}
      title={TAP_TO_PAY_NOT_SET_UP_TITLE}
      visible={visible}
      onRequestClose={dismiss}
    >
      <AppText style={styles.body}>{TAP_TO_PAY_NOT_SET_UP_HINT}</AppText>
    </BottomSheetModal>
  );
}
