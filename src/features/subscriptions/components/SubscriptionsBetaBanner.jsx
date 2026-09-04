import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  SUBSCRIPTIONS_BETA_BANNER_A11Y_HINT,
  SUBSCRIPTIONS_BETA_BANNER_A11Y_LABEL,
  SUBSCRIPTIONS_BETA_BANNER_BODY,
  SUBSCRIPTIONS_BETA_BANNER_TITLE,
} from '../constants/setupCopy';

/**
 * Compact hub banner: subscriptions is in beta; tap opens Contact us.
 *
 * @param {{ onPress: () => void }} props
 */
export function SubscriptionsBetaBanner({ onPress }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignSelf: 'stretch',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          marginBottom: 14,
          overflow: 'hidden',
          padding: 0,
        },
        pressable: {
          alignSelf: 'stretch',
          overflow: 'hidden',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 10,
          width: '100%',
        },
        rowPressed: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)',
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)',
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
        chevronCol: {
          alignItems: 'center',
          height: 20,
          justifyContent: 'center',
          width: 20,
        },
      }),
    [colors, isDark],
  );

  return (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <Pressable
        accessibilityHint={SUBSCRIPTIONS_BETA_BANNER_A11Y_HINT}
        accessibilityLabel={SUBSCRIPTIONS_BETA_BANNER_A11Y_LABEL}
        accessibilityRole="button"
        onPress={onPress}
        style={styles.pressable}
      >
        {({ pressed }) => (
          <View style={[styles.row, pressed && styles.rowPressed]}>
            <View style={styles.iconBadge}>
              <Ionicons color={colors.text} name="flask-outline" size={18} />
            </View>
            <View style={styles.copy}>
              <AppText includeFontPadding={false} style={styles.title}>
                {SUBSCRIPTIONS_BETA_BANNER_TITLE}
              </AppText>
              <AppText includeFontPadding={false} style={styles.body}>
                {SUBSCRIPTIONS_BETA_BANNER_BODY}
              </AppText>
            </View>
            <View style={styles.chevronCol}>
              <Ionicons color={colors.textMuted} name="chevron-forward" size={16} />
            </View>
          </View>
        )}
      </Pressable>
    </SurfaceCard>
  );
}
