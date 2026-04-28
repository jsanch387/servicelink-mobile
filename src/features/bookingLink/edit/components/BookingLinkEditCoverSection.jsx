import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../../components/ui';

export function BookingLinkEditCoverSection({
  styles,
  colors,
  coverDisplayUri,
  onCoverPhotoPress,
}) {
  return (
    <>
      <AppText style={styles.sectionTitle}>Cover photo</AppText>
      <AppText style={styles.sectionBody}>Add a cover photo.</AppText>

      <SurfaceCard outlined padding="none" style={styles.coverSurfaceWrap}>
        <Pressable
          accessibilityHint="Choose an existing photo or take a new one"
          accessibilityLabel="Choose cover photo"
          accessibilityRole="button"
          onPress={onCoverPhotoPress}
          style={({ pressed }) => [
            styles.coverInnerPressable,
            pressed ? styles.coverCardPressed : null,
          ]}
        >
          {coverDisplayUri ? (
            <Image resizeMode="cover" source={{ uri: coverDisplayUri }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverFallback]}>
              <Ionicons name="image-outline" size={38} color={colors.textMuted} />
              <AppText style={styles.coverFallbackHint}>Tap to choose</AppText>
            </View>
          )}

          <View style={styles.coverCta} pointerEvents="none">
            <Ionicons name="image-outline" size={17} color="#ffffff" />
            <AppText style={styles.coverCtaText}>Choose photo</AppText>
          </View>

          <View style={styles.coverCamera} pointerEvents="none">
            <Ionicons name="camera-outline" size={18} color="#ffffff" />
          </View>
        </Pressable>
      </SurfaceCard>
    </>
  );
}
