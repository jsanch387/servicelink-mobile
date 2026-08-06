import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, DeleteButton } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { SUBSCRIPTION_CANCEL_BUTTON } from '../constants';

/**
 * @param {object} props
 * @param {boolean} props.canCopyManageLink
 * @param {boolean} [props.linkCopied]
 * @param {() => void} props.onCopyManageLink
 * @param {boolean} props.canCancel
 * @param {boolean} [props.cancelLoading]
 * @param {() => void} props.onCancel
 * @param {string | null} [props.cancelNote]
 */
export function SubscriptionDetailActions({
  canCopyManageLink,
  linkCopied = false,
  onCopyManageLink,
  canCancel,
  cancelLoading = false,
  onCancel,
  cancelNote = null,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        column: {
          gap: 14,
        },
        note: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: -4,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.column}>
      {canCopyManageLink ? (
        <Button
          fullWidth
          title={linkCopied ? 'Manage link copied' : 'Copy customer manage link'}
          variant="secondary"
          onPress={onCopyManageLink}
        />
      ) : null}

      {canCancel ? (
        <>
          <DeleteButton
            disabled={cancelLoading}
            iconName="close-circle-outline"
            loading={cancelLoading}
            title={SUBSCRIPTION_CANCEL_BUTTON}
            onPress={onCancel}
          />
          {cancelNote ? <AppText style={styles.note}>{cancelNote}</AppText> : null}
        </>
      ) : null}
    </View>
  );
}
