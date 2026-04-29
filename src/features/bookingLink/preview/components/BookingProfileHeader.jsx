import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SkeletonBox } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { phoneForSmsUri } from '../../../../utils/phone';
import { bookingLinkProfileBusinessNameStyle } from '../../../../utils/serviceCardTypography';

export function BookingProfileHeader({
  coverHeight,
  coverImageUrl,
  logoUrl,
  showVerifiedBadge,
  businessName,
  businessType,
  location,
  phoneNumber,
  isLoading,
}) {
  const { colors } = useTheme();

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
        contactButton: {
          alignItems: 'center',
          borderColor: 'rgba(255,255,255,0.2)',
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 20,
          minHeight: 42,
          minWidth: 148,
          paddingHorizontal: 16,
        },
        contactButtonText: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '600',
          marginLeft: 8,
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

  return (
    <>
      <View style={styles.heroImage}>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={styles.heroPhotoFallback}>
            <Ionicons name="image-outline" size={40} color={colors.textMuted} />
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
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <AppText style={styles.locationText}>{location}</AppText>
        </View>

        <Pressable
          disabled={!phoneNumber}
          style={styles.contactButton}
          onPress={() => void handleCall()}
        >
          <Ionicons name="call-outline" size={17} color={colors.textSecondary} />
          <AppText style={styles.contactButtonText}>Contact</AppText>
        </Pressable>
      </View>
    </>
  );
}
