import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  SERVICE_CARD_TITLE_SYSTEM_FONT,
  serviceCardTitleStyle,
} from '../../../../utils/serviceCardTypography';
import { getServiceDescriptionCopy } from '../../utils/bookingLinkModel';

export function ServicesTabContent({ services, isLoading, error }) {
  const { colors } = useTheme();
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

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
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        serviceTopRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        serviceTitle: {
          ...serviceCardTitleStyle(colors),
        },
        startingAt: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 3,
          textAlign: 'right',
        },
        price: {
          color: colors.text,
          fontFamily: SERVICE_CARD_TITLE_SYSTEM_FONT,
          fontSize: 20,
          fontWeight: '900',
          lineHeight: 24,
          textAlign: 'right',
        },
        headerDivider: {
          backgroundColor: 'rgba(255,255,255,0.06)',
          height: 1,
          marginBottom: 10,
          marginTop: 6,
        },
        serviceItemText: {
          color: colors.textMuted,
          fontSize: 14,
          lineHeight: 21,
          marginBottom: 2,
        },
        seeMoreRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginLeft: -4,
          marginTop: 8,
          minHeight: 34,
          paddingHorizontal: 4,
        },
        seeMoreText: {
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '500',
          marginLeft: 6,
        },
        serviceBottomRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: 10,
        },
        durationRow: {
          alignItems: 'center',
          flexDirection: 'row',
        },
        durationText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          marginLeft: 6,
        },
        emptyStateText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  function toggleDescription(serviceId) {
    setExpandedDescriptions((prev) => ({ ...prev, [serviceId]: !prev[serviceId] }));
  }

  return (
    <View style={styles.wrap}>
      {error ? (
        <View style={styles.profileErrorWrap}>
          <InlineCardError message={error} />
        </View>
      ) : null}

      {isLoading ? (
        <>
          <SurfaceCard style={styles.serviceCard} padding="none">
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
          <SurfaceCard style={styles.serviceCard} padding="none">
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
        <SurfaceCard style={styles.serviceCard} padding="none">
          <AppText style={styles.emptyStateText}>No active services yet.</AppText>
        </SurfaceCard>
      ) : null}

      {services.map((service) => (
        <SurfaceCard key={service.id} style={styles.serviceCard} padding="none">
          <View style={styles.serviceTopRow}>
            <AppText style={styles.serviceTitle}>{service.title}</AppText>
            <View>
              <AppText style={styles.startingAt}>Starting at</AppText>
              <AppText style={styles.price}>{service.price}</AppText>
            </View>
          </View>
          <View style={styles.headerDivider} />

          <AppText style={styles.serviceItemText}>
            {getServiceDescriptionCopy(service, Boolean(expandedDescriptions[service.id]))}
          </AppText>

          {service.isLongDescription ? (
            <Pressable style={styles.seeMoreRow} onPress={() => toggleDescription(service.id)}>
              <Ionicons
                name={expandedDescriptions[service.id] ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.textMuted}
              />
              <AppText style={styles.seeMoreText}>
                {expandedDescriptions[service.id] ? 'See less' : 'See more'}
              </AppText>
            </Pressable>
          ) : null}

          <View style={styles.serviceBottomRow}>
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={17} color={colors.textMuted} />
              <AppText style={styles.durationText}>{service.duration}</AppText>
            </View>
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}
