import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailIconFieldRow, DetailsSectionCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  MAINTENANCE_STATUS_PILL_LAYOUT,
  MAINTENANCE_STATUS_PILL_TEXT,
} from '../constants/statusPillLayout';
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
        serviceHeaderRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
        },
        serviceTitle: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.35,
          lineHeight: 28,
          minWidth: 0,
        },
        price: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 30,
          letterSpacing: -0.6,
          lineHeight: 36,
          marginTop: 8,
        },
        pill: {
          ...MAINTENANCE_STATUS_PILL_LAYOUT,
          marginTop: 2,
        },
        pillText: {
          ...MAINTENANCE_STATUS_PILL_TEXT,
          fontFamily: FONT_FAMILIES.semibold,
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
        fieldsStack: {
          gap: 18,
          paddingVertical: 2,
        },
        scheduleEmptyRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          paddingVertical: 2,
        },
        scheduleEmptyText: {
          color: colors.textMuted,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.sectionsColumn}>
      <DetailsSectionCard title="Service">
        <View style={styles.proposalInner}>
          <View style={styles.serviceHeaderRow}>
            <AppText numberOfLines={2} style={styles.serviceTitle}>
              {model.serviceTitle}
            </AppText>
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
          <AppText style={styles.price}>{model.priceFormatted}</AppText>
          <View style={styles.durationRow}>
            <Ionicons color={colors.textMuted} name="time-outline" size={18} />
            <AppText style={styles.durationText}>{model.durationLabel}</AppText>
          </View>
        </View>
      </DetailsSectionCard>

      <DetailsSectionCard bodyPadding="roomy" title="Date and time">
        {model.showCustomerChoosesSchedule ? (
          <View style={styles.scheduleEmptyRow}>
            <Ionicons color={colors.textMuted} name="calendar-outline" size={20} />
            <AppText style={styles.scheduleEmptyText}>{model.customerChoosesScheduleCopy}</AppText>
          </View>
        ) : (
          <View style={styles.fieldsStack}>
            <DetailIconFieldRow
              icon="calendar-outline"
              label="Date"
              labelUppercase={false}
              value={model.anchorDateDisplay}
            />
            <DetailIconFieldRow
              icon="time-outline"
              label="Time"
              labelUppercase={false}
              value={model.anchorTimeDisplay}
            />
          </View>
        )}
      </DetailsSectionCard>
    </View>
  );
}
