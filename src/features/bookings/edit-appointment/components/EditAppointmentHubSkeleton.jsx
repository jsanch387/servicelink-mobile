import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const ROW_COUNT = 6;
const ROW_PAD_H = 16;
const ICON_COL_W = 28;
const ICON_GAP = 12;
const DIVIDER_INSET = ROW_PAD_H + ICON_COL_W + ICON_GAP;

function HubRowSkeleton({ showDividerBelow, colors }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 64,
          paddingHorizontal: ROW_PAD_H,
          paddingVertical: 12,
        },
        icon: {
          marginRight: ICON_GAP,
        },
        textCol: {
          flex: 1,
          gap: 8,
          minWidth: 0,
        },
        chevron: {
          marginLeft: 8,
        },
        dividerRow: {
          flexDirection: 'row',
          paddingLeft: DIVIDER_INSET,
          paddingRight: ROW_PAD_H,
        },
        hairline: {
          backgroundColor: colors.border,
          flex: 1,
          height: StyleSheet.hairlineWidth,
          opacity: 0.55,
        },
      }),
    [colors.border],
  );

  return (
    <View>
      <View style={styles.row}>
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={6}
          height={22}
          pulse
          style={styles.icon}
          width={ICON_COL_W}
        />
        <View style={styles.textCol}>
          <SkeletonBox
            backgroundColor={colors.textMuted}
            borderRadius={6}
            height={14}
            pulse
            width="42%"
          />
          <SkeletonBox
            backgroundColor={colors.textMuted}
            borderRadius={6}
            height={12}
            pulse
            width="76%"
          />
        </View>
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={4}
          height={18}
          pulse
          style={styles.chevron}
          width={18}
        />
      </View>
      {showDividerBelow ? (
        <View style={styles.dividerRow}>
          <View style={styles.hairline} />
        </View>
      ) : null}
    </View>
  );
}

/** Loading placeholder matching the edit hub layout. */
export function EditAppointmentHubSkeleton() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          rowGap: 16,
        },
        header: {
          gap: 8,
          paddingBottom: 2,
        },
        card: {
          overflow: 'hidden',
        },
      }),
    [],
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={8}
          height={22}
          pulse
          width="78%"
        />
        <SkeletonBox
          backgroundColor={colors.textMuted}
          borderRadius={6}
          height={14}
          pulse
          width="52%"
        />
      </View>
      <SurfaceCard outlined padding="none" style={styles.card}>
        {Array.from({ length: ROW_COUNT }).map((_, index) => (
          <HubRowSkeleton
            colors={colors}
            key={`hub-skel-${index}`}
            showDividerBelow={index < ROW_COUNT - 1}
          />
        ))}
      </SurfaceCard>
    </View>
  );
}
