import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

function SectionSkeleton({ first = false, titleWidth = '24%', rows = 2, withButton = false }) {
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
            height={48}
            pulse
            style={{ marginTop: 14 }}
            width="100%"
          />
        ) : null}
      </SurfaceCard>
    </View>
  );
}

function ServiceSectionSkeleton() {
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
        headerRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
        },
        titleBlock: {
          flex: 1,
          minWidth: 0,
        },
      }),
    [],
  );

  return (
    <View style={styles.wrap}>
      <SkeletonBox borderRadius={6} height={15} pulse width="22%" />
      <SurfaceCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <SkeletonBox
              backgroundColor={colors.textMuted}
              borderRadius={8}
              height={22}
              pulse
              width="72%"
            />
          </View>
          <SkeletonBox
            backgroundColor={colors.textMuted}
            borderRadius={999}
            height={22}
            pulse
            width={72}
          />
        </View>
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={8}
          height={32}
          pulse
          style={{ marginTop: 10 }}
          width="38%"
        />
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={8}
          height={16}
          pulse
          style={{ marginTop: 14 }}
          width="48%"
        />
      </SurfaceCard>
    </View>
  );
}

export function MaintenanceDetailSkeleton() {
  return (
    <>
      <ServiceSectionSkeleton />
      <SectionSkeleton rows={2} titleWidth="32%" />
      <SectionSkeleton rows={2} titleWidth="22%" />
      <SectionSkeleton rows={2} titleWidth="22%" />
      <SectionSkeleton rows={1} titleWidth="14%" withButton />
    </>
  );
}
