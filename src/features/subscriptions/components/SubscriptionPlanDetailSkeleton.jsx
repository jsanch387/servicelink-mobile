import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

function SectionSkeleton({ titleWidth = '28%', rows = 2 }) {
  return (
    <View style={styles.section}>
      <SkeletonBox borderRadius={6} height={15} pulse width={titleWidth} />
      <SurfaceCard padding="none" style={styles.sectionCard}>
        {Array.from({ length: rows }).map((_, index) => (
          <View key={index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <View style={styles.row}>
              <SkeletonBox borderRadius={9} height={18} pulse width={18} />
              <View style={styles.rowText}>
                <SkeletonBox
                  borderRadius={7}
                  height={15}
                  pulse
                  width={index % 2 === 0 ? '48%' : '36%'}
                />
              </View>
              <SkeletonBox borderRadius={7} height={15} pulse width={56} />
            </View>
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
}

/**
 * Plan detail loading placeholder — hero + pricing/description/subscribers.
 */
export function SubscriptionPlanDetailSkeleton() {
  return (
    <View
      accessibilityLabel="Loading subscription details"
      accessibilityRole="progressbar"
      accessible
      style={styles.column}
    >
      <SurfaceCard outlined padding="none" style={styles.hero}>
        <View style={styles.heroText}>
          <SkeletonBox borderRadius={8} height={24} pulse width="68%" />
          <SkeletonBox borderRadius={8} height={15} pulse style={{ marginTop: 10 }} width="28%" />
        </View>
        <SkeletonBox borderRadius={999} height={36} pulse width={36} />
      </SurfaceCard>

      <SectionSkeleton rows={2} titleWidth="22%" />
      <SectionSkeleton rows={1} titleWidth="30%" />

      <View style={styles.section}>
        <SkeletonBox borderRadius={6} height={15} pulse width="30%" />
        <SurfaceCard padding="none" style={styles.sectionCard}>
          <View style={styles.row}>
            <SkeletonBox borderRadius={9} height={18} pulse width={18} />
            <View style={styles.rowText}>
              <SkeletonBox borderRadius={7} height={15} pulse width="55%" />
            </View>
            <SkeletonBox borderRadius={6} height={16} pulse width={16} />
          </View>
        </SurfaceCard>
      </View>

      <SkeletonBox borderRadius={14} height={52} pulse style={styles.deleteBtn} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flexGrow: 1,
    gap: 22,
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    gap: 8,
  },
  sectionCard: {
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  divider: {
    backgroundColor: 'rgba(128,128,128,0.15)',
    height: StyleSheet.hairlineWidth,
    marginLeft: 30,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    width: '100%',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  deleteBtn: {
    marginTop: 'auto',
    paddingTop: 28,
  },
});
