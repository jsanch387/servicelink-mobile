import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DetailsSectionCard, SkeletonBox } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Placeholder while the complete-visit payment model loads.
 *
 * @param {{ bottomInset?: number }} props
 */
export function CompleteVisitPaymentSkeleton({ bottomInset = 0 }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        scrollContent: {
          gap: 16,
          paddingBottom: 24,
          paddingHorizontal: 16,
          paddingTop: 24,
        },
        hero: {
          alignItems: 'center',
          gap: 8,
          paddingBottom: 8,
          paddingTop: 12,
        },
        breakdownRows: {
          gap: 12,
        },
        breakdownRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        footer: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 12,
        },
      }),
    [colors.border],
  );

  return (
    <View accessibilityLabel="Loading payment" accessibilityRole="progressbar" style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <SkeletonBox borderRadius={8} height={16} pulse width={96} />
          <SkeletonBox borderRadius={10} height={48} pulse width={180} />
        </View>

        <DetailsSectionCard bodyPadding="roomy">
          <View style={styles.breakdownRows}>
            {['72%', '58%', '64%'].map((width) => (
              <View key={width} style={styles.breakdownRow}>
                <SkeletonBox borderRadius={8} height={16} pulse width={width} />
                <SkeletonBox borderRadius={8} height={16} pulse width={56} />
              </View>
            ))}
          </View>
        </DetailsSectionCard>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, 12) }]}>
        <SkeletonBox borderRadius={14} height={52} pulse width="100%" />
        <SkeletonBox borderRadius={14} height={52} pulse width="100%" />
      </View>
    </View>
  );
}
