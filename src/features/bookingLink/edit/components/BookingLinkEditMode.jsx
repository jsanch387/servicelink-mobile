import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { BOOKING_LINK_EDIT_GALLERY_GAP } from '../constants/galleryLayout';
import { useBookingLinkEditController } from '../hooks/useBookingLinkEditController';
import { createBookingLinkEditStyles } from './bookingLinkEditStyles';
import { BookingLinkEditBusinessInfoSection } from './BookingLinkEditBusinessInfoSection';
import { BookingLinkEditContactSection } from './BookingLinkEditContactSection';
import { BookingLinkEditCoverSection } from './BookingLinkEditCoverSection';
import { BookingLinkEditGallerySection } from './BookingLinkEditGallerySection';
import { BookingLinkEditLogoSection } from './BookingLinkEditLogoSection';
import { BookingLinkEditStickyActions } from './BookingLinkEditStickyActions';

export function BookingLinkEditMode(props) {
  const ctrl = useBookingLinkEditController(props);
  const styles = useMemo(
    () => createBookingLinkEditStyles(ctrl.colors, BOOKING_LINK_EDIT_GALLERY_GAP),
    [ctrl.colors],
  );

  return (
    <View style={styles.wrap}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <BookingLinkEditStickyActions
          canSave={ctrl.canSave}
          colors={ctrl.colors}
          isSaving={ctrl.saveMutation.isPending}
          previewOutlineColor={ctrl.previewOutlineColor}
          styles={styles}
          onPreview={ctrl.onPreview}
          onSave={ctrl.handleSave}
        />

        <View>
          <BookingLinkEditCoverSection
            colors={ctrl.colors}
            coverDisplayUri={ctrl.coverDisplayUri}
            styles={styles}
            onCoverPhotoPress={ctrl.onCoverPhotoPress}
          />
          <View style={styles.divider} />

          <BookingLinkEditLogoSection
            colors={ctrl.colors}
            logoDisplayUri={ctrl.logoDisplayUri}
            styles={styles}
            onLogoPhotoPress={ctrl.onLogoPhotoPress}
          />
          <View style={styles.divider} />

          <BookingLinkEditBusinessInfoSection
            bioInput={ctrl.bioInput}
            businessTypeOptions={ctrl.businessTypeOptions}
            cityInput={ctrl.cityInput}
            nameInput={ctrl.nameInput}
            stateInput={ctrl.stateInput}
            styles={styles}
            typeInput={ctrl.typeInput}
            onBioInputChange={ctrl.setBioInput}
            onCityInputChange={ctrl.setCityInput}
            onNameInputChange={ctrl.setNameInput}
            onStateInputChange={ctrl.onStateInputChange}
            onTypeInputChange={ctrl.setTypeInput}
          />
          <View style={styles.divider} />

          <BookingLinkEditContactSection
            phoneInput={ctrl.phoneInput}
            styles={styles}
            onPhoneInputChange={ctrl.onPhoneInputChange}
          />
          <View style={styles.divider} />

          <BookingLinkEditGallerySection
            canAddGalleryImage={ctrl.canAddGalleryImage}
            colors={ctrl.colors}
            galleryImageCount={ctrl.galleryImageCount}
            galleryMaxImages={ctrl.galleryMaxImages}
            galleryTileStyle={ctrl.galleryTileStyle}
            localGalleryUris={ctrl.localGalleryUris}
            styles={styles}
            visiblePortfolioImages={ctrl.visiblePortfolioImages}
            onGalleryAddPress={ctrl.onGalleryAddPress}
            onRemoveLocalGalleryItem={ctrl.removeLocalGalleryItem}
            onRemovePortfolioImage={ctrl.removePortfolioImage}
          />
        </View>
      </ScrollView>
    </View>
  );
}
