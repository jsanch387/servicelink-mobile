import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Booking link intro — short guided tour. Neutral backdrop (no blur) avoids color cast.
 */
export function BookingLinkWelcomeModal({ visible = false, onDismiss }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const dismiss = onDismiss ?? (() => {});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fill: {
          ...StyleSheet.absoluteFillObject,
        },
        /** Pure black + alpha — no hue from blur sampling. */
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.82)' : 'rgba(0, 0, 0, 0.48)',
        },
        centerLayer: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          paddingBottom: Math.max(insets.bottom, 16),
          paddingHorizontal: 22,
          paddingTop: Math.max(insets.top, 16),
        },
        card: {
          alignSelf: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 22,
          borderWidth: 1,
          maxWidth: 400,
          overflow: 'hidden',
          paddingHorizontal: 24,
          paddingTop: 26,
          paddingBottom: 22,
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 24 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 36,
          elevation: 16,
        },
        accentBar: {
          alignSelf: 'flex-start',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 3,
          height: 3,
          marginBottom: 18,
          width: 44,
        },
        iconBadge: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          height: 48,
          justifyContent: 'center',
          marginBottom: 22,
          width: 48,
        },
        kicker: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 10,
        },
        title: {
          color: colors.text,
          fontSize: 24,
          fontWeight: '800',
          letterSpacing: -0.6,
          lineHeight: 30,
          marginBottom: 18,
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 24,
          marginBottom: 16,
        },
        tipBox: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderLeftColor: colors.buttonPrimaryBg,
          borderLeftWidth: 3,
          borderRadius: 14,
          borderWidth: 1,
          marginBottom: 16,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        highlight: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 21,
        },
        rule: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginBottom: 14,
          opacity: isDark ? 0.55 : 0.85,
        },
        footnote: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 17,
          marginBottom: 22,
          opacity: 0.88,
        },
      }),
    [colors, isDark, insets.bottom, insets.top],
  );

  return (
    <Modal
      animationType="fade"
      statusBarTranslucent
      transparent
      visible={visible}
      onRequestClose={dismiss}
    >
      <View style={styles.fill}>
        <Pressable
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          style={styles.fill}
          onPress={dismiss}
        >
          <View style={styles.backdrop} />
        </Pressable>

        <View pointerEvents="box-none" style={styles.centerLayer}>
          <View style={styles.card}>
            <View style={styles.accentBar} />
            <View style={styles.iconBadge}>
              <Ionicons color={colors.text} name="link-outline" size={24} />
            </View>
            <AppText style={styles.kicker}>Your public page</AppText>
            <AppText style={styles.title}>This is your booking link</AppText>
            <AppText style={styles.body}>
              When someone uses your link, they land here to learn about you and book a time.
            </AppText>
            <View style={styles.tipBox}>
              <AppText style={styles.highlight}>
                A cover photo, your services, and a short intro help them feel ready to book.
              </AppText>
            </View>
            <View style={styles.rule} />
            <AppText style={styles.footnote}>
              Tap Edit any time to change what shows on this page.
            </AppText>
            <Button fullWidth title="Got it" variant="primary" onPress={dismiss} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
