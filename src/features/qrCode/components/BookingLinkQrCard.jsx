import { forwardRef, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../../theme';
import { BOOKING_LINK_QR } from '../constants/bookingLinkQr';

/**
 * White printable QR tile. Ref targets the capture surface (stays white for flyers).
 *
 * @param {{ value: string }} props
 */
export const BookingLinkQrCard = forwardRef(function BookingLinkQrCard({ value }, ref) {
  const { colors, isDark } = useTheme();
  const frameInner = BOOKING_LINK_QR.displaySize + BOOKING_LINK_QR.displayPadding * 2;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        captureSurface: {
          alignItems: 'center',
          backgroundColor: BOOKING_LINK_QR.backgroundColor,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
          borderRadius: 20,
          borderWidth: 1,
          justifyContent: 'center',
          padding: BOOKING_LINK_QR.displayPadding,
          ...(!isDark
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.08,
                shadowRadius: 20,
                elevation: 3,
              }
            : null),
        },
      }),
    [colors, isDark],
  );

  return (
    <View
      ref={ref}
      accessibilityLabel="Booking link QR code"
      accessibilityRole="image"
      collapsable={false}
      style={[styles.captureSurface, { height: frameInner, width: frameInner }]}
    >
      <QRCode
        backgroundColor={BOOKING_LINK_QR.backgroundColor}
        color={BOOKING_LINK_QR.foregroundColor}
        ecl={BOOKING_LINK_QR.ecl}
        size={BOOKING_LINK_QR.displaySize}
        value={value}
      />
    </View>
  );
});

export function BookingLinkQrCardLoading() {
  const { colors } = useTheme();
  const frameInner = BOOKING_LINK_QR.displaySize + BOOKING_LINK_QR.displayPadding * 2;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        frame: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 20,
          borderWidth: 1,
          height: frameInner,
          justifyContent: 'center',
          width: frameInner,
        },
      }),
    [colors, frameInner],
  );

  return (
    <View accessibilityLabel="Loading QR code" style={styles.frame}>
      <ActivityIndicator color={colors.textMuted} />
    </View>
  );
}
