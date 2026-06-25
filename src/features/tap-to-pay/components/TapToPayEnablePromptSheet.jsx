import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  TAP_TO_PAY_ENABLE_PROMPT_BODY,
  TAP_TO_PAY_ENABLE_PROMPT_CTA,
  TAP_TO_PAY_ENABLE_PROMPT_DISMISS,
  TAP_TO_PAY_ENABLE_PROMPT_TITLE,
} from '../constants/tapToPayEnableCopy';

/**
 * Shown once after Stripe Connect succeeds — nudges explicit Tap to Pay enable on Payments.
 */
export function TapToPayEnablePromptSheet({
  visible,
  enabling = false,
  onEnablePress,
  onRequestClose,
}) {
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
            loading={enabling}
            title={TAP_TO_PAY_ENABLE_PROMPT_CTA}
            variant="primary"
            onPress={() => {
              onEnablePress?.();
            }}
          />
          <Button
            fullWidth
            disabled={enabling}
            title={TAP_TO_PAY_ENABLE_PROMPT_DISMISS}
            variant="secondary"
            onPress={dismiss}
          />
        </View>
      }
      sheetHeightPercent={38}
      title={TAP_TO_PAY_ENABLE_PROMPT_TITLE}
      visible={visible}
      onRequestClose={dismiss}
    >
      <AppText style={styles.body}>{TAP_TO_PAY_ENABLE_PROMPT_BODY}</AppText>
    </BottomSheetModal>
  );
}
