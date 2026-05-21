import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SkeletonBox } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { phoneForSmsUri } from '../../../../utils/phone';
import { bookingLinkProfileBusinessNameStyle } from '../../../../utils/serviceCardTypography';
import { resolveBookingProfileCtaVisibility } from '../utils/profileCtaVisibility';
import { BookingLinkRequestQuoteOwnerHintSheet } from './BookingLinkRequestQuoteOwnerHintSheet';

const CTA_BUTTON_HEIGHT = 42;
const CTA_BORDER_RADIUS = 10;
/** Shared 1px stroke so filled + outline CTAs share the same outer box (outline no longer reads smaller). */
const CTA_BORDER_WIDTH = 1;
const CONTACT_ICON_BUTTON_SIZE = CTA_BUTTON_HEIGHT;
/** Paired quote pill width beside the square phone button (~20% narrower than full flex). */
const REQUEST_QUOTE_PAIRED_MAX_WIDTH_RATIO = '62%';

export function BookingProfileHeader({
  coverHeight,
  coverImageUrl,
  logoUrl,
  showVerifiedBadge,
  businessName,
  businessType,
  location,
  phoneNumber,
  showRequestQuoteCta = false,
  isLoading,
}) {
  const { colors } = useTheme();
  const [quoteOwnerHintVisible, setQuoteOwnerHintVisible] = useState(false);

  const { showContact, showRequestQuote, showCtaRow } = useMemo(
    () =>
      resolveBookingProfileCtaVisibility({
        phoneNumber,
        showRequestQuoteCta,
      }),
    [phoneNumber, showRequestQuoteCta],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        heroImage: {
          backgroundColor: colors.shellElevated,
          height: coverHeight,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        },
        heroPhotoFallback: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          justifyContent: 'center',
        },
        /** Nudge empty-state icon slightly above true center (reads better in the hero band). */
        heroPhotoFallbackIcon: {
          marginTop: -Math.min(28, Math.round(coverHeight * 0.12)),
        },
        heroFade: {
          bottom: 0,
          height: 128,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
        },
        profileBlock: {
          alignItems: 'center',
          marginTop: -64,
          paddingHorizontal: 24,
          position: 'relative',
          zIndex: 10,
        },
        logoWrap: {
          marginBottom: 24,
          position: 'relative',
        },
        logoFrame: {
          backgroundColor: colors.borderStrong,
          borderRadius: 45,
          padding: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.32,
          shadowRadius: 16,
        },
        logo: {
          alignItems: 'center',
          backgroundColor: colors.border,
          borderColor: colors.shell,
          borderRadius: 38,
          borderWidth: 4,
          height: 128,
          justifyContent: 'center',
          width: 128,
        },
        logoImage: {
          borderColor: colors.shell,
          borderRadius: 38,
          borderWidth: 4,
          height: 128,
          width: 128,
        },
        verifiedBadge: {
          alignItems: 'center',
          backgroundColor: colors.shell,
          borderColor: colors.borderStrong,
          borderRadius: 12,
          borderWidth: 2,
          bottom: -2,
          height: 32,
          justifyContent: 'center',
          position: 'absolute',
          right: -2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          width: 32,
        },
        businessNameWrap: {
          maxWidth: 672,
          paddingHorizontal: 8,
          width: '100%',
        },
        businessName: {
          ...bookingLinkProfileBusinessNameStyle(colors),
          textAlign: 'center',
        },
        businessType: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 2.6,
          marginTop: 8,
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        locationRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          marginTop: 16,
        },
        locationText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        ctaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginTop: 20,
          maxWidth: 672,
          width: '100%',
        },
        ctaRowPaired: {
          justifyContent: 'center',
        },
        ctaRowSolo: {
          justifyContent: 'center',
        },
        requestQuoteButton: {
          alignItems: 'center',
          backgroundColor: colors.buttonPrimaryBg,
          borderColor: colors.buttonPrimaryBg,
          borderRadius: CTA_BORDER_RADIUS,
          borderWidth: CTA_BORDER_WIDTH,
          justifyContent: 'center',
          paddingHorizontal: 16,
        },
        requestQuoteButtonPaired: {
          flexGrow: 0,
          flexShrink: 1,
          height: CTA_BUTTON_HEIGHT,
          maxWidth: REQUEST_QUOTE_PAIRED_MAX_WIDTH_RATIO,
          width: REQUEST_QUOTE_PAIRED_MAX_WIDTH_RATIO,
        },
        requestQuoteButtonSolo: {
          height: CTA_BUTTON_HEIGHT,
          width: '100%',
        },
        requestQuoteButtonText: {
          color: colors.buttonPrimaryText,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 18,
        },
        contactIconButton: {
          alignItems: 'center',
          backgroundColor: colors.shell,
          borderColor: 'rgba(255,255,255,0.2)',
          borderRadius: CTA_BORDER_RADIUS,
          borderWidth: CTA_BORDER_WIDTH,
          flexShrink: 0,
          height: CONTACT_ICON_BUTTON_SIZE,
          justifyContent: 'center',
          width: CONTACT_ICON_BUTTON_SIZE,
        },
        contactSoloButton: {
          alignItems: 'center',
          backgroundColor: colors.shell,
          borderColor: 'rgba(255,255,255,0.2)',
          borderRadius: CTA_BORDER_RADIUS,
          borderWidth: CTA_BORDER_WIDTH,
          flexDirection: 'row',
          height: CTA_BUTTON_HEIGHT,
          justifyContent: 'center',
          minWidth: 132,
          paddingHorizontal: 14,
        },
        contactSoloButtonText: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          marginLeft: 6,
        },
      }),
    [colors, coverHeight],
  );

  async function handleCall() {
    if (!phoneNumber) return;
    const e164 = phoneForSmsUri(phoneNumber);
    if (!e164) return;
    const telUrl = `tel:${e164}`;
    const canOpen = await Linking.canOpenURL(telUrl);
    if (canOpen) {
      await Linking.openURL(telUrl);
    }
  }

  function handleRequestQuote() {
    setQuoteOwnerHintVisible(true);
  }

  return (
    <>
      <BookingLinkRequestQuoteOwnerHintSheet
        visible={quoteOwnerHintVisible}
        onRequestClose={() => setQuoteOwnerHintVisible(false)}
      />
      <View style={styles.heroImage}>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={styles.heroPhotoFallback}>
            <View style={styles.heroPhotoFallbackIcon}>
              <Ionicons name="image-outline" size={40} color={colors.textMuted} />
            </View>
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0)', colors.shell]}
          locations={[0, 1]}
          style={styles.heroFade}
        />
      </View>

      <View style={styles.profileBlock}>
        <View style={styles.logoWrap}>
          <View style={styles.logoFrame}>
            <View style={styles.logo}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              ) : (
                <Ionicons name="business-outline" size={38} color={colors.textMuted} />
              )}
            </View>
          </View>
          {showVerifiedBadge ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#60a5fa" />
            </View>
          ) : null}
        </View>

        <View style={styles.businessNameWrap}>
          {isLoading ? (
            <SkeletonBox borderRadius={8} height={28} pulse width="64%" />
          ) : (
            <AppText style={styles.businessName}>{businessName}</AppText>
          )}
        </View>
        <AppText style={styles.businessType}>{businessType}</AppText>
        {location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <AppText style={styles.locationText}>{location}</AppText>
          </View>
        ) : null}

        {showCtaRow ? (
          <View
            style={[
              styles.ctaRow,
              showRequestQuote && showContact ? styles.ctaRowPaired : styles.ctaRowSolo,
            ]}
          >
            {showRequestQuote ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Request quote"
                style={[
                  styles.requestQuoteButton,
                  showContact ? styles.requestQuoteButtonPaired : styles.requestQuoteButtonSolo,
                ]}
                onPress={handleRequestQuote}
              >
                <AppText numberOfLines={1} style={styles.requestQuoteButtonText}>
                  Request Quote
                </AppText>
              </Pressable>
            ) : null}
            {showContact ? (
              showRequestQuote ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Call business"
                  style={styles.contactIconButton}
                  onPress={() => void handleCall()}
                >
                  <Ionicons color={colors.textSecondary} name="call-outline" size={20} />
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Call business"
                  style={styles.contactSoloButton}
                  onPress={() => void handleCall()}
                >
                  <Ionicons color={colors.textSecondary} name="call-outline" size={16} />
                  <AppText style={styles.contactSoloButtonText}>Contact</AppText>
                </Pressable>
              )
            ) : null}
          </View>
        ) : null}
      </View>
    </>
  );
}
