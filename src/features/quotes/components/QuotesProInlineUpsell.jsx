import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText, ProCrownIcon, PRO_CROWN_COLOR_FEATURE } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * Single-line Pro upsell: trailing “Upgrade to Pro” (copy lives on the parent card subtitle).
 *
 * @param {{ onUpgradePress: () => void; loading?: boolean }} props
 */
export function QuotesProInlineUpsell({ onUpgradePress, loading = false }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          alignSelf: 'stretch',
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'flex-end',
          paddingBottom: 0,
          paddingTop: 10,
        },
        ctaCluster: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
        },
        cta: {
          color: colors.link,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
          lineHeight: 17,
          paddingVertical: 0,
        },
        ctaPressed: {
          opacity: 0.72,
        },
        ctaLoading: {
          opacity: 0.5,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading" color={colors.accent} size="small" />
      ) : null}
      <Pressable
        accessibilityHint="Opens Account settings"
        accessibilityLabel="Upgrade to Pro"
        accessibilityRole="button"
        disabled={loading}
        hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
        style={({ pressed }) => [pressed && !loading && styles.ctaPressed]}
        onPress={onUpgradePress}
      >
        <View style={styles.ctaCluster}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <ProCrownIcon color={PRO_CROWN_COLOR_FEATURE} size={15} />
          </View>
          <AppText includeFontPadding={false} style={[styles.cta, loading && styles.ctaLoading]}>
            Upgrade to Pro
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}
