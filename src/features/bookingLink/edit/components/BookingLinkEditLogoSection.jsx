import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../../components/ui';

export function BookingLinkEditLogoSection({ styles, colors, logoDisplayUri, onLogoPhotoPress }) {
  return (
    <View style={styles.logoSection}>
      <AppText style={styles.sectionTitle}>Business Logo</AppText>
      <AppText style={styles.sectionBody}>Shown next to your name.</AppText>

      <SurfaceCard outlined padding="sm" style={styles.logoSurfaceCard}>
        <Pressable
          accessibilityHint="Choose or replace your logo"
          accessibilityLabel="Your logo"
          accessibilityRole="button"
          onPress={onLogoPhotoPress}
          style={({ pressed }) => [
            styles.logoCardPressable,
            pressed ? styles.logoCardPressed : null,
          ]}
        >
          <View style={styles.logoCardRow}>
            <View style={styles.logoPreviewWrap}>
              {logoDisplayUri ? (
                <Image source={{ uri: logoDisplayUri }} style={styles.logoPreviewImage} />
              ) : (
                <Ionicons name="business-outline" size={24} color={colors.textMuted} />
              )}
            </View>

            <View style={styles.logoInfo}>
              <AppText style={styles.logoTitle}>Your logo</AppText>
              <AppText style={styles.logoSubtitle}>
                {logoDisplayUri ? 'Tap to change' : 'Tap to add'}
              </AppText>
            </View>

            <View style={styles.logoAction} pointerEvents="none">
              <Ionicons name="cloud-upload-outline" size={18} color={colors.textSecondary} />
            </View>
          </View>
        </Pressable>
      </SurfaceCard>
    </View>
  );
}
