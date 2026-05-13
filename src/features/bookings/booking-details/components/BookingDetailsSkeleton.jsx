import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

function SectionSkeleton({ first = false, titleWidth = '24%', rows = 3, withButton = false }) {
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
      <SectionSkeleton first rows={4} titleWidth="22%" />
      <SectionSkeleton rows={3} titleWidth="20%" />
      <SectionSkeleton rows={4} titleWidth="30%" />
      <SectionSkeleton rows={1} titleWidth="20%" withButton />
      <SectionSkeleton rows={1} titleWidth="18%" />
      <SectionSkeleton rows={2} titleWidth="28%" />
      <SkeletonBox borderRadius={6} height={15} pulse style={{ marginTop: 22 }} width={72} />
      <View style={{ columnGap: 10, flexDirection: 'row', marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <SkeletonBox borderRadius={16} height={82} pulse width="100%" />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonBox borderRadius={16} height={82} pulse width="100%" />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonBox borderRadius={16} height={82} pulse width="100%" />
        </View>
      </View>
    </>
  );
}
