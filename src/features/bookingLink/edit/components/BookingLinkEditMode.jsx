import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOOKING_LINK_EDIT_GALLERY_GAP } from '../constants/galleryLayout';
import {
  BOOKING_LINK_EDIT_DEFAULT_TAB,
  BOOKING_LINK_EDIT_TAB_BOOKING,
  BOOKING_LINK_EDIT_TAB_CONTACT,
  BOOKING_LINK_EDIT_TAB_DETAILS,
  BOOKING_LINK_EDIT_TAB_PHOTOS,
} from '../constants/bookingLinkEditTabs';
import { LocationSuggestionOverlayProvider } from '../../../location/components/LocationSuggestionOverlay';
import { useBookingLinkEditController } from '../hooks/useBookingLinkEditController';
import { createBookingLinkEditStyles } from './bookingLinkEditStyles';
import { BookingLinkEditBookingSection } from './BookingLinkEditBookingSection';
import {
  BookingLinkEditBioSection,
  BookingLinkEditBusinessInfoSection,
} from './BookingLinkEditBusinessInfoSection';
import { BookingLinkEditLocationSection } from './BookingLinkEditLocationSection';
import { BookingLinkEditContactSection } from './BookingLinkEditContactSection';
import { BookingLinkEditCoverSection } from './BookingLinkEditCoverSection';
import { BookingLinkEditFloatingActions } from './BookingLinkEditFloatingActions';
import { BookingLinkEditGallerySection } from './BookingLinkEditGallerySection';
import { BookingLinkEditLogoSection } from './BookingLinkEditLogoSection';
import { BookingLinkEditProfileCompletion } from './BookingLinkEditProfileCompletion';
import { BookingLinkEditProfileCompletionSheet } from './BookingLinkEditProfileCompletionSheet';
import { BookingLinkEditTabs } from './BookingLinkEditTabs';

const FLOATING_ACTIONS_CLEARANCE = 96;

