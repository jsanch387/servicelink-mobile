import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Button } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { BookingLinkQrCard, BookingLinkQrCardLoading } from '../components/BookingLinkQrCard';
import { useQrCodeBookingLink } from '../hooks/useQrCodeBookingLink';
import {
  captureBookingLinkQr,
  saveBookingLinkQrToLibrary,
  shareBookingLinkQr,
} from '../utils/captureBookingLinkQr';

/**
 * Booking-link QR — encode public URL, share / save PNG for flyers.
 */
export function QrCodeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  // ~30% lower than the previous resting spot (still clear of the tab bar).
  const bottomPad = 14 + Math.round(Math.max(tabBarHeight, 72) * 0.65);
  const qrRef = useRef(null);
  const [busy, setBusy] = useState(/** @type {null | 'share' | 'save'} */ (null));

  const {
    businessName,
    bookingLinkDisplay,
    bookingLinkUrl,
    isLoading,
    isError,
    errorMessage,
    refetch,
  } = useQrCodeBookingLink();

  const hasLink = Boolean(bookingLinkUrl);
  const canExport = hasLink && busy == null;
  const showHeader = Boolean(businessName || bookingLinkDisplay);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          paddingBottom: bottomPad,
          paddingHorizontal: SCREEN_GUTTER,
        },
        stage: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          width: '100%',
        },
        qrBlock: {
          alignItems: 'center',
          gap: 18,
          width: '100%',
        },
        header: {
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          width: '100%',
        },
        businessName: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.35,
          textAlign: 'center',
        },
        bookingUrl: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          textAlign: 'center',
        },
        emptyBlock: {
          alignItems: 'center',
          gap: 10,
          maxWidth: 300,
          paddingHorizontal: 12,
        },
        emptyTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.25,
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 8,
          textAlign: 'center',
        },
        actions: {
          gap: 12,
          width: '100%',
        },
      }),
    [bottomPad, colors],
  );

  const runCapture = useCallback(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    return captureBookingLinkQr(qrRef);
  }, []);

  const handleShare = useCallback(async () => {
    if (!canExport) return;
    setBusy('share');
    try {
      const uri = await runCapture();
      await shareBookingLinkQr(uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      Alert.alert('Could not share', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }, [canExport, runCapture]);

  const handleSave = useCallback(async () => {
    if (!canExport) return;
    setBusy('save');
    try {
      const uri = await runCapture();
      await saveBookingLinkQrToLibrary(uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Saved', 'QR code saved to your photo library.');
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }, [canExport, runCapture]);

  let stageContent = null;
  if (isLoading) {
    stageContent = <BookingLinkQrCardLoading />;
  } else if (isError) {
    stageContent = (
      <View style={styles.emptyBlock}>
        <Ionicons color={colors.textMuted} name="warning-outline" size={32} />
        <AppText style={styles.emptyTitle}>Couldn’t load QR code</AppText>
        <AppText style={styles.emptyBody}>{errorMessage}</AppText>
        <Button title="Try again" variant="secondary" onPress={() => void refetch()} />
      </View>
    );
  } else if (hasLink) {
    stageContent = (
      <View style={styles.qrBlock}>
        {showHeader ? (
          <View style={styles.header}>
            {businessName ? (
              <AppText numberOfLines={2} style={styles.businessName}>
                {businessName}
              </AppText>
            ) : null}
            {bookingLinkDisplay ? (
              <AppText numberOfLines={1} style={styles.bookingUrl}>
                {bookingLinkDisplay}
              </AppText>
            ) : null}
          </View>
        ) : null}
        <BookingLinkQrCard ref={qrRef} value={bookingLinkUrl} />
      </View>
    );
  } else {
    stageContent = (
      <View style={styles.emptyBlock}>
        <Ionicons color={colors.textMuted} name="link-outline" size={32} />
        <AppText style={styles.emptyTitle}>Set up your booking link</AppText>
        <AppText style={styles.emptyBody}>
          Add a booking link path first — your QR code will point customers there.
        </AppText>
        <Button
          title="Open booking link"
          variant="secondary"
          onPress={() => navigation.navigate(ROUTES.BOOKING_LINK)}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.stage}>{stageContent}</View>

      <View style={styles.actions}>
        <Button
          accessibilityLabel="Share QR code"
          disabled={!canExport}
          fullWidth
          iconName="share-outline"
          loading={busy === 'share'}
          title="Share"
          onPress={() => {
            void handleShare();
          }}
        />
        <Button
          accessibilityLabel="Save QR code"
          disabled={!canExport}
          fullWidth
          iconName="download-outline"
          loading={busy === 'save'}
          title="Save"
          variant="secondary"
          onPress={() => {
            void handleSave();
          }}
        />
      </View>
    </View>
  );
}
