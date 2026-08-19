import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  DetailIconFieldRow,
  DetailsSectionCard,
  MembershipMark,
  SurfaceCard,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { SUBSCRIPTION_REBOOK_BUTTON } from '../constants';
import { getSubscriptionStatusPillTheme } from '../utils/subscriptionStatusPillTheme';

const PILL_LAYOUT = {
  borderRadius: 999,
  borderWidth: 1,
  flexShrink: 0,
  paddingHorizontal: 8,
  paddingVertical: 3,
};

/**
 * Subscriber detail — overview once, then visits with book / send-link CTAs when needed.
 * @param {object} props
 * @param {ReturnType<import('../utils/subscriptionPresentation').mapSubscriptionDetailModel>} props.model
 * @param {() => void} [props.onBookVisit]
 * @param {() => void} [props.onSendScheduleLink]
 * @param {() => void} [props.onOpenVisit]
 * @param {boolean} [props.sendScheduleLinkLoading]
 */
export function SubscriptionDetailBody({
  model,
  onBookVisit,
  onSendScheduleLink,
  onOpenVisit,
  sendScheduleLinkLoading = false,
}) {
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
        heroCard: {
          gap: 4,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        heroTop: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          width: '100%',
        },
        heroNameCol: {
          flex: 1,
          minWidth: 0,
        },
        heroNameRow: {
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 2,
          minWidth: 0,
        },
        heroName: {
          color: colors.text,
          flexShrink: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 28,
          minWidth: 0,
        },
        heroPlanRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          marginTop: 14,
          width: '100%',
        },
        heroPlanCol: {
          flex: 1,
          minWidth: 0,
        },
        heroPlan: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        heroCadence: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 0,
          gap: 5,
        },
        heroCadenceText: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        pill: {
          ...PILL_LAYOUT,
        },
        pillText: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: -0.05,
        },
        statsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        },
        statCard: {
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
          gap: 10,
          minWidth: '46%',
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        statTop: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          width: '100%',
        },
        statIconBadge: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.shellElevated,
          borderRadius: 9,
          height: 28,
          justifyContent: 'center',
          width: 28,
        },
        statLabel: {
          color: colors.textMuted,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          minWidth: 0,
        },
        statValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        statValueDate: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        fieldsStack: {
          marginVertical: -4,
        },
        fieldBlock: {
          paddingVertical: 12,
        },
        fieldDivider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 36,
          opacity: 0.9,
        },
        nextVisitEmpty: {
          gap: 14,
        },
        nextVisitEmptyBody: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          lineHeight: 22,
        },
        visitActions: {
          gap: 10,
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
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
        },
        endingText: {
          color: isDark ? '#FBBF24' : '#B45309',
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 18,
        },
        noticeIcon: {
          marginTop: 1,
        },
        billingSection: {
          gap: 8,
        },
        sectionTitle: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
      }),
    [colors, isDark],
  );

  const visitStatus = String(model.visitStatus ?? '').trim();
  const showVisits = visitStatus !== 'none' && visitStatus !== '';
  const hasNextVisit = Boolean(model.hasNextVisit);
  const nextVisitValue = hasNextVisit
    ? `${model.nextVisitDateDisplay}${
        model.nextVisitTimeDisplay ? ` at ${model.nextVisitTimeDisplay}` : ''
      }`
    : null;
  const completedVisitValue = model.lastVisitDateDisplay
    ? `${model.lastVisitDateDisplay}${
        model.nextVisitTimeDisplay ? ` at ${model.nextVisitTimeDisplay}` : ''
      }`
    : null;

  const summaryStats = [
    { key: 'amount', label: 'Amount', value: model.amountShort, icon: 'cash-outline' },
    {
      key: 'nextBill',
      label: 'Next bill',
      value: model.nextBillShort,
      icon: 'calendar-outline',
      valueTone: 'date',
    },
    {
      key: 'started',
      label: 'Started',
      value: model.startedAtDisplay,
      icon: 'flag-outline',
      valueTone: 'date',
    },
    {
      key: 'lastPayment',
      label: 'Last payment',
      value: model.lastPaymentShort,
      icon: 'checkmark-circle-outline',
      valueTone: 'date',
    },
  ];

  const canBookVisit = typeof onBookVisit === 'function' && Boolean(model.needsVisit);
  const canSendScheduleLink = typeof onSendScheduleLink === 'function' && Boolean(model.needsVisit);
  const canOpenVisit = typeof onOpenVisit === 'function' && Boolean(model.periodVisitBookingId);

  return (
    <View style={styles.sectionsColumn}>
      {model.paymentFailed?.visible ? (
        <SurfaceCard padding="md" style={styles.banner}>
          <AppText style={styles.bannerTitle}>{model.paymentFailed.title}</AppText>
          <AppText style={styles.bannerBody}>{model.paymentFailed.body}</AppText>
        </SurfaceCard>
      ) : null}

      {model.showEndingSoon ? (
        <View style={styles.endingRow}>
          <Ionicons
            color={isDark ? '#FBBF24' : '#B45309'}
            name="information-circle"
            size={15}
            style={styles.noticeIcon}
          />
          <AppText style={styles.endingText}>{model.endingSoonCopy}</AppText>
        </View>
      ) : null}

      {model.planRemovedCopy ? (
        <SurfaceCard padding="md" style={styles.banner}>
          <View style={styles.endingRow}>
            <Ionicons color={colors.textMuted} name="information-circle-outline" size={20} />
            <AppText style={styles.endingText}>{model.planRemovedCopy}</AppText>
          </View>
        </SurfaceCard>
      ) : null}

      <SurfaceCard outlined padding="none" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroNameCol}>
            <View style={styles.heroNameRow}>
              <AppText numberOfLines={2} style={styles.heroName}>
                {model.customerName}
              </AppText>
              <MembershipMark size="md" />
            </View>
          </View>
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
        <View style={styles.heroPlanRow}>
          <View style={styles.heroPlanCol}>
            <AppText numberOfLines={2} style={styles.heroPlan}>
              {model.planName}
            </AppText>
          </View>
          <View style={styles.heroCadence}>
            <Ionicons color={colors.textMuted} name="repeat-outline" size={14} />
            <AppText style={styles.heroCadenceText}>{model.scheduleLabel}</AppText>
          </View>
        </View>
      </SurfaceCard>

      {showVisits ? (
        <DetailsSectionCard title="Visits">
          <View style={styles.fieldsStack}>
            {visitStatus === 'needs_visit' ? (
              <View style={styles.fieldBlock}>
                <View style={styles.nextVisitEmpty}>
                  <AppText style={styles.nextVisitEmptyBody}>Needs a visit this period</AppText>
                  {canBookVisit || canSendScheduleLink ? (
                    <View style={styles.visitActions}>
                      {canBookVisit ? (
                        <Button
                          fullWidth
                          iconName="calendar-outline"
                          title="Book a visit"
                          variant="primary"
                          onPress={onBookVisit}
                        />
                      ) : null}
                      {canSendScheduleLink ? (
                        <Button
                          fullWidth
                          disabled={sendScheduleLinkLoading}
                          iconName="paper-plane-outline"
                          loading={sendScheduleLinkLoading}
                          title={SUBSCRIPTION_REBOOK_BUTTON}
                          variant="secondary"
                          onPress={onSendScheduleLink}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {visitStatus === 'scheduled' ? (
              <View style={styles.fieldBlock}>
                <DetailIconFieldRow
                  accessibilityHint="Opens booking details"
                  icon="navigate-outline"
                  label="Visit scheduled"
                  labelUppercase={false}
                  value={nextVisitValue ?? 'Scheduled'}
                  onPress={canOpenVisit ? onOpenVisit : undefined}
                />
              </View>
            ) : null}

            {visitStatus === 'completed' ? (
              <View style={styles.fieldBlock}>
                <DetailIconFieldRow
                  accessibilityHint="Opens booking details"
                  icon="checkmark-done-outline"
                  iconColor={colors.textSuccess}
                  label="Visit complete"
                  labelUppercase={false}
                  value={completedVisitValue ?? 'Complete'}
                  onPress={canOpenVisit ? onOpenVisit : undefined}
                />
              </View>
            ) : null}
          </View>
        </DetailsSectionCard>
      ) : null}

      <View style={styles.billingSection}>
        <AppText style={styles.sectionTitle}>Subscription</AppText>
        <View style={styles.statsGrid}>
          {summaryStats.map((stat) => (
            <SurfaceCard key={stat.key} outlined padding="none" style={styles.statCard}>
              <View style={styles.statTop}>
                <View style={styles.statIconBadge}>
                  <Ionicons color={colors.accentMuted} name={stat.icon} size={15} />
                </View>
                <AppText numberOfLines={1} style={styles.statLabel}>
                  {stat.label}
                </AppText>
              </View>
              <AppText
                numberOfLines={2}
                style={stat.valueTone === 'date' ? styles.statValueDate : styles.statValue}
              >
                {stat.value}
              </AppText>
            </SurfaceCard>
          ))}
        </View>
      </View>
    </View>
  );
}
