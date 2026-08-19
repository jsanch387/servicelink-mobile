import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { SUBSCRIPTION_CANCEL_BUTTON } from '../constants';

/**
 * Quiet secondary cancel — same family as Account “Log out”: present, not alarming.
 *
 * @param {object} props
 * @param {boolean} props.canCancel
 * @param {boolean} [props.cancelLoading]
 * @param {() => void} props.onCancel
 * @param {string | null} [props.cancelNote]
 */
export function SubscriptionDetailActions({
  canCancel,
  cancelLoading = false,
  onCancel,
  cancelNote = null,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cancelBlock: {
          gap: 8,
          paddingTop: 4,
        },
        note: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 18,
          paddingHorizontal: 2,
        },
      }),
    [colors],
  );

  if (!canCancel) return null;

  return (
    <View style={styles.cancelBlock}>
      <Button
        accessibilityHint="Opens a confirmation to cancel at period end or cancel now"
        accessibilityLabel={SUBSCRIPTION_CANCEL_BUTTON}
        disabled={cancelLoading}
        fullWidth
        iconName="ban-outline"
        loading={cancelLoading}
        title={SUBSCRIPTION_CANCEL_BUTTON}
        variant="secondary"
        onPress={onCancel}
      />
      {cancelNote ? <AppText style={styles.note}>{cancelNote}</AppText> : null}
    </View>
  );
}
