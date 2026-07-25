import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { format24HourTo12Hour, resolveTimeOffDateRange } from '../utils/availabilityModel';

const DELETE_ICON = '#f87171';

/**
 * @param {string} rawDate YYYY-MM-DD
 */
function parseDateKey(rawDate) {
  const parsed = new Date(`${String(rawDate ?? '').trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * @param {string} rawDate YYYY-MM-DD
 */
function formatDateTile(rawDate) {
  const parsed = parseDateKey(rawDate);
  if (!parsed) {
    return { month: '—', day: '—' };
  }
  return {
    month: parsed.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
    day: String(parsed.getDate()),
  };
}

/**
 * @param {string} startDate
 * @param {string} endDate
 */
function formatRangeLabel(startDate, endDate) {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  if (!start) return 'Date';
  if (!end || startDate === endDate) {
    return start.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = start.toLocaleDateString(undefined, { month: 'short' });
    return `${month} ${start.getDate()} – ${end.getDate()}`;
  }

  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

/**
 * Compact clock label: `9AM`, `5:30PM` (minutes only when not on the hour).
 * @param {string | null | undefined} hhmm
 */
function formatCompactTime(hhmm) {
  const raw = String(hhmm ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    const twelve = format24HourTo12Hour(hhmm);
    if (!twelve) return '—';
    return twelve.replace(':00', '').replace(' ', '');
  }
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  if (minute === '00') return `${hour}${period}`;
  return `${hour}:${minute}${period}`;
}

/**
 * @param {{ all_day?: boolean; allDay?: boolean; start_time?: string; end_time?: string }} block
 */
function formatHoursLabel(block) {
  if (Boolean(block?.all_day ?? block?.allDay)) return 'All day';
  const start = formatCompactTime(block?.start_time);
  const end = formatCompactTime(block?.end_time);
  return `${start} – ${end}`;
}

/**
 * @param {Array<object>} blocks
 */
function sortTimeOffBlocks(blocks) {
  return [...(blocks ?? [])].sort((a, b) => {
    const aRange = resolveTimeOffDateRange(a);
    const bRange = resolveTimeOffDateRange(b);
    const aStart = aRange?.startDate ?? '';
    const bStart = bRange?.startDate ?? '';
    const dateCmp = aStart.localeCompare(bStart);
    if (dateCmp !== 0) return dateCmp;
    return String(a?.start_time ?? '').localeCompare(String(b?.start_time ?? ''));
  });
}

/**
 * Compact time-off list for Availability — empty CTA or sorted blocks.
 *
 * @param {{
 *   blocks: Array<object>;
 *   onAddPress: () => void;
 *   onDeletePress: (indexInOriginal: number) => void;
 *   style?: object;
 * }} props
 */
export function TimeOffSection({ blocks, onAddPress, onDeletePress, style }) {
  const { colors, isDark } = useTheme();
  const sorted = useMemo(() => sortTimeOffBlocks(blocks), [blocks]);
  const isEmpty = sorted.length === 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: 14,
        },
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
          marginTop: 4,
          paddingRight: 2,
        },
        sectionTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
        },
        addLink: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 2,
          paddingHorizontal: 2,
          paddingVertical: 4,
        },
        addLinkLabel: {
          color: colors.accent,
          fontSize: 15,
          fontWeight: '600',
        },
        card: {
          borderRadius: 14,
          overflow: 'hidden',
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        emptyPress: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        emptyPressPressed: {
          backgroundColor: colors.buttonGhostPressed,
        },
        emptyIcon: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderRadius: 10,
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        emptyCopy: {
          flex: 1,
          minWidth: 0,
        },
        emptyTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        emptyMeta: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        item: {
          alignItems: 'center',
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        itemLast: {
          borderBottomWidth: 0,
        },
        dateTile: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderRadius: 12,
          height: 52,
          justifyContent: 'center',
          width: 46,
        },
        dateTileMonth: {
          color: colors.textMuted,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.6,
        },
        dateTileDay: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.4,
          marginTop: 1,
        },
        itemCopy: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        itemTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        itemMeta: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 3,
        },
        deleteHit: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
      }),
    [colors, isDark],
  );

  function confirmRemove(block, index) {
    const title = String(block?.title ?? '').trim();
    const range = resolveTimeOffDateRange(block);
    const rangeLabel = range ? formatRangeLabel(range.startDate, range.endDate) : 'this time off';
    const label = title || rangeLabel;

    Alert.alert('Remove time off?', `Remove ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => onDeletePress(index),
      },
    ]);
  }

  return (
    <View style={[styles.root, style]}>
      <View style={styles.titleRow}>
        <AppText style={styles.sectionTitle}>Time off</AppText>
        {!isEmpty ? (
          <Pressable
            accessibilityLabel="Add time off"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.addLink}
            onPress={onAddPress}
          >
            <Ionicons color={colors.accent} name="add" size={18} />
            <AppText style={styles.addLinkLabel}>Add</AppText>
          </Pressable>
        ) : null}
      </View>

      <SurfaceCard style={styles.card}>
        {isEmpty ? (
          <Pressable
            accessibilityLabel="Add time off"
            accessibilityRole="button"
            onPress={onAddPress}
          >
            {({ pressed }) => (
              <View style={[styles.emptyPress, pressed ? styles.emptyPressPressed : null]}>
                <View style={styles.emptyIcon}>
                  <Ionicons color={colors.textMuted} name="calendar-outline" size={18} />
                </View>
                <View style={styles.emptyCopy}>
                  <AppText style={styles.emptyTitle}>Add time off</AppText>
                  <AppText style={styles.emptyMeta}>Vacations or closed hours</AppText>
                </View>
                <Ionicons color={colors.accent} name="add" size={22} />
              </View>
            )}
          </Pressable>
        ) : (
          sorted.map((block, sortedIndex) => {
            const originalIndex = (blocks ?? []).indexOf(block);
            const title = String(block?.title ?? '').trim();
            const isLast = sortedIndex === sorted.length - 1;
            const range = resolveTimeOffDateRange(block);
            const startDate = range?.startDate ?? '';
            const endDate = range?.endDate ?? startDate;
            const tile = formatDateTile(startDate);
            const hoursLabel = formatHoursLabel(block);
            const rangeLabel = formatRangeLabel(startDate, endDate);
            const primaryLabel = title || rangeLabel;
            const metaLabel = title ? `${rangeLabel} · ${hoursLabel}` : hoursLabel;
            const deleteIndex = originalIndex >= 0 ? originalIndex : sortedIndex;

            return (
              <View
                key={String(block?.id ?? `${startDate}-${sortedIndex}`)}
                style={[styles.item, isLast ? styles.itemLast : null]}
              >
                <View style={styles.dateTile}>
                  <AppText style={styles.dateTileMonth}>{tile.month}</AppText>
                  <AppText style={styles.dateTileDay}>{tile.day}</AppText>
                </View>
                <View style={styles.itemCopy}>
                  <AppText numberOfLines={1} style={styles.itemTitle}>
                    {primaryLabel}
                  </AppText>
                  <AppText numberOfLines={1} style={styles.itemMeta}>
                    {metaLabel}
                  </AppText>
                </View>
                <Pressable
                  accessibilityLabel="Remove time off"
                  accessibilityRole="button"
                  hitSlop={6}
                  style={styles.deleteHit}
                  onPress={() => confirmRemove(block, deleteIndex)}
                >
                  <Ionicons color={DELETE_ICON} name="trash-outline" size={18} />
                </Pressable>
              </View>
            );
          })
        )}
      </SurfaceCard>
    </View>
  );
}
