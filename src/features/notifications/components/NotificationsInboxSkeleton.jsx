import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';

const ICON = 44;
const GAP = 14;
const TEXT_INSET = ICON + GAP;

function SkeletonRow({ dividerColor, showDivider }) {
  return (
    <View>
      <View style={styles.row}>
        <SkeletonBox borderRadius={ICON / 2} height={ICON} pulse width={ICON} />
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <SkeletonBox borderRadius={8} height={16} pulse style={{ flex: 1 }} />
            <SkeletonBox borderRadius={6} height={13} pulse width={36} />
          </View>
          <SkeletonBox borderRadius={6} height={13} pulse style={{ marginTop: 8 }} width="55%" />
        </View>
      </View>
      {showDivider ? <View style={[styles.divider, { backgroundColor: dividerColor }]} /> : null}
    </View>
  );
}

/** Placeholder while inbox loads (segment + rows, no card wrapper). */
export function NotificationsInboxSkeleton() {
  const { colors } = useTheme();
  const dividerColor = colors.border;

  const segmentRow = useMemo(
    () => (
      <View style={styles.segmentRow}>
        <SkeletonBox borderRadius={999} height={36} pulse style={{ flex: 1 }} />
        <SkeletonBox borderRadius={999} height={36} pulse style={{ flex: 1, marginLeft: 8 }} />
      </View>
    ),
    [],
  );

  return (
    <View accessibilityLabel="Loading notifications" style={styles.root}>
      {segmentRow}
      <View style={styles.actionsRow}>
        <SkeletonBox borderRadius={6} height={14} pulse width={96} />
      </View>
      {[0, 1, 2, 3, 4].map((k) => (
        <SkeletonRow key={k} dividerColor={dividerColor} showDivider={k < 4} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: SCREEN_GUTTER,
    paddingTop: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionsRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: TEXT_INSET,
    opacity: 0.85,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: GAP,
    paddingVertical: 12,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
});
