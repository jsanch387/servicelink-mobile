import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Linking, Pressable, View } from 'react-native';
import { AppText, DashedBorderFrame } from '../../../../components/ui';
import { getWebAccountAdminUrl } from '../../../../lib/webAppOrigin';
import { portfolioImageKey } from '../../utils/portfolio';
import { bookingLinkGalleryAccessCopy } from '../constants/galleryAccessCopy';

export function BookingLinkEditGallerySection({
  styles,
  colors,
  canAddGalleryImage,
  galleryImageCount,
  galleryMaxImages,
  hasProAccess,
  onGalleryAddPress,
  visiblePortfolioImages,
  localGalleryUris,
  onRemovePortfolioImage,
  onRemoveLocalGalleryItem,
  galleryTileStyle,
  showFreeGalleryLimitHint,
}) {
  const addDisabled = !canAddGalleryImage;
  const hasGalleryImages = visiblePortfolioImages.length + localGalleryUris.length > 0;
  const limitCopy = bookingLinkGalleryAccessCopy();

  const addPhotoSubtitle = addDisabled
    ? hasProAccess
      ? `You already have ${galleryMaxImages} photos. Remove one to add another.`
      : limitCopy.addFullSubtitle
    : `${galleryImageCount} of ${galleryMaxImages} used — select photos to add to your gallery.`;

  return (
    <View style={styles.gallerySection}>
      <AppText style={styles.sectionTitle}>Gallery</AppText>
      <AppText style={styles.sectionBody}>
        Add up to {galleryMaxImages} images so customers can see your work.
      </AppText>

      {showFreeGalleryLimitHint ? (
        <View
          style={[
            styles.freeTierGalleryHint,
            {
              backgroundColor: colors.shellElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons color={colors.textMuted} name="information-circle-outline" size={18} />
          <AppText style={[styles.freeTierGalleryHintText, { color: colors.textMuted }]}>
            {limitCopy.inlineHint}{' '}
            <Pressable
              accessibilityRole="link"
              hitSlop={6}
              onPress={() => {
                void Linking.openURL(getWebAccountAdminUrl());
              }}
            >
              <AppText style={styles.freeTierGalleryHintLink}>{limitCopy.inlineHintAction}</AppText>
            </Pressable>
          </AppText>
        </View>
      ) : null}

      <DashedBorderFrame
        borderRadius={20}
        dashGap={[8, 6]}
        strokeColor={colors.border}
        strokeWidth={2}
        style={[styles.galleryAddPhotoOuter, addDisabled && { opacity: 0.5 }]}
      >
        <Pressable
          accessibilityHint={
            addDisabled
              ? `Remove photos to add more (maximum ${galleryMaxImages}).`
              : 'Choose an existing photo or take a new one'
          }
          accessibilityLabel="Add gallery photo"
          accessibilityRole="button"
          accessibilityState={{ disabled: addDisabled }}
          disabled={addDisabled}
          onPress={onGalleryAddPress}
          style={({ pressed }) => [
            styles.galleryAddPhotoPressable,
            !addDisabled && pressed ? styles.galleryAddPhotoAreaPressed : null,
          ]}
        >
          <View style={styles.galleryAddStack}>
            <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
            <AppText style={styles.addPhotoTitle}>
              {addDisabled ? 'Gallery full' : 'Add photo'}
            </AppText>
            <AppText style={styles.addPhotoSubtitle}>{addPhotoSubtitle}</AppText>
          </View>
        </Pressable>
      </DashedBorderFrame>

      {hasGalleryImages ? (
        <>
          <AppText style={styles.galleryImagesHeading}>Your gallery</AppText>
          <View style={styles.portfolioGrid}>
            {visiblePortfolioImages.map((image) => (
              <View
                key={portfolioImageKey(image)}
                style={[styles.portfolioTileWrap, galleryTileStyle]}
              >
                <Image source={{ uri: image.preview_url }} style={styles.portfolioTileImage} />
                <Pressable
                  accessibilityHint="Removes this image from your gallery"
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
                  accessibilityHint="Removes this image from your gallery"
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
        </>
      ) : null}
    </View>
  );
}
