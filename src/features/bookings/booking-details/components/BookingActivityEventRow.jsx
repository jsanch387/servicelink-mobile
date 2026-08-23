import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

const ICON_SIZE = 32;

/**
 * One customer-update row on booking Activity.
 *
 * @param {object} props
 * @param {import('../constants/bookingActivityEvents').BookingActivityEvent} props.event
 * @param {boolean} [props.showDivider]
 */
export function BookingActivityEventRow({ event, showDivider = true }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 52,
          paddingHorizontal: 16,
          paddingVertical: 11,
          width: '100%',
        },
        iconWell: {
          alignItems: 'center',
          backgroundColor: event.iconBg,
          borderRadius: ICON_SIZE / 2,
          height: ICON_SIZE,
          justifyContent: 'center',
          marginRight: 12,
          width: ICON_SIZE,
        },
        titleCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: event.comingSoon ? colors.textMuted : colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.15,
        },
        statusCol: {
          flexShrink: 0,
          marginLeft: 12,
          maxWidth: '42%',
        },
        status: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          textAlign: 'right',
        },
        dividerRow: {
          paddingLeft: 16 + ICON_SIZE + 12,
          paddingRight: 16,
        },
        hairline: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          opacity: 0.55,
        },
      }),
    [colors, event.comingSoon, event.iconBg],
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.iconWell}>
          <Ionicons color={event.iconColor} name={event.icon} size={16} />
        </View>
        <View style={styles.titleCol}>
          <AppText numberOfLines={1} style={styles.title}>
            {event.title}
          </AppText>
        </View>
        <View style={styles.statusCol}>
          <AppText numberOfLines={2} style={styles.status}>
            {event.status}
          </AppText>
        </View>
      </View>
      {showDivider ? (
        <View style={styles.dividerRow}>
          <View style={styles.hairline} />
        </View>
      ) : null}
    </View>
  );
}
