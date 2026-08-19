import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  formatCadencePillLabel,
  formatCustomCadenceLabel,
  formatPlanPriceCents,
  sortSchedules,
} from '../constants/planCadence';
import {
  formatServiceDurationSelectLabel,
  minutesToServiceDurationHHmm,
} from '../../../components/ui/durationTime';
import { PlanSubscribersSummary } from './PlanSubscribersSummary';

const DESCRIPTION_COLLAPSE_CHARS = 180;
const BULLET_PREFIX = /^[•\-\*]\s+(.*)$/;

/**
 * Owners enter line breaks + bullet lines (`• item`) in the plan description.
 * @param {string} text
 * @returns {Array<{ type: 'paragraph' | 'bullet' | 'blank', text?: string }>}
 */
function parseDescriptionBlocks(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((raw) => {
      const line = raw.trimEnd();
      if (line.trim() === '') return { type: 'blank' };
      const trimmed = line.trim();
      const match = trimmed.match(BULLET_PREFIX);
      if (match) return { type: 'bullet', text: match[1].trim() };
      if (trimmed.startsWith('•')) {
        return { type: 'bullet', text: trimmed.slice(1).trim() };
      }
      return { type: 'paragraph', text: line };
    });
}

/**
 * @param {Array<{ type: string, text?: string }>} blocks
 * @param {number} maxChars
 */
function takeDescriptionBlocks(blocks, maxChars) {
  const out = [];
  let used = 0;
  for (const block of blocks) {
    if (block.type === 'blank') {
      if (out.length === 0) continue;
      out.push(block);
      continue;
    }
    const len = String(block.text ?? '').length;
    if (used > 0 && used + len > maxChars) break;
    out.push(block);
    used += len;
    if (used >= maxChars) break;
  }
  return out;
}

function cadenceLabel(schedule) {
  if (schedule?.label) return schedule.label;
  const count = Number(schedule?.count) || 1;
  const interval = schedule?.interval;
  if (interval === 'year' && count === 1) return 'Yearly';
  const pill = formatCadencePillLabel(count, interval);
  if (pill === 'Weekly' || pill === 'Biweekly' || pill === 'Monthly') return pill;
  return formatCustomCadenceLabel(count, interval);
}

/**
 * Plan detail — name/edit, pricing, description, subscribers, delete.
 *
 * @param {object} props
 * @param {object} props.plan
 * @param {number} [props.activeSubscriberCount]
 * @param {number} [props.canceledSubscriberCount]
 * @param {() => void} props.onOpenSubscribers
 * @param {() => void} props.onEdit
 * @param {() => void} props.onDelete
 * @param {boolean} [props.deleting]
 */
