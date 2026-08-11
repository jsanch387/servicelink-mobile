import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  DeleteButton,
  DetailsSectionCard,
  SurfaceCard,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  formatCadencePillLabel,
  formatCustomCadenceLabel,
  formatPlanPriceCents,
  lowestSchedulePriceCents,
  sortSchedules,
} from '../constants/planCadence';

const DESCRIPTION_COLLAPSE_CHARS = 180;

function cadenceLabel(count, interval) {
  const pill = formatCadencePillLabel(count, interval);
  if (pill === '2 weeks') return 'Every 2 weeks';
  if (pill === 'Weekly' || pill === 'Monthly') return pill;
  return formatCustomCadenceLabel(count, interval);
}

function priceSuffixForSchedule(schedule) {
  if (!schedule) return '';
  const count = Number(schedule.count) || 1;
  if (schedule.interval === 'month' && count === 1) return '/mo';
  if (schedule.interval === 'week' && count === 1) return '/wk';
  return '';
}

/**
 * Plan detail — hero, description, compact options, subscribers + copy link.
 *
 * @param {object} props
 * @param {object} props.plan
 * @param {number} props.subscriberCount
 * @param {boolean} props.linkCopied
 * @param {() => void} props.onOpenSubscribers
 * @param {() => void} props.onCopyLink
 * @param {() => void} props.onEdit
 * @param {() => void} props.onDelete
 */
export function PlanDetailBody({
  plan,
  subscriberCount,
  linkCopied,
  onOpenSubscribers,
  onCopyLink,
  onEdit,
  onDelete,
}) {
  const { colors, isDark } = useTheme();
  const schedules = useMemo(() => sortSchedules(plan?.offeredSchedules), [plan?.offeredSchedules]);
  const lowestCents = lowestSchedulePriceCents(schedules);
  const fromSchedule =
    schedules.find((row) => Number(row.priceCents) === lowestCents) ?? schedules[0] ?? null;
  const fromSuffix = priceSuffixForSchedule(fromSchedule);
  const description = String(plan?.description ?? '').trim();
  const [descExpanded, setDescExpanded] = useState(false);
  const descTruncatable = description.length > DESCRIPTION_COLLAPSE_CHARS;
  const descDisplay =
    !descTruncatable || descExpanded
      ? description
      : `${description.slice(0, DESCRIPTION_COLLAPSE_CHARS).trimEnd()}…`;

  useEffect(() => {
    setDescExpanded(false);
  }, [description]);

  const subscribersLabel =
    subscriberCount > 0
      ? `${subscriberCount} subscriber${subscriberCount === 1 ? '' : 's'}`
      : 'No subscribers yet';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 22,
        },
        heroCard: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        heroText: {
          flex: 1,
          gap: 4,
          minWidth: 0,
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 28,
        },
        priceLine: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
        },
        heroActions: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 0,
          gap: 8,
        },
        /** Compact soft badge — stays small so long plan names keep room. */
        iconBadge: {
          alignItems: 'center',
          borderRadius: 10,
          height: 34,
          justifyContent: 'center',
          width: 34,
        },
        iconBadgeEdit: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : colors.shellElevated,
        },
        iconBadgeEditPressed: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : colors.buttonGhostPressed,
        },
        optionsList: {
          marginVertical: -6,
        },
        priceRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 10,
        },
        priceCadence: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
          marginRight: 16,
          minWidth: 0,
        },
        priceAmount: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.25,
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
        },
        empty: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 21,
        },
        description: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
        more: {
          alignSelf: 'flex-start',
          marginTop: 8,
        },
        moreText: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '600',
        },
        subscribersInner: {
          gap: 14,
        },
        /**
         * Row layout MUST live on an inner View — Pressable often ignores
         * flexDirection: 'row' and stacks children (see SettingsNavRow).
         */
        subscribersRow: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 44,
          width: '100%',
        },
        subscribersLabelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        subscribersLabel: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
        },
        subscribersChevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          marginLeft: 8,
          width: 22,
        },
        linkHelper: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
        },
        dangerWrap: {
          marginTop: 8,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.root}>
      <SurfaceCard outlined padding="none" style={styles.heroCard}>
        <View style={styles.heroText}>
          <AppText numberOfLines={2} style={styles.name}>
            {plan?.name || 'Plan'}
          </AppText>
          {lowestCents != null ? (
            <AppText style={styles.priceLine}>
              From {formatPlanPriceCents(lowestCents)}
              {fromSuffix}
            </AppText>
          ) : null}
        </View>
        <View style={styles.heroActions}>
          <Pressable accessibilityLabel="Edit plan" accessibilityRole="button" onPress={onEdit}>
            {({ pressed }) => (
              <View
                style={[
                  styles.iconBadge,
                  styles.iconBadgeEdit,
                  pressed && styles.iconBadgeEditPressed,
                ]}
              >
                <Ionicons
                  color={isDark ? '#e5e5e5' : colors.text}
                  name="create-outline"
                  size={18}
                />
              </View>
            )}
          </Pressable>
        </View>
      </SurfaceCard>

      {description ? (
        <DetailsSectionCard bodyPadding="roomy" title="Description">
          <AppText style={styles.description}>{descDisplay}</AppText>
          {descTruncatable ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              style={styles.more}
              onPress={() => setDescExpanded((open) => !open)}
            >
              <AppText style={styles.moreText}>{descExpanded ? 'Less' : 'More'}</AppText>
            </Pressable>
          ) : null}
        </DetailsSectionCard>
      ) : null}

      <DetailsSectionCard title="Plan options">
        {schedules.length === 0 ? (
          <AppText style={styles.empty}>No pricing options yet.</AppText>
        ) : (
          <View style={styles.optionsList}>
            {schedules.map((row, index) => (
              <View key={row.cadenceKey}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.priceRow}>
                  <AppText numberOfLines={1} style={styles.priceCadence}>
                    {cadenceLabel(row.count, row.interval)}
                  </AppText>
                  <AppText style={styles.priceAmount}>
                    {formatPlanPriceCents(row.priceCents)}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}
      </DetailsSectionCard>

      <DetailsSectionCard bodyPadding="roomy" title="Subscribers">
        <View style={styles.subscribersInner}>
          <Pressable
            accessibilityHint="Opens everyone on this plan"
            accessibilityLabel={subscribersLabel}
            accessibilityRole="button"
            onPress={onOpenSubscribers}
          >
            {({ pressed }) => (
              <View style={[styles.subscribersRow, pressed && { opacity: 0.75 }]}>
                <View style={styles.subscribersLabelCol}>
                  <AppText numberOfLines={1} style={styles.subscribersLabel}>
                    {subscribersLabel}
                  </AppText>
                </View>
                <View style={styles.subscribersChevronCol}>
                  <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
                </View>
              </View>
            )}
          </Pressable>

          <View style={styles.divider} />

          <AppText style={styles.linkHelper}>
            Share this link so customers can subscribe to your plans.
          </AppText>
          <Button
            fullWidth
            iconName={linkCopied ? 'checkmark-circle' : 'link-outline'}
            title={linkCopied ? 'Link copied' : 'Copy link'}
            variant="secondary"
            onPress={onCopyLink}
          />
        </View>
      </DetailsSectionCard>

      <View style={styles.dangerWrap}>
        <DeleteButton title="Delete plan" onPress={onDelete} />
      </View>
    </View>
  );
}
