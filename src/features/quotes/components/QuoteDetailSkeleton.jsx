import { StyleSheet, View } from 'react-native';
import { SkeletonBox, SurfaceCard } from '../../../components/ui';

function SectionSkeleton({ rows, titleWidth }) {
  return (
    <View style={styles.section}>
      <SkeletonBox borderRadius={6} height={15} pulse width={titleWidth} />
      <SurfaceCard style={styles.card}>
        {Array.from({ length: rows }).map((_, index) => (
          <View key={index} style={styles.row}>
            <SkeletonBox borderRadius={9} height={18} pulse width={18} />
            <View style={styles.rowText}>
              <SkeletonBox borderRadius={6} height={11} pulse width="28%" />
              <SkeletonBox
                borderRadius={7}
                height={15}
                pulse
                style={styles.value}
                width={index % 2 === 0 ? '72%' : '55%'}
              />
            </View>
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
}

export function QuoteDetailSkeleton({ isRequest = false }) {
  return (
    <View accessibilityLabel="Loading quote details" style={styles.column}>
      <SectionSkeleton rows={isRequest ? 3 : 2} titleWidth={isRequest ? '22%' : '24%'} />
      <SectionSkeleton rows={isRequest ? 3 : 2} titleWidth="24%" />
      <SectionSkeleton rows={1} titleWidth="20%" />
      <View style={styles.actions}>
        {isRequest ? <SkeletonBox borderRadius={14} height={52} pulse width="100%" /> : null}
        <SkeletonBox borderRadius={14} height={52} pulse width="100%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 22,
  },
  section: {
    gap: 8,
  },
  card: {
    gap: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  value: {
    marginTop: 7,
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
});
