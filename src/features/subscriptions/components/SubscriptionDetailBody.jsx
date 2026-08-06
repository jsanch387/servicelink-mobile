import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  DetailIconFieldRow,
  DetailsSectionCard,
  SurfaceCard,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { getSubscriptionStatusPillTheme } from '../utils/subscriptionStatusPillTheme';

const PILL_LAYOUT = {
  borderRadius: 999,
  borderWidth: 1,
  flexShrink: 0,
  paddingHorizontal: 8,
  paddingVertical: 3,
};

const PILL_TEXT = {
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: -0.05,
};

/**
 * @param {object} props
 * @param {ReturnType<import('../utils/subscriptionPresentation').mapSubscriptionDetailModel>} props.model
 */
export function SubscriptionDetailBody({ model }) {
  const { colors, isDark } = useTheme();

  const pillTheme = useMemo(
    () => getSubscriptionStatusPillTheme(model.statusRaw, colors, isDark),
    [colors, isDark, model.statusRaw],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionsColumn: {
          gap: 22,
        },
        headerRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
        },
        planTitle: {
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
        serviceLine: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          marginTop: 8,
        },
        pill: {
          ...PILL_LAYOUT,
          marginTop: 2,
        },
        pillText: {
          ...PILL_TEXT,
          fontFamily: FONT_FAMILIES.semibold,
        },
        fieldsStack: {
          gap: 18,
          paddingVertical: 2,
        },
        banner: {
          marginBottom: 0,
        },
        bannerTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.15,
        },
        bannerBody: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 6,
        },
        endingRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
          marginTop: 14,
        },
        endingText: {
          color: colors.textSecondary,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.sectionsColumn}>
      {model.paymentFailed?.visible ? (
        <SurfaceCard padding="md" style={styles.banner}>
          <AppText style={styles.bannerTitle}>{model.paymentFailed.title}</AppText>
          <AppText style={styles.bannerBody}>{model.paymentFailed.body}</AppText>
        </SurfaceCard>
      ) : null}

      {model.showEndingSoon ? (
        <SurfaceCard padding="md" style={styles.banner}>
          <View style={styles.endingRow}>
            <Ionicons color={colors.textMuted} name="information-circle-outline" size={20} />
            <AppText style={styles.endingText}>{model.endingSoonCopy}</AppText>
          </View>
        </SurfaceCard>
      ) : null}

      <DetailsSectionCard title="Plan">
        <View style={styles.headerRow}>
          <AppText numberOfLines={2} style={styles.planTitle}>
            {model.planName}
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
        <AppText style={styles.serviceLine}>{model.serviceName}</AppText>
      </DetailsSectionCard>

      <DetailsSectionCard bodyPadding="roomy" title="Schedule">
        <View style={styles.fieldsStack}>
          <DetailIconFieldRow
            icon="repeat-outline"
            label="Preferred day"
            labelUppercase={false}
            value={`${model.preferredWeekday} at ${model.preferredTime}`}
          />
          <DetailIconFieldRow
            icon="calendar-outline"
            label="Next visit"
            labelUppercase={false}
            value={
              model.nextVisitDateDisplay
                ? `${model.nextVisitDateDisplay}${
                    model.nextVisitTimeDisplay ? ` at ${model.nextVisitTimeDisplay}` : ''
                  }`
                : 'Not scheduled'
            }
          />
          <DetailIconFieldRow
            icon="checkmark-circle-outline"
            label="Last visit"
            labelUppercase={false}
            value={model.lastVisitDateDisplay ?? 'None yet'}
          />
        </View>
      </DetailsSectionCard>

      <DetailsSectionCard bodyPadding="roomy" title="Billing">
        <View style={styles.fieldsStack}>
          <DetailIconFieldRow
            icon="card-outline"
            label="Current period ends"
            labelUppercase={false}
            value={model.currentPeriodEndDisplay}
          />
          <DetailIconFieldRow
            icon="flag-outline"
            label="Started"
            labelUppercase={false}
            value={model.startedAtDisplay}
          />
        </View>
      </DetailsSectionCard>
    </View>
  );
}
