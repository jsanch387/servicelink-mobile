import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { getMaintenanceStatusPillTheme } from '../utils/maintenanceStatusPillTheme';

/**
 * @param {object} props
 * @param {import('../utils/maintenancePresentation').mapMaintenanceDetailModel extends (...args: any) => infer R ? R : never} props.model
 */
export function MaintenanceDetailBody({ model }) {
  const { colors, isDark } = useTheme();

  const pillTheme = useMemo(
    () => getMaintenanceStatusPillTheme(model.statusRaw, colors, isDark),
    [colors, isDark, model.statusRaw],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionsColumn: {
          gap: 22,
        },
        proposalInner: {
          paddingVertical: 4,
        },
        serviceTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.35,
          lineHeight: 28,
        },
        price: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 30,
          letterSpacing: -0.6,
          lineHeight: 36,
          marginTop: 8,
        },
        pillRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: 16,
        },
        pill: {
          alignSelf: 'flex-start',
          borderRadius: 999,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        pillText: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          letterSpacing: 0.15,
        },
        durationRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginTop: 14,
        },
        durationText: {
          color: colors.textMuted,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
        },
        linkCallout: {
          backgroundColor: isDark ? 'rgba(250,250,250,0.05)' : 'rgba(10,10,10,0.04)',
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        linkCopy: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.sectionsColumn}>
      <DetailsSectionCard title="Service">
        <View style={styles.proposalInner}>
          <AppText style={styles.serviceTitle}>{model.serviceTitle}</AppText>
          <AppText style={styles.price}>{model.priceFormatted}</AppText>
          <View style={styles.pillRow}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: pillTheme.backgroundColor,
                  borderColor: pillTheme.borderColor,
                },
              ]}
            >
              <AppText style={[styles.pillText, { color: pillTheme.color }]}>
                {model.statusLabel}
              </AppText>
            </View>
          </View>
          <View style={styles.durationRow}>
            <Ionicons color={colors.textMuted} name="time-outline" size={18} />
            <AppText style={styles.durationText}>{model.durationLabel}</AppText>
          </View>
        </View>
      </DetailsSectionCard>

      <DetailsSectionCard title="First visit">
        <AppText style={styles.durationText}>{model.anchorLabel}</AppText>
      </DetailsSectionCard>

      <View style={styles.linkCallout}>
        <Ionicons color={colors.textMuted} name="link-outline" size={20} />
        <AppText style={styles.linkCopy}>
          {model.canCopyLink
            ? 'Use Copy offer link below to share the customer link again.'
            : 'Offer link will appear here when the server provides one for this enrollment.'}
        </AppText>
      </View>
    </View>
  );
}
