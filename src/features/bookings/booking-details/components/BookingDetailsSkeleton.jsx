import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

function SectionSkeleton({ titleWidth = '24%', rows = 2 }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          rowGap: 8,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
      }),
    [],
  );

  return (
    <View style={styles.wrap}>
      <SkeletonBox borderRadius={6} height={15} pulse width={titleWidth} />
      <SurfaceCard style={styles.card}>
        {Array.from({ length: rows }).map((_, idx) => (
          <SkeletonBox
            backgroundColor={colors.textMuted}
            borderRadius={8}
            height={16}
            key={`row-${idx}`}
            pulse
            style={{ marginTop: idx === 0 ? 0 : 12 }}
            width={idx % 2 === 0 ? '68%' : '40%'}
          />
        ))}
      </SurfaceCard>
    </View>
  );
}

export function BookingDetailsSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        hero: {
          rowGap: 8,
        },
        heroRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
          rowGap: 12,
        },
      }),
    [],
  );

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <SkeletonBox borderRadius={8} height={28} pulse width="52%" />
          <SkeletonBox borderRadius={999} height={26} pulse width={96} />
        </View>
        <SkeletonBox borderRadius={6} height={15} pulse width="46%" />
      </View>
      <SurfaceCard style={styles.card}>
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={8}
          height={18}
          pulse
          width="70%"
        />
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={8}
          height={14}
          pulse
          width="42%"
        />
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={8}
          height={14}
          pulse
          width="36%"
        />
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={8}
          height={18}
          pulse
          width="48%"
        />
      </SurfaceCard>
      <SectionSkeleton rows={2} titleWidth="22%" />
      <SectionSkeleton rows={2} titleWidth="24%" />
      <SectionSkeleton rows={3} titleWidth="20%" />
    </>
  );
}
