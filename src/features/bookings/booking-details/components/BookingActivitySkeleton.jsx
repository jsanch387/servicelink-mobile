import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SettingsSection, SkeletonBox } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const SECTION_ROWS = [2, 1, 3];

function ActivityRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <SkeletonBox backgroundColor={colors.textMuted} borderRadius={16} height={32} pulse width={32} />
      <View style={styles.copy}>
        <SkeletonBox backgroundColor={colors.textMuted} borderRadius={6} height={13} pulse width="58%" />
      </View>
      <SkeletonBox backgroundColor={colors.textMuted} borderRadius={6} height={12} pulse width={42} />
    </View>
  );
}

export function BookingActivitySkeleton() {
  return (
    <>
      {SECTION_ROWS.map((rows, index) => (
        <SettingsSection first={index === 0} key={`activity-skel-${index}`} title="Activity">
          <View>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <ActivityRowSkeleton key={`row-${rowIndex}`} />
            ))}
          </View>
        </SettingsSection>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  copy: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
});
