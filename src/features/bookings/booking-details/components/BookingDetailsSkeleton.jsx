import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

function SectionSkeleton({ first = false, titleWidth = '24%', rows = 3 }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: first ? 0 : 22,
          rowGap: 8,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
      }),
    [first],
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
            width={idx % 2 === 0 ? '68%' : '52%'}
          />
        ))}
      </SurfaceCard>
    </View>
  );
}

export function BookingDetailsSkeleton() {
  return (
    <>
      <SectionSkeleton first rows={3} titleWidth="22%" />
      <SectionSkeleton rows={3} titleWidth="14%" />
      <SectionSkeleton rows={1} titleWidth="24%" />
      <SectionSkeleton rows={1} titleWidth="20%" />
    </>
  );
}
