import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { bookingLinkRequestQuoteOwnerHintCopy } from '../../constants/bookingLinkQuotePreviewCopy';

/**
 * Owner booking-link preview — explains why Request Quote does not open a customer flow.
 */
export function BookingLinkRequestQuoteOwnerHintSheet({ visible, onRequestClose }) {
  const { colors } = useTheme();
  const dismiss = onRequestClose ?? (() => {});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hintRow: {
          alignItems: 'flex-start',
          backgroundColor: colors.shell,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        hintText: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 15,
          lineHeight: 22,
          minWidth: 0,
        },
        footer: {
          marginTop: 20,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      footer={
        <View style={styles.footer}>
          <Button
            fullWidth
            title={bookingLinkRequestQuoteOwnerHintCopy.dismissLabel}
            variant="secondary"
            onPress={dismiss}
          />
        </View>
      }
      sheetHeightPercent={42}
      title={bookingLinkRequestQuoteOwnerHintCopy.title}
      visible={visible}
      onRequestClose={dismiss}
    >
      <View style={styles.hintRow}>
        <Ionicons color={colors.textMuted} name="information-circle-outline" size={22} />
        <AppText style={styles.hintText}>{bookingLinkRequestQuoteOwnerHintCopy.message}</AppText>
      </View>
    </BottomSheetModal>
  );
}
