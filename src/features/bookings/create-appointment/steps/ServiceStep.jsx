import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { ServicePreviewCard } from '../../../services/components/ServicePreviewCard';
import { mapCatalogServiceToPreviewCard } from '../../../services/utils/mapCatalogServiceToPreviewCard';
import { useTheme } from '../../../../theme';

function ServiceListSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
      }),
    [colors],
  );

  return (
    <>
      <SurfaceCard outlined={false} padding="none" style={styles.card}>
        <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="36%" />
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="88%" />
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="72%" />
        <SkeletonBox borderRadius={12} height={42} pulse style={{ marginTop: 18 }} width="100%" />
      </SurfaceCard>
      <SurfaceCard outlined={false} padding="none" style={styles.card}>
        <SkeletonBox borderRadius={8} height={18} pulse width="48%" />
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 10 }} width="36%" />
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="88%" />
        <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 8 }} width="72%" />
        <SkeletonBox borderRadius={12} height={42} pulse style={{ marginTop: 18 }} width="100%" />
      </SurfaceCard>
    </>
  );
}

export function ServiceStep({
  catalogError,
  isLoading,
  services,
  selectedServiceId,
  onSelectServiceId,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        empty: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
        errorWrap: {
          marginBottom: 12,
        },
      }),
    [colors],
  );

  if (catalogError) {
    return (
      <View style={styles.errorWrap}>
        <InlineCardError message={catalogError} />
      </View>
    );
  }

  if (isLoading) {
    return <ServiceListSkeleton />;
  }

  if (!services.length) {
    return (
      <AppText style={styles.empty}>
        No active services yet. Add services in the Services tab.
      </AppText>
    );
  }

  return (
    <View>
      {services.map((svc) => {
        const card = mapCatalogServiceToPreviewCard(svc);
        return (
          <ServicePreviewCard
            key={svc.id}
            selected={selectedServiceId === svc.id}
            service={card}
            onPress={() => onSelectServiceId(svc.id)}
          />
        );
      })}
    </View>
  );
}
