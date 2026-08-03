import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function SentTextsListSkeleton() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          gap: 16,
          width: '100%',
        },
        sectionLabel: {
          marginBottom: 8,
        },
        card: {
          overflow: 'hidden',
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        copy: {
          flex: 1,
          gap: 6,
          minWidth: 0,
        },
        topRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 58,
          opacity: 0.55,
          width: '100%',
        },
      }),
    [colors.border],
  );

  return (
    <View accessibilityLabel="Loading sent texts" style={styles.root}>
      <View>
        <SkeletonBox borderRadius={6} height={14} pulse style={styles.sectionLabel} width="22%" />
        <SurfaceCard padding="none" style={styles.card}>
          {[0, 1].map((key) => (
            <View key={key}>
              <View style={styles.row}>
                <SkeletonBox borderRadius={16} height={32} pulse width={32} />
                <View style={styles.copy}>
                  <View style={styles.topRow}>
                    <SkeletonBox borderRadius={6} height={14} pulse width="42%" />
                    <SkeletonBox borderRadius={6} height={12} pulse width="12%" />
                  </View>
                  <SkeletonBox borderRadius={6} height={12} pulse width="58%" />
                  <SkeletonBox borderRadius={6} height={12} pulse width="88%" />
                </View>
              </View>
              {key === 0 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </SurfaceCard>
      </View>
    </View>
  );
}
