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
                <SkeletonBox borderRadius={6} height={11} pulse width="30%" />
                <SkeletonBox
                  borderRadius={7}
                  height={15}
                  pulse
                  style={{ marginTop: 7 }}
                  width={index % 2 === 0 ? '70%' : '52%'}
                />
              </View>
            </View>
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
}

/**
 * Subscriber detail loading placeholder.
 */
export function SubscriptionDetailSkeleton() {
  return (
    <View
      accessibilityLabel="Loading subscriber details"
      accessibilityRole="progressbar"
      accessible
      style={styles.column}
    >
      <SurfaceCard padding="none" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroText}>
            <SkeletonBox borderRadius={8} height={24} pulse width="62%" />
            <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="44%" />
          </View>
          <SkeletonBox borderRadius={999} height={24} pulse width={72} />
        </View>
      </SurfaceCard>

      <SectionSkeleton rows={3} titleWidth="24%" />
      <SectionSkeleton rows={2} titleWidth="22%" />
      <SectionSkeleton rows={1} titleWidth="18%" />

      <SkeletonBox borderRadius={14} height={52} pulse style={{ marginTop: 4 }} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 22,
  },
  hero: {
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    width: '100%',
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    width: '100%',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
});
