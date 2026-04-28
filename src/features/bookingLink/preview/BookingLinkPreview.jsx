import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme';
import { BioTabContent } from './components/BioTabContent';
import { BookingLinkTabs } from './components/BookingLinkTabs';
import { BookingProfileHeader } from './components/BookingProfileHeader';
import { EditProfileFab } from './components/EditProfileFab';
import { GalleryTabContent } from './components/GalleryTabContent';
import { ServicesTabContent } from './components/ServicesTabContent';

/**
 * Read-only booking-link profile: header, tabs, tab panels, and edit FAB.
 * Edit flow lives in {@link ../edit/components/BookingLinkEditMode}.
 */
export function BookingLinkPreview({
  activeTab,
  onChangeTab,
  /** TanStack-style flags + optional `error` for the services tab. */
  queryState,
  onRefresh,
  coverHeight,
  businessName,
  businessType,
  location,
  phoneNumber,
  coverImageUrl,
  logoUrl,
  showVerifiedBadge,
  services,
  galleryImages,
  bio,
  onPressEdit,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scrollContent: {
          paddingBottom: 28,
        },
      }),
    [colors],
  );

  const refreshing = queryState.isFetching && !queryState.isLoading;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.root}
      >
        <BookingProfileHeader
          businessName={businessName}
          businessType={businessType}
          coverHeight={coverHeight}
          coverImageUrl={coverImageUrl}
          isLoading={false}
          location={location}
          logoUrl={logoUrl}
          phoneNumber={phoneNumber}
          showVerifiedBadge={showVerifiedBadge}
        />
        <BookingLinkTabs activeTab={activeTab} onChangeTab={onChangeTab} />
        {activeTab === 'services' ? (
          <ServicesTabContent error={queryState.error} isLoading={false} services={services} />
        ) : null}
        {activeTab === 'gallery' ? <GalleryTabContent images={galleryImages} /> : null}
        {activeTab === 'bio' ? <BioTabContent bio={bio} /> : null}
      </ScrollView>
      <EditProfileFab onPress={onPressEdit} />
    </>
  );
}
