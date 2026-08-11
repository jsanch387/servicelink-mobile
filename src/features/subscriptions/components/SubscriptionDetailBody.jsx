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
 * Subscriber detail — plan snapshot + billing fields owners need for support.
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
        planCard: {
          marginBottom: 0,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        planTop: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        planName: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          letterSpacing: -0.3,
          lineHeight: 24,
          minWidth: 0,
        },
        planPrice: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          marginTop: 6,
        },
        pill: {
          ...PILL_LAYOUT,
        },
        pillText: {
          ...PILL_TEXT,
          fontFamily: FONT_FAMILIES.semibold,
        },
        fieldsStack: {
          gap: 16,
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

  const nextVisitValue = model.nextVisitDateDisplay
    ? `${model.nextVisitDateDisplay}${
        model.nextVisitTimeDisplay ? ` at ${model.nextVisitTimeDisplay}` : ''
      }`
    : 'Not scheduled';

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

      <SurfaceCard outlined padding="none" style={styles.planCard}>
        <View style={styles.planTop}>
          <AppText numberOfLines={2} style={styles.planName}>
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
        <AppText style={styles.planPrice}>{model.priceFormatted}</AppText>
      </SurfaceCard>

      <DetailsSectionCard title="Billing">
        <View style={styles.fieldsStack}>
          <DetailIconFieldRow
            icon="flag-outline"
            label="Started"
            labelUppercase={false}
            value={model.startedAtDisplay}
          />
          <DetailIconFieldRow
            icon="calendar-outline"
            label="Next bill"
            labelUppercase={false}
            value={model.nextBillDisplay}
          />
          <DetailIconFieldRow
            icon="card-outline"
            label="Last payment"
            labelUppercase={false}
            value={model.lastPaymentDisplay}
          />
        </View>
      </DetailsSectionCard>

      <DetailsSectionCard title="Schedule">
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
            value={nextVisitValue}
          />
          <DetailIconFieldRow
            icon="checkmark-circle-outline"
            label="Last visit"
            labelUppercase={false}
            value={model.lastVisitDateDisplay ?? 'None yet'}
          />
        </View>
      </DetailsSectionCard>
    </View>
  );
}
