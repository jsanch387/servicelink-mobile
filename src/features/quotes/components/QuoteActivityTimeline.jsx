import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

const RAIL_WIDTH = 16;
const DOT = 8;

/**
 * Simple activity timeline — title + time, connected by a rail.
 * `tone: 'danger'` marks an entry that needs attention (a failed send).
 *
 * @param {object} props
 * @param {Array<{ key: string; title: string; detail?: string; tone?: 'danger' }>} props.events
 */
export function QuoteActivityTimeline({ events }) {
  const { colors } = useTheme();
  const items = Array.isArray(events) ? events.filter((event) => event?.title) : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          paddingTop: 2,
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
        },
        railCol: {
          alignItems: 'center',
          width: RAIL_WIDTH,
        },
        dot: {
          borderRadius: DOT / 2,
          height: DOT,
          marginTop: 5,
          width: DOT,
        },
        rail: {
          backgroundColor: colors.border,
          flex: 1,
          marginTop: 6,
          minHeight: 18,
          width: 1.5,
        },
        body: {
          flex: 1,
          minWidth: 0,
          paddingBottom: 18,
          paddingLeft: 12,
        },
        bodyLast: {
          paddingBottom: 2,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          letterSpacing: -0.2,
          lineHeight: 19,
        },
        detail: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          letterSpacing: -0.05,
          lineHeight: 16,
          marginTop: 2,
        },
      }),
    [colors],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Activity">
      <View accessibilityLabel="Quote activity" style={styles.list}>
        {items.map((event, index) => {
          const isLast = index === items.length - 1;
          const isDanger = event.tone === 'danger';
          const dotColor = isDanger ? colors.danger : isLast ? colors.text : colors.textMuted;
          return (
            <View key={event.key} style={styles.row}>
              <View style={styles.railCol}>
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                {isLast ? null : <View style={styles.rail} />}
              </View>
              <View style={[styles.body, isLast ? styles.bodyLast : null]}>
                <AppText style={[styles.title, isDanger ? { color: colors.danger } : null]}>
                  {event.title}
                </AppText>
                {event.detail ? <AppText style={styles.detail}>{event.detail}</AppText> : null}
              </View>
            </View>
          );
        })}
      </View>
    </DetailsSectionCard>
  );
}
