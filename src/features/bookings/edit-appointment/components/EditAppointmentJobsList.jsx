import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { formatUsdFromNumber } from '../../create-appointment/utils/priceLabelMath';

/**
 * @param {{
 *   jobs: Array<{
 *     localId?: string;
 *     serviceName?: string;
 *     selectedPricingOption?: { label?: string; priceLabel?: string; priceCents?: number } | null;
 *     vehicle?: { year?: string; make?: string; model?: string };
 *   }>;
 *   onSelectJob: (index: number) => void;
 * }} props
 */
export function EditAppointmentJobsList({ jobs, onSelectJob }) {
  const { colors } = useTheme();
  const list = Array.isArray(jobs) ? jobs : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          rowGap: 12,
        },
        header: {
          gap: 3,
          paddingBottom: 2,
        },
        heading: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 20,
          fontWeight: '600',
          letterSpacing: -0.35,
          lineHeight: 24,
        },
        subtext: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
          letterSpacing: -0.05,
          lineHeight: 17,
        },
        stack: {
          gap: 10,
        },
        card: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          overflow: 'hidden',
        },
        pressable: {
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        pressed: {
          backgroundColor: colors.buttonGhostPressed,
        },
        body: {
          gap: 8,
        },
        topRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
        },
        serviceCol: {
          flex: 1,
          gap: 2,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        option: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 17,
        },
        price: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          marginTop: 1,
        },
        bottomRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          minHeight: 22,
        },
        vehicle: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 17,
          minWidth: 0,
        },
        chevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          width: 18,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText style={styles.heading}>Jobs</AppText>
        <AppText style={styles.subtext}>
          Tap a job to change its service, price, add-ons, or vehicle.
        </AppText>
      </View>
      <View style={styles.stack}>
        {list.map((job, index) => {
          const name = String(job.serviceName ?? '').trim() || `Job ${index + 1}`;
          const option = String(job.selectedPricingOption?.label ?? '').trim();
          const showOption = Boolean(option && option !== 'Standard');
          const vehicleParts = [
            String(job.vehicle?.year ?? '').trim(),
            String(job.vehicle?.make ?? '').trim(),
            String(job.vehicle?.model ?? '').trim(),
          ].filter(Boolean);
          const vehicleLine = vehicleParts.join(' ');
          const priceLabel =
            job.selectedPricingOption?.priceLabel?.trim() ||
            formatUsdFromNumber((job.selectedPricingOption?.priceCents ?? 0) / 100);

          return (
            <SurfaceCard
              key={job.localId ?? `job-${index}`}
              outlined
              padding="none"
              style={styles.card}
            >
              <Pressable accessibilityRole="button" onPress={() => onSelectJob(index)}>
                {({ pressed }) => (
                  <View style={[styles.pressable, pressed && styles.pressed]}>
                    <View style={styles.body}>
                      <View style={styles.topRow}>
                        <View style={styles.serviceCol}>
                          <AppText numberOfLines={2} style={styles.title}>
                            {name}
                          </AppText>
                          {showOption ? (
                            <AppText numberOfLines={1} style={styles.option}>
                              {option}
                            </AppText>
                          ) : null}
                        </View>
                        <AppText style={styles.price}>{priceLabel}</AppText>
                      </View>
                      <View style={styles.bottomRow}>
                        {vehicleLine ? (
                          <AppText numberOfLines={1} style={styles.vehicle}>
                            {vehicleLine}
                          </AppText>
                        ) : (
                          <View style={styles.vehicle} />
                        )}
                        <View style={styles.chevronCol}>
                          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            </SurfaceCard>
          );
        })}
      </View>
    </View>
  );
}
