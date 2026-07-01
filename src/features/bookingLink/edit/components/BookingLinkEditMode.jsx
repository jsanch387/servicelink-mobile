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
import { useBookingLinkEditController } from '../hooks/useBookingLinkEditController';
import { createBookingLinkEditStyles } from './bookingLinkEditStyles';
import { BookingLinkEditBookingSection } from './BookingLinkEditBookingSection';
import { BookingLinkEditBusinessInfoSection } from './BookingLinkEditBusinessInfoSection';
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

  return (
    <View style={styles.wrap}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        style={styles.scroll}
      >
        <View style={styles.scrollTopPad}>
          <BookingLinkEditProfileCompletion
            percent={ctrl.profileCompletionPercent}
            onPress={() => setCompletionSheetVisible(true)}
          />
        </View>

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
            <BookingLinkEditBusinessInfoSection
              bioInput={ctrl.bioInput}
              businessTypeOptions={ctrl.businessTypeOptions}
              cityInput={ctrl.cityInput}
              nameInput={ctrl.nameInput}
              rootStyle={styles.tabPanelFirstSection}
              stateInput={ctrl.stateInput}
              styles={styles}
              typeInput={ctrl.typeInput}
              zipInput={ctrl.zipInput}
              onBioInputChange={ctrl.setBioInput}
              onCityInputChange={ctrl.setCityInput}
              onNameInputChange={ctrl.setNameInput}
              onStateInputChange={ctrl.onStateInputChange}
              onTypeInputChange={ctrl.setTypeInput}
              onZipInputChange={ctrl.onZipInputChange}
            />
          ) : null}

          {activeTab === BOOKING_LINK_EDIT_TAB_BOOKING ? (
            <BookingLinkEditBookingSection
              cityInput={ctrl.cityInput}
              defaultLanguage={ctrl.defaultLanguageInput}
              rootStyle={styles.tabPanelFirstSection}
              serviceType={ctrl.serviceTypeInput}
              shopStreetInput={ctrl.shopStreetInput}
              shopUnitInput={ctrl.shopUnitInput}
              spanishEnabled={ctrl.spanishEnabled}
              stateInput={ctrl.stateInput}
              styles={styles}
              zipInput={ctrl.zipInput}
              onCityInputChange={ctrl.setCityInput}
              onDefaultLanguageChange={ctrl.setDefaultLanguageInput}
              onGoToDetailsTab={() => setActiveTab(BOOKING_LINK_EDIT_TAB_DETAILS)}
              onServiceTypeChange={ctrl.setServiceTypeInput}
              onShopStreetInputChange={ctrl.setShopStreetInput}
              onShopUnitInputChange={ctrl.setShopUnitInput}
              onSpanishEnabledChange={ctrl.onSpanishEnabledChange}
              onStateInputChange={ctrl.onStateInputChange}
              onZipInputChange={ctrl.onZipInputChange}
            />
          ) : null}

          {activeTab === BOOKING_LINK_EDIT_TAB_CONTACT ? (
            <BookingLinkEditContactSection
              phoneInput={ctrl.phoneInput}
              phoneInputError={ctrl.phoneInputError}
              rootStyle={styles.tabPanelFirstSection}
              styles={styles}
              onPhoneInputChange={ctrl.onPhoneInputChange}
            />
          ) : null}
        </View>
      </ScrollView>

      <BookingLinkEditFloatingActions
        canSave={ctrl.canSave}
        colors={ctrl.colors}
        isSaving={ctrl.saveMutation.isPending}
        previewOutlineColor={ctrl.previewOutlineColor}
        onDoneEditing={ctrl.onDoneEditing}
        onSave={ctrl.handleSave}
      />

      <BookingLinkEditProfileCompletionSheet
        items={ctrl.profileCompletionItems}
        percent={ctrl.profileCompletionPercent}
        visible={completionSheetVisible}
        onRequestClose={() => setCompletionSheetVisible(false)}
      />
    </View>
  );
}
