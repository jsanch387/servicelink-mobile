import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { ServicePreviewCard } from '../../../services/components/ServicePreviewCard';
import { useTheme } from '../../../../theme';

export function ServicesTabContent({ services, isLoading, error }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 28,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        profileErrorWrap: {
          marginBottom: 12,
        },
        serviceCard: {
          borderRadius: 18,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        emptyStateText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      {error ? (
        <View style={styles.profileErrorWrap}>
          <InlineCardError message={error} />
        </View>
      ) : null}

      {isLoading ? (
        <>
          <SurfaceCard outlined={false} padding="none" style={styles.serviceCard}>
            <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
            <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="36%" />
            <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="88%" />
            <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="72%" />
            <SkeletonBox
              borderRadius={12}
              height={42}
              pulse
              style={{ marginTop: 18 }}
              width="100%"
            />
          </SurfaceCard>
          <SurfaceCard outlined={false} padding="none" style={styles.serviceCard}>
            <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
            <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="36%" />
            <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="88%" />
            <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="72%" />
            <SkeletonBox
              borderRadius={12}
              height={42}
              pulse
              style={{ marginTop: 18 }}
              width="100%"
            />
          </SurfaceCard>
        </>
      ) : null}

      {!isLoading && services.length === 0 ? (
        <SurfaceCard outlined={false} padding="none" style={styles.serviceCard}>
          <AppText style={styles.emptyStateText}>No active services yet.</AppText>
        </SurfaceCard>
      ) : null}

      {!isLoading
        ? services.map((service) => <ServicePreviewCard key={service.id} service={service} />)
        : null}
    </View>
  );
}
