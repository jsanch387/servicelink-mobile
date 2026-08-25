import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { formatActivityMetaLine } from '../utils/buildBookingActivityModel';

const WELL = 36;
const ROW_GAP = 44;
const CHANNEL_ICON = {
  email: 'mail',
  text: 'chatbubble',
};

function outcomeCopy(event) {
  if (event.outcome === 'failed') {
    return "Didn't send";
  }
  if (event.outcome === 'sending') {
    return 'Sending';
  }
  return 'Sent';
}

function metaCopy(event) {
  return formatActivityMetaLine(event.channel, event.whenLabel ?? '', {
    optedOut: event.optedOut,
  });
}

/**
 * Action row: icon for what we sent, channel + time, and whether it went through.
 *
 * @param {object} props
 * @param {import('../constants/bookingActivityEvents').BookingActivityEvent} props.event
 * @param {boolean} [props.isLast]
 */
export function BookingActivityEventRow({ event, isLast = false }) {
  const { colors, isDark } = useTheme();
  const failed = event.outcome === 'failed';
  const sending = event.outcome === 'sending';
  const outcomeColor = failed ? colors.danger : sending ? colors.textMuted : colors.moneyPositive;
  const iconColor = failed ? colors.danger : '#ffffff';
  const meta = metaCopy(event);
  const channelIcon = CHANNEL_ICON[event.channel] ?? CHANNEL_ICON.text;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: {
          width: '100%',
        },
        head: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        railWrap: {
          alignItems: 'center',
          height: ROW_GAP,
          width: WELL,
        },
        iconWell: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.62)',
          borderColor: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.80)',
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          height: WELL,
          justifyContent: 'center',
          width: WELL,
        },
        rail: {
          backgroundColor: colors.border,
          flex: 1,
          marginVertical: 8,
          width: 2,
        },
        body: {
          flex: 1,
          minWidth: 0,
          paddingLeft: 16,
        },
        top: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
        },
        titleCol: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.3,
          lineHeight: 21,
        },
        metaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
          marginTop: 4,
        },
        channelMark: {
          alignItems: 'center',
          height: 16,
          justifyContent: 'center',
          width: 16,
        },
        metaCopy: {
          flex: 1,
          minWidth: 0,
        },
        when: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          lineHeight: 18,
        },
        outcomeCol: {
          flexShrink: 0,
        },
        outcome: {
          color: outcomeColor,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          letterSpacing: -0.1,
          lineHeight: 18,
        },
      }),
    [colors, isDark, outcomeColor],
  );

  return (
    <View
      accessibilityLabel={`${event.title}. ${meta}. ${event.statusLine}`}
      accessible
      style={styles.block}
    >
      <View style={styles.head}>
        <View style={styles.iconWell}>
          <Ionicons color={iconColor} name={event.icon} size={20} />
        </View>
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={styles.titleCol}>
              <AppText numberOfLines={1} style={styles.title}>
                {event.title}
              </AppText>
              {meta ? (
                <View style={styles.metaRow}>
                  <View style={styles.channelMark}>
                    <Ionicons color={colors.textMuted} name={channelIcon} size={12} />
                  </View>
                  <View style={styles.metaCopy}>
                    <AppText numberOfLines={2} style={styles.when}>
                      {meta}
                    </AppText>
                  </View>
                </View>
              ) : null}
            </View>
            <View style={styles.outcomeCol}>
              <AppText style={styles.outcome}>{outcomeCopy(event)}</AppText>
            </View>
          </View>
        </View>
      </View>
      {isLast ? null : (
        <View style={styles.railWrap}>
          <View style={styles.rail} />
        </View>
      )}
    </View>
  );
}
