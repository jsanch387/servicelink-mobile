import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, View } from 'react-native';
import { AppText, DashedBorderFrame } from '../../../../components/ui';
import { portfolioImageKey } from '../../utils/portfolio';

export function BookingLinkEditGallerySection({
  styles,
  colors,
  onGalleryAddPress,
  visiblePortfolioImages,
  localGalleryUris,
  onRemovePortfolioImage,
  onRemoveLocalGalleryItem,
  galleryTileStyle,
}) {
  return (
    <View style={styles.gallerySection}>
      <AppText style={styles.sectionTitle}>Gallery</AppText>
      <AppText style={styles.sectionBody}>Add images so customers can see your work.</AppText>

      <DashedBorderFrame
        borderRadius={20}
        dashGap={[8, 6]}
        strokeColor={colors.border}
        strokeWidth={2}
        style={styles.galleryAddPhotoOuter}
      >
        <Pressable
          accessibilityHint="Choose an existing photo or take a new one"
          accessibilityLabel="Add gallery photo"
          accessibilityRole="button"
          onPress={onGalleryAddPress}
          style={({ pressed }) => [
            styles.galleryAddPhotoPressable,
            pressed ? styles.galleryAddPhotoAreaPressed : null,
          ]}
        >
          <View style={styles.galleryAddStack}>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
            <AppText style={styles.addPhotoTitle}>Add photo</AppText>
            <AppText style={styles.addPhotoSubtitle}>Select photos to add to your gallery.</AppText>
          </View>
        </Pressable>
      </DashedBorderFrame>

      <AppText style={styles.portfolioHeading}>Your portfolio</AppText>
      <AppText style={styles.portfolioSub}>Tap X to remove.</AppText>

      {visiblePortfolioImages.length || localGalleryUris.length ? (
        <View style={styles.portfolioGrid}>
          {visiblePortfolioImages.map((image) => (
            <View
              key={portfolioImageKey(image)}
              style={[styles.portfolioTileWrap, galleryTileStyle]}
            >
              <Image source={{ uri: image.preview_url }} style={styles.portfolioTileImage} />
              <Pressable
                accessibilityLabel="Remove photo"
                hitSlop={10}
                style={styles.portfolioRemove}
                onPress={() => onRemovePortfolioImage(image)}
              >
                <Ionicons name="close" size={15} color="#ffffff" />
              </Pressable>
            </View>
          ))}
          {localGalleryUris.map((item) => (
            <View key={item.id} style={[styles.portfolioTileWrap, galleryTileStyle]}>
              <Image source={{ uri: item.uri }} style={styles.portfolioTileImage} />
              <Pressable
                accessibilityLabel="Remove photo"
                hitSlop={10}
                style={styles.portfolioRemove}
                onPress={() => onRemoveLocalGalleryItem(item.id)}
              >
                <Ionicons name="close" size={15} color="#ffffff" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <AppText style={styles.portfolioEmpty}>No photos in your portfolio yet.</AppText>
      )}
    </View>
  );
}
