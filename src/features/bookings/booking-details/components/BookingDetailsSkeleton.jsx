import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

function SectionSkeleton({ titleWidth = '24%', rows = 3, withButton = false }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          rowGap: 8,
        },
        card: {
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
      }),
    [],
  );

  return (
    <View style={styles.wrap}>
      <SkeletonBox borderRadius={8} height={16} pulse width={titleWidth} />
      <SurfaceCard style={styles.card}>
        {Array.from({ length: rows }).map((_, idx) => (
          <SkeletonBox
            backgroundColor={colors.textMuted}
            borderRadius={8}
            height={16}
            key={`row-${idx}`}
            pulse
            style={{ marginTop: idx === 0 ? 0 : 10 }}
            width={idx % 2 === 0 ? '68%' : '52%'}
          />
        ))}
        {withButton ? (
          <SkeletonBox
            backgroundColor={colors.textMuted}
            borderRadius={14}
            height={52}
            pulse
            style={{ marginTop: 14 }}
            width="100%"
          />
        ) : null}
      </SurfaceCard>
    </View>
  );
}

export function BookingDetailsSkeleton() {
  return (
    <>
      <SectionSkeleton rows={4} titleWidth="22%" />
      <SectionSkeleton rows={4} titleWidth="30%" />
      <SectionSkeleton rows={3} titleWidth="20%" />
      <SectionSkeleton rows={1} titleWidth="20%" withButton />
      <SectionSkeleton rows={1} titleWidth="18%" />
      <SectionSkeleton rows={2} titleWidth="28%" />
      <SkeletonBox borderRadius={14} height={52} pulse style={{ marginTop: 4 }} width="100%" />
      <SkeletonBox borderRadius={14} height={52} pulse style={{ marginTop: 10 }} width="100%" />
    </>
  );
}
