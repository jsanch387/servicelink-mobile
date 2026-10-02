import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SkeletonBox } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { phoneForSmsUri } from '../../../../utils/phone';
import { REVIEW_STAR_COLOR } from '../../../reviews/constants';
import { bookingLinkProfileBusinessNameStyle } from '../../../../utils/serviceCardTypography';
import { socialMediaFromDb, socialMediaPublicUrl } from '../../utils/socialMedia';
import { resolveBookingProfileCtaVisibility } from '../utils/profileCtaVisibility';
import { BookingLinkRequestQuoteOwnerHintSheet } from './BookingLinkRequestQuoteOwnerHintSheet';

const COVER_DOT_SIZE = 1.5;
const COVER_DOT_STEP = 14;
const COVER_DOT_OPACITY = 0.08;

function buildCoverDotGrid(width, height) {
  if (width <= 0 || height <= 0) return [];
  const cols = Math.max(2, Math.round(width / COVER_DOT_STEP));
  const rows = Math.max(2, Math.round(height / COVER_DOT_STEP));
  const stepX = width / (cols - 1);
  const stepY = height / (rows - 1);
  const dots = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      dots.push({
        key: `${row}-${col}`,
        left: col * stepX - COVER_DOT_SIZE / 2,
        top: row * stepY - COVER_DOT_SIZE / 2,
      });
    }
  }
  return dots;
}

function CoverEmptyDotField({ color }) {
  const [bounds, setBounds] = useState(null);
  const dots = useMemo(
    () => (bounds ? buildCoverDotGrid(bounds.width, bounds.height) : []),
    [bounds],
  );

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setBounds((current) =>
          current && current.width === width && current.height === height
            ? current
            : { width, height },
        );
      }}
    >
      {dots.map((dot) => (
        <View
          key={dot.key}
          style={{
            backgroundColor: color,
            borderRadius: COVER_DOT_SIZE / 2,
            height: COVER_DOT_SIZE,
            left: dot.left,
            opacity: COVER_DOT_OPACITY,
            position: 'absolute',
            top: dot.top,
            width: COVER_DOT_SIZE,
          }}
        />
      ))}
    </View>
  );
}

const CTA_BUTTON_HEIGHT = 36;
const CTA_BORDER_RADIUS = 10;
/** Shared 1px stroke so filled + outline CTAs share the same outer box (outline no longer reads smaller). */
const CTA_BORDER_WIDTH = 1;
const CONTACT_ICON_BUTTON_SIZE = CTA_BUTTON_HEIGHT;

export function BookingProfileHeader({
  coverHeight,
  coverImageUrl,
  logoUrl,
  showVerifiedBadge,
  businessName,
  location,
  averageRating = null,
  phoneNumber,
  showRequestQuoteCta = false,
  socialMedia = null,
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

  const socialLinks = useMemo(() => {
    const handles = socialMediaFromDb(socialMedia);
    return [
      {
        key: 'instagram',
        icon: 'logo-instagram',
        label: 'Instagram',
        url: socialMediaPublicUrl('instagram', handles.instagram),
      },
      {
        key: 'tiktok',
        icon: 'logo-tiktok',
        label: 'TikTok',
        url: socialMediaPublicUrl('tiktok', handles.tiktok),
      },
    ].filter((item) => Boolean(item.url));
  }, [socialMedia]);

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
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          justifyContent: 'flex-start',
          paddingTop: 30,
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
          marginTop: -80,
          paddingHorizontal: 20,
          position: 'relative',
          zIndex: 10,
        },
        logoWrap: {
          marginBottom: 12,
          position: 'relative',
        },
        logoFrame: {
          backgroundColor: colors.borderStrong,
          borderRadius: 34,
          padding: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 12,
        },
        logo: {
          alignItems: 'center',
          backgroundColor: colors.border,
          borderColor: colors.shell,
          borderRadius: 30,
          borderWidth: 3,
          height: 96,
          justifyContent: 'center',
          width: 96,
        },
        logoImage: {
          borderColor: colors.shell,
          borderRadius: 30,
          borderWidth: 3,
          height: 96,
          width: 96,
        },
        verifiedBadge: {
          alignItems: 'center',
          backgroundColor: colors.shell,
          borderColor: colors.borderStrong,
          borderRadius: 10,
          borderWidth: 2,
          bottom: -1,
          height: 26,
          justifyContent: 'center',
          position: 'absolute',
          right: -1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.28,
          shadowRadius: 6,
          width: 26,
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
        locationRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          marginTop: 4,
        },
        locationText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: 0.1,
        },
        socialRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'center',
          marginTop: 12,
        },
        socialRowAfterCta: {
          marginTop: 16,
        },
        socialButton: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 999,
          borderWidth: 1,
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        ratingRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 4,
          justifyContent: 'center',
          marginTop: 10,
        },
        ratingText: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        ctaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginTop: 16,
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
        },
        requestQuoteButtonPaired: {
          flexGrow: 0,
          flexShrink: 0,
          height: CTA_BUTTON_HEIGHT,
          paddingHorizontal: 28,
        },
        requestQuoteButtonSolo: {
          height: CTA_BUTTON_HEIGHT,
          paddingHorizontal: 28,
        },
        requestQuoteButtonText: {
          color: colors.buttonPrimaryText,
          fontSize: 13,
          fontWeight: '600',
          lineHeight: 16,
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
          <View style={[StyleSheet.absoluteFill, styles.heroPhotoFallback]}>
            <CoverEmptyDotField color={colors.text} />
            <Ionicons name="image-outline" size={32} color={colors.textMuted} />
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
                <Ionicons name="business-outline" size={30} color={colors.textMuted} />
              )}
            </View>
          </View>
          {showVerifiedBadge ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#60a5fa" />
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
        {location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <AppText style={styles.locationText}>{location}</AppText>
          </View>
        ) : null}

        {averageRating != null ? (
          <View style={styles.ratingRow}>
            <Ionicons color={REVIEW_STAR_COLOR} name="star" size={15} />
            <AppText style={styles.ratingText}>{averageRating.toFixed(1)}</AppText>
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
                  <Ionicons color={colors.textSecondary} name="call-outline" size={18} />
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

        {socialLinks.length > 0 ? (
          <View style={[styles.socialRow, showCtaRow ? styles.socialRowAfterCta : null]}>
            {socialLinks.map((item) => (
              <Pressable
                key={item.key}
                accessibilityLabel={`Open ${item.label}`}
                accessibilityRole="link"
                hitSlop={8}
                style={styles.socialButton}
                onPress={() => {
                  void Linking.openURL(item.url);
                }}
              >
                <Ionicons color={colors.text} name={item.icon} size={18} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </>
  );
}
