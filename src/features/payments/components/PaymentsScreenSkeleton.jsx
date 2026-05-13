import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Placeholder layout while business, subscription, or payment settings are loading.
 * @param {object} props
 * @param {string} [props.accessibilityLabel]
 */
export function PaymentsScreenSkeleton({ accessibilityLabel = 'Loading' }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16) + 24;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          gap: 16,
          paddingBottom: bottomPad,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        card: {
          alignSelf: 'stretch',
        },
        toggleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
        },
        toggleTextCol: {
          flex: 1,
          minWidth: 0,
        },
        radioBlock: {
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: 14,
        },
      }),
    [bottomPad, colors.shell],
  );

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessible
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SurfaceCard style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <SkeletonBox borderRadius={8} height={18} pulse width="72%" />
              <SkeletonBox
                borderRadius={8}
                height={14}
                pulse
                style={{ marginTop: 10 }}
                width="88%"
              />
            </View>
            <SkeletonBox borderRadius={16} height={32} pulse width={52} />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <SkeletonBox borderRadius={8} height={18} pulse width="52%" />
          <SkeletonBox borderRadius={12} height={44} pulse style={{ marginTop: 16 }} width="100%" />
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <SkeletonBox borderRadius={8} height={18} pulse width="44%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 14 }} width="100%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="92%" />
          <View style={styles.radioBlock}>
            <SkeletonBox borderRadius={999} height={22} pulse width={22} />
            <SkeletonBox borderRadius={8} height={16} pulse style={{ flex: 1, marginLeft: 12 }} />
          </View>
          <View style={styles.radioBlock}>
            <SkeletonBox borderRadius={999} height={22} pulse width={22} />
            <SkeletonBox borderRadius={8} height={16} pulse style={{ flex: 1, marginLeft: 12 }} />
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <SkeletonBox borderRadius={8} height={18} pulse width="38%" />
          <SkeletonBox borderRadius={999} height={28} pulse style={{ marginTop: 14 }} width={56} />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 16 }} width="100%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="78%" />
          <SkeletonBox borderRadius={12} height={48} pulse style={{ marginTop: 18 }} width="100%" />
        </SurfaceCard>
      </ScrollView>
    </View>
  );
}
