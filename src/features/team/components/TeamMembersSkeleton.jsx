import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';
import { TEAM_MEMBERS_LOADING } from '../constants/teamMembersCopy';

const ROWS = [0, 1, 2];

/**
 * List placeholders that match `TeamMemberCard` while the roster loads.
 */
export function TeamMembersSkeleton() {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          gap: 10,
          width: '100%',
        },
        card: {
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        avatarWrap: {
          marginRight: 12,
        },
        textCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        email: {
          marginTop: 8,
        },
        chevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          marginLeft: 10,
          width: 22,
        },
      }),
    [],
  );

  return (
    <View accessibilityLabel={TEAM_MEMBERS_LOADING} style={styles.list}>
      {ROWS.map((key) => (
        <SurfaceCard key={key} outlined padding="none" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatarWrap}>
              <SkeletonBox borderRadius={20} height={40} pulse width={40} />
            </View>
            <View style={styles.textCol}>
              <SkeletonBox borderRadius={6} height={16} pulse width="46%" />
              <SkeletonBox borderRadius={6} height={13} pulse style={styles.email} width="68%" />
            </View>
            <View style={styles.chevronCol}>
              <SkeletonBox borderRadius={4} height={14} pulse width={10} />
            </View>
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}
