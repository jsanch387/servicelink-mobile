import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Compact coach sheet for swipe-to-remove on multi-job Review.
 *
 * @param {{
 *   visible: boolean;
 *   onDismiss: () => void;
 * }} props
 */
export function SwipeToRemoveJobTip({ visible, onDismiss }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          alignItems: 'center',
          gap: 14,
          paddingBottom: 12,
          paddingTop: 8,
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(248,113,113,0.14)' : 'rgba(220,38,38,0.1)',
          borderRadius: 18,
          height: 64,
          justifyContent: 'center',
          width: 64,
        },
        copy: {
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 8,
        },
        title: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
          textAlign: 'center',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          textAlign: 'center',
        },
        footer: {
          marginTop: 20,
        },
      }),
    [colors, isDark],
  );

  return (
    <BottomSheetModal
      allowBackdropClose
      fitContent
      footer={
        <View style={styles.footer}>
          <Button fullWidth title="Got it" variant="primary" onPress={onDismiss} />
        </View>
      }
      title="Remove a job"
      visible={visible}
      onRequestClose={onDismiss}
    >
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.danger} name="arrow-back-outline" size={28} />
        </View>
        <View style={styles.copy}>
          <AppText style={styles.title}>Swipe left to remove</AppText>
          <AppText style={styles.subtitle}>
            In the summary, slide a job card left to remove it.
          </AppText>
        </View>
      </View>
    </BottomSheetModal>
  );
}