export function PlanDetailBody({
  plan,
  activeSubscriberCount = 0,
  canceledSubscriberCount = 0,
  onOpenSubscribers,
  onEdit,
  onDelete,
  deleting = false,
}) {
  const { colors, isDark } = useTheme();
  const schedules = useMemo(() => sortSchedules(plan?.offeredSchedules), [plan?.offeredSchedules]);
  const durationMinutes = Math.max(0, Math.round(Number(plan?.visitDurationMinutes)) || 0);
  const durationLabel =
    durationMinutes > 0
      ? formatServiceDurationSelectLabel(minutesToServiceDurationHHmm(durationMinutes))
      : null;
  const description = String(plan?.description ?? '').trim();
  const descriptionBlocks = useMemo(() => parseDescriptionBlocks(description), [description]);
  const [descExpanded, setDescExpanded] = useState(false);
  const descTruncatable = description.length > DESCRIPTION_COLLAPSE_CHARS;
  const visibleDescriptionBlocks = useMemo(() => {
    if (!descTruncatable || descExpanded) return descriptionBlocks;
    return takeDescriptionBlocks(descriptionBlocks, DESCRIPTION_COLLAPSE_CHARS);
  }, [descriptionBlocks, descExpanded, descTruncatable]);

  useEffect(() => {
    setDescExpanded(false);
  }, [description]);

  const activeCount = Math.max(0, Math.round(Number(activeSubscriberCount)) || 0);
  const canceledCount = Math.max(0, Math.round(Number(canceledSubscriberCount)) || 0);
  /** Best balance on dark fills: clear red, not neon, not washed-out. */
  const deleteAccent = '#e07070';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexGrow: 1,
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
        metaText: {
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
        },
        iconBadge: {
          alignItems: 'center',
          borderRadius: 999,
          height: 36,
          justifyContent: 'center',
          width: 36,
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
          gap: 12,
          paddingVertical: 10,
          width: '100%',
        },
        priceIconCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
        priceCadenceCol: {
          flex: 1,
          minWidth: 0,
        },
        priceCadence: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
        },
        priceAmount: {
          color: colors.text,
          flexShrink: 0,
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
        descriptionStack: {
          gap: 6,
        },
        descriptionParagraph: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
        },
        descriptionBlank: {
          height: 6,
        },
        bulletRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
          paddingRight: 4,
        },
        bulletMarkCol: {
          alignItems: 'center',
          paddingTop: 8,
          width: 8,
        },
        bulletMark: {
          backgroundColor: colors.textSecondary,
          borderRadius: 2,
          height: 5,
          width: 5,
        },
        bulletTextCol: {
          flex: 1,
          minWidth: 0,
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
        dangerWrap: {
          marginTop: 'auto',
          paddingTop: 28,
        },
        deletePress: {
          width: '100%',
        },
        deleteFace: {
          alignItems: 'center',
          backgroundColor: isDark ? colors.buttonSecondaryBg : colors.buttonPrimaryBg,
          borderRadius: 16,
          flexDirection: 'row',
          gap: 8,
          height: 52,
          justifyContent: 'center',
          paddingHorizontal: 16,
          width: '100%',
        },
        deleteFacePressed: {
          backgroundColor: isDark ? colors.buttonSecondaryBgPressed : colors.buttonPrimaryBgPressed,
        },
        deleteFaceDisabled: {
          opacity: 0.55,
        },
        deleteLabel: {
          color: deleteAccent,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.15,
        },
      }),
    [colors, deleteAccent, isDark],
  );

  return (
    <View style={styles.root}>
      <SurfaceCard outlined padding="none" style={styles.heroCard}>
        <View style={styles.heroText}>
          <AppText numberOfLines={2} style={styles.name}>
            {plan?.name || 'Subscription'}
          </AppText>
          {durationLabel ? <AppText style={styles.metaText}>{durationLabel}</AppText> : null}
        </View>
        <View style={styles.heroActions}>
          <Pressable
            accessibilityLabel="Edit subscription"
            accessibilityRole="button"
            onPress={onEdit}
          >
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
                  name="pencil-outline"
                  size={18}
                />
              </View>
            )}
          </Pressable>
        </View>
      </SurfaceCard>

      <DetailsSectionCard title="Pricing">
        {schedules.length === 0 ? (
          <AppText style={styles.empty}>No pricing options yet.</AppText>
        ) : (
          <View style={styles.optionsList}>
            {schedules.map((row, index) => (
              <View key={row.id || row.cadenceKey || `${row.interval}-${row.count}-${index}`}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.priceRow}>
                  <View style={styles.priceIconCol}>
                    <Ionicons color={colors.accentMuted} name="repeat-outline" size={18} />
                  </View>
                  <View style={styles.priceCadenceCol}>
                    <AppText numberOfLines={1} style={styles.priceCadence}>
                      {cadenceLabel(row)}
                    </AppText>
                  </View>
                  <AppText style={styles.priceAmount}>
                    {formatPlanPriceCents(row.priceCents)}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}
      </DetailsSectionCard>

      {description ? (
        <DetailsSectionCard bodyPadding="roomy" title="Description">
          <View style={styles.descriptionStack}>
            {visibleDescriptionBlocks.map((block, index) => {
              if (block.type === 'blank') {
                return <View key={`blank-${index}`} style={styles.descriptionBlank} />;
              }
              if (block.type === 'bullet') {
                return (
                  <View key={`bullet-${index}`} style={styles.bulletRow}>
                    <View style={styles.bulletMarkCol}>
                      <View style={styles.bulletMark} />
                    </View>
                    <View style={styles.bulletTextCol}>
                      <AppText style={styles.descriptionParagraph}>{block.text}</AppText>
                    </View>
                  </View>
                );
              }
              return (
                <AppText key={`p-${index}`} style={styles.descriptionParagraph}>
                  {block.text}
                </AppText>
              );
            })}
          </View>
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

      <PlanSubscribersSummary
        activeCount={activeCount}
        canceledCount={canceledCount}
        onPress={onOpenSubscribers}
      />

      <View style={styles.dangerWrap}>
        <Pressable
          accessibilityLabel="Delete subscription"
          accessibilityRole="button"
          accessibilityState={{ busy: deleting, disabled: deleting }}
          disabled={deleting}
          style={styles.deletePress}
          onPress={onDelete}
        >
          {({ pressed }) => (
            <View
              style={[
                styles.deleteFace,
                pressed && !deleting && styles.deleteFacePressed,
                deleting && styles.deleteFaceDisabled,
              ]}
            >
              {deleting ? (
                <ActivityIndicator color={deleteAccent} />
              ) : (
                <>
                  <Ionicons color={deleteAccent} name="trash-outline" size={17} />
                  <AppText style={styles.deleteLabel}>Delete subscription</AppText>
                </>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
