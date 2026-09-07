import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, FrostedIconWell } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { formatActivityChannelLabel } from '../utils/buildBookingActivityModel';

const WELL = 30;
const ROW_PAD_H = 16;
const ICON_GAP = 12;
const RAIL_H = 34;
const CARD_PAD_V = 18;

function outcomeCopy(event) {
  if (event.outcome === 'failed') {
    return "Didn't send";
  }
  if (event.outcome === 'sending') {
    return 'Sending';
  }
  return 'Sent';
}

function channelCopy(event) {
  const channel = formatActivityChannelLabel(event.channel);
  if (event.optedOut) {
    return `${channel} · opted out`;
  }
  return channel;
}

/**
 * Card row: type + status, then channel + time. Icons connect on a timeline.
 *
 * @param {object} props
 * @param {import('../constants/bookingActivityEvents').BookingActivityEvent} props.event
 * @param {boolean} [props.isFirst]
 * @param {boolean} [props.isLast]
 */
export function BookingActivityEventRow({ event, isFirst = false, isLast = false }) {
  const { colors } = useTheme();
  const failed = event.outcome === 'failed';
  const sending = event.outcome === 'sending';
  const outcomeColor = failed ? colors.danger : sending ? colors.textMuted : colors.moneyPositive;
  const iconColor = failed ? colors.danger : '#ffffff';
  const channel = channelCopy(event);
  const when = String(event.whenLabel ?? '').trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingBottom: isLast ? CARD_PAD_V : 0,
          paddingHorizontal: ROW_PAD_H,
          paddingTop: isFirst ? CARD_PAD_V : 0,
          width: '100%',
        },
        iconCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: WELL,
        },
        body: {
          flex: 1,
          minWidth: 0,
          paddingLeft: ICON_GAP,
        },
        top: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        titleCol: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.1,
          lineHeight: 16,
        },
        outcomeCol: {
          flexShrink: 0,
          marginLeft: 12,
        },
        outcome: {
          color: outcomeColor,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.1,
          lineHeight: 16,
        },
        meta: {
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: 5,
          width: '100%',
        },
        channelCol: {
          flex: 1,
          minWidth: 0,
        },
        whenCol: {
          flexShrink: 0,
          marginLeft: 12,
        },
        metaText: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          lineHeight: 16,
        },
        whenText: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 11,
          lineHeight: 14,
          textAlign: 'right',
        },
        railWrap: {
          alignItems: 'center',
          height: RAIL_H,
          marginLeft: ROW_PAD_H,
          width: WELL,
        },
        rail: {
          backgroundColor: colors.border,
          flex: 1,
          width: 2,
        },
      }),
    [colors, isFirst, isLast, outcomeColor],
  );

  return (
    <View
      accessibilityLabel={`${event.title}. ${channel}. ${event.statusLine}`}
      accessible
      style={styles.root}
    >
      <View style={styles.row}>
        <View style={styles.iconCol}>
          <FrostedIconWell color={iconColor} icon={event.icon} iconSize={16} size={WELL} />
        </View>
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={styles.titleCol}>
              <AppText numberOfLines={1} style={styles.title}>
                {event.title}
              </AppText>
            </View>
            <View style={styles.outcomeCol}>
              <AppText style={styles.outcome}>{outcomeCopy(event)}</AppText>
            </View>
          </View>
          <View style={styles.meta}>
            <View style={styles.channelCol}>
              <AppText numberOfLines={1} style={styles.metaText}>
                {channel}
              </AppText>
            </View>
            {when ? (
              <View style={styles.whenCol}>
                <AppText numberOfLines={1} style={styles.whenText}>
                  {when}
                </AppText>
              </View>
            ) : null}
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