export function BookingLinkEditMode({ initialEditTab = BOOKING_LINK_EDIT_DEFAULT_TAB, ...props }) {
  const ctrl = useBookingLinkEditController(props);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(initialEditTab);
  const [completionSheetVisible, setCompletionSheetVisible] = useState(false);

  const styles = useMemo(
    () => createBookingLinkEditStyles(ctrl.colors, BOOKING_LINK_EDIT_GALLERY_GAP),
    [ctrl.colors],
  );

  const scrollBottomPad = Math.max(insets.bottom, 16) + FLOATING_ACTIONS_CLEARANCE;
  const showCompletionBar = ctrl.profileCompletionPercent < 100;

  return (
    <LocationSuggestionOverlayProvider style={styles.wrap}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[showCompletionBar ? 1 : 0]}
        style={styles.scroll}
      >
        {showCompletionBar ? (
          <View style={styles.scrollTopPad}>
            <BookingLinkEditProfileCompletion
              percent={ctrl.profileCompletionPercent}
              onPress={() => setCompletionSheetVisible(true)}
            />
          </View>
        ) : null}

        <View style={styles.stickyTabsShell}>
          <BookingLinkEditTabs activeTab={activeTab} onChangeTab={setActiveTab} />
        </View>

        <View style={styles.tabPanel}>
          {activeTab === BOOKING_LINK_EDIT_TAB_PHOTOS ? (
            <View>
              <BookingLinkEditCoverSection
                colors={ctrl.colors}
                coverDisplayUri={ctrl.coverDisplayUri}
                styles={styles}
                onCoverPhotoPress={ctrl.onCoverPhotoPress}
              />

              <BookingLinkEditLogoSection
                colors={ctrl.colors}
                logoDisplayUri={ctrl.logoDisplayUri}
                styles={styles}
                onLogoPhotoPress={ctrl.onLogoPhotoPress}
              />

              <BookingLinkEditGallerySection
                canAddGalleryImage={ctrl.canAddGalleryImage}
                colors={ctrl.colors}
                galleryImageCount={ctrl.galleryImageCount}
                galleryMaxImages={ctrl.galleryMaxImages}
                galleryTileStyle={ctrl.galleryTileStyle}
                hasProAccess={ctrl.hasProAccess}
                localGalleryUris={ctrl.localGalleryUris}
                showFreeGalleryLimitHint={ctrl.showFreeGalleryLimitHint}
                styles={styles}
                visiblePortfolioImages={ctrl.visiblePortfolioImages}
                onGalleryAddPress={ctrl.onGalleryAddPress}
                onRemoveLocalGalleryItem={ctrl.removeLocalGalleryItem}
                onRemovePortfolioImage={ctrl.removePortfolioImage}
              />
            </View>
          ) : null}

          {activeTab === BOOKING_LINK_EDIT_TAB_DETAILS ? (
            <View style={styles.locationSection}>
              <BookingLinkEditBusinessInfoSection
                businessTypeOptions={ctrl.businessTypeOptions}
                nameInput={ctrl.nameInput}
                rootStyle={styles.tabPanelFirstSection}
                specialtiesInput={ctrl.specialtiesInput}
                specialtyError={ctrl.specialtyError}
                styles={styles}
                typeInput={ctrl.typeInput}
                onNameInputChange={ctrl.setNameInput}
                onSpecialtiesChange={ctrl.onSpecialtiesChange}
                onTypeInputChange={ctrl.onTypeInputChange}
              />

              <BookingLinkEditLocationSection
                locationError={ctrl.locationError}
                locationInput={ctrl.locationInput}
                radius={ctrl.radiusInput}
                selectedLocation={ctrl.selectedLocation}
                styles={styles}
                onLocationInputChange={ctrl.onLocationInputChange}
                onLocationSelect={ctrl.onLocationSelect}
                onRadiusChange={ctrl.onRadiusChange}
              />

              <BookingLinkEditBioSection
                bioInput={ctrl.bioInput}
                styles={styles}
                onBioInputChange={ctrl.setBioInput}
              />
            </View>
          ) : null}

          {activeTab === BOOKING_LINK_EDIT_TAB_BOOKING ? (
            <BookingLinkEditBookingSection
              defaultLanguage={ctrl.defaultLanguageInput}
              locationError={ctrl.locationError}
              locationInput={ctrl.locationInput}
              policyEnabled={ctrl.policyEnabled}
              policyInput={ctrl.policyInput}
              radiusInput={ctrl.radiusInput}
              rootStyle={styles.tabPanelFirstSection}
              selectedLocation={ctrl.selectedLocation}
              serviceType={ctrl.serviceTypeInput}
              selectedShopLocation={ctrl.selectedShopLocation}
              shopAddressError={ctrl.shopAddressError}
              shopAddressInput={ctrl.shopAddressInput}
              shopUnitInput={ctrl.shopUnitInput}
              spanishEnabled={ctrl.spanishEnabled}
              styles={styles}
              onDefaultLanguageChange={ctrl.setDefaultLanguageInput}
              onLocationInputChange={ctrl.onLocationInputChange}
              onLocationSelect={ctrl.onLocationSelect}
              onPolicyEnabledChange={ctrl.setPolicyEnabled}
              onPolicyInputChange={ctrl.onPolicyInputChange}
              onRadiusChange={ctrl.onRadiusChange}
              onServiceTypeChange={ctrl.setServiceTypeInput}
              onShopAddressInputChange={ctrl.onShopAddressInputChange}
              onShopAddressSelect={ctrl.onShopAddressSelect}
              onShopUnitInputChange={ctrl.setShopUnitInput}
              onSpanishEnabledChange={ctrl.onSpanishEnabledChange}
            />
          ) : null}

          {activeTab === BOOKING_LINK_EDIT_TAB_CONTACT ? (
            <BookingLinkEditContactSection
              instagramInput={ctrl.instagramInput}
              phoneInput={ctrl.phoneInput}
              phoneInputError={ctrl.phoneInputError}
              rootStyle={styles.tabPanelFirstSection}
              styles={styles}
              tiktokInput={ctrl.tiktokInput}
              onInstagramInputChange={ctrl.onInstagramInputChange}
              onPhoneInputChange={ctrl.onPhoneInputChange}
              onTiktokInputChange={ctrl.onTiktokInputChange}
            />
          ) : null}
        </View>
      </ScrollView>

      <BookingLinkEditFloatingActions
        canSave={ctrl.canSave}
        colors={ctrl.colors}
        isSaving={ctrl.isSaving}
        previewOutlineColor={ctrl.previewOutlineColor}
        onDoneEditing={ctrl.onDoneEditing}
        onSave={ctrl.handleSave}
      />

      <BookingLinkEditProfileCompletionSheet
        items={ctrl.profileCompletionItems}
        percent={ctrl.profileCompletionPercent}
        visible={showCompletionBar && completionSheetVisible}
        onRequestClose={() => setCompletionSheetVisible(false)}
      />
    </LocationSuggestionOverlayProvider>
  );
}
