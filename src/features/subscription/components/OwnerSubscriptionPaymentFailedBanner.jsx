import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  OWNER_PAYMENT_FAILED_NOTICE_BODY,
  OWNER_PAYMENT_FAILED_NOTICE_DISMISS_LABEL,
  OWNER_PAYMENT_FAILED_NOTICE_TITLE,
} from '../constants/ownerPaymentFailedCopy';

/**
 * Home heads-up: billed Pro payment failed. Dismissible; no in-app checkout.
 *
 * @param {{ onDismiss: () => void }} props
 */
export function OwnerSubscriptionPaymentFailedBanner({ onDismiss }) {
  const { colors, isDark } = useTheme();
  const iconColor = isDark ? '#FBBF24' : '#B45309';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignSelf: 'stretch',
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.10)',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.38)' : 'rgba(217, 119, 6, 0.28)',
          overflow: 'hidden',
          padding: 0,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 10,
          width: '100%',
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.72)',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.32)' : 'rgba(217, 119, 6, 0.18)',
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          height: 34,
          justifyContent: 'center',
          width: 34,
        },
        copy: {
          flex: 1,
          gap: 2,
          minWidth: 0,
          paddingHorizontal: 10,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.12,
          lineHeight: 17,
        },
        body: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          lineHeight: 15,
        },
        dismissCol: {
          alignItems: 'center',
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
        dismissPressed: {
          opacity: 0.55,
        },
      }),
    [colors, isDark],
  );

  return (
    <SurfaceCard
      accessibilityRole="alert"
      outlined
      padding="none"
      style={styles.card}
      testID="owner-subscription-payment-failed-notice"
    >
      <View style={styles.row}>
        <View style={styles.iconBadge}>
          <Ionicons color={iconColor} name="card-outline" size={18} />
        </View>
        <View style={styles.copy}>
          <AppText includeFontPadding={false} style={styles.title}>
            {OWNER_PAYMENT_FAILED_NOTICE_TITLE}
          </AppText>
          <AppText includeFontPadding={false} style={styles.body}>
            {OWNER_PAYMENT_FAILED_NOTICE_BODY}
          </AppText>
        </View>
        <Pressable
          accessibilityHint="Hides this notice"
          accessibilityLabel={OWNER_PAYMENT_FAILED_NOTICE_DISMISS_LABEL}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onDismiss}
        >
          {({ pressed }) => (
            <View style={[styles.dismissCol, pressed && styles.dismissPressed]}>
              <Ionicons color={colors.textMuted} name="close" size={18} />
            </View>
          )}
        </Pressable>
      </View>
    </SurfaceCard>
  );
}
