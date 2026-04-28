import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../../theme';
import { BookingLinkEditMode } from '../edit';
import { useBookingLinkProfile } from '../hooks/useBookingLinkProfile';
import { BookingLinkPreview } from '../preview/BookingLinkPreview';
import { BookingLinkScreenSkeleton } from '../preview/components/BookingLinkScreenSkeleton';
import { mapServicesForCards } from '../utils/bookingLinkModel';
import { splitServiceAreaCityState } from '../utils/serviceArea';

export function BookingLinkScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const bookingProfile = useBookingLinkProfile();
  const { profile, refetch: refetchBookingProfile } = bookingProfile;
  const coverHeight = width >= 768 ? 256 : width >= 640 ? 224 : 192;
  const [activeTab, setActiveTab] = useState('services');
  const [isEditMode, setIsEditMode] = useState(false);
  const services = useMemo(() => mapServicesForCards(profile?.services), [profile?.services]);
  const galleryImages = useMemo(
    () => (profile?.images ?? []).filter((image) => Boolean(image?.preview_url)),
    [profile?.images],
  );
  const businessNameDisplay = profile?.business_name?.trim() || 'Business Name';
  const businessTypeDisplay = profile?.business_type?.trim() || 'Business type';
  const businessNameEdit = profile?.business_name?.trim() ?? '';
  const businessTypeEdit = profile?.business_type?.trim() ?? '';
  const location = profile?.service_area?.trim() || 'Service area';
  const bio = profile?.bio?.trim() || '';
  const [city, state] = splitServiceAreaCityState(profile?.service_area);
  const phoneNumber = profile?.phone_number_call?.trim() || '';
  const coverImageUrl = profile?.cover_image_url || null;
  const logoUrl = profile?.logo_url || null;
  const coverImagePath = profile?.banner_path || null;
  const logoPath = profile?.logo_path || null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.shell,
          flex: 1,
        },
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

  const handleEditSaved = useCallback(async () => {
    await refetchBookingProfile();
    setIsEditMode(false);
  }, [refetchBookingProfile]);

  const handleEditBack = useCallback(() => {
    setIsEditMode(false);
  }, []);

  return (
    <View style={styles.container}>
      {isEditMode ? (
        <BookingLinkEditMode
          businessBio={bio}
          businessCity={city}
          businessId={profile?.id}
          businessName={businessNameEdit}
          businessState={state}
          businessType={businessTypeEdit}
          coverImageUrl={coverImageUrl}
          coverImagePath={coverImagePath}
          logoUrl={logoUrl}
          logoPath={logoPath}
          phoneNumber={phoneNumber}
          portfolioImages={galleryImages}
          onBack={handleEditBack}
          onSaved={handleEditSaved}
        />
      ) : bookingProfile.isLoading ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.root}
        >
          <BookingLinkScreenSkeleton coverHeight={coverHeight} />
        </ScrollView>
      ) : (
        <BookingLinkPreview
          activeTab={activeTab}
          bio={bio}
          businessName={businessNameDisplay}
          businessType={businessTypeDisplay}
          coverHeight={coverHeight}
          coverImageUrl={coverImageUrl}
          galleryImages={galleryImages}
          location={location}
          logoUrl={logoUrl}
          onChangeTab={setActiveTab}
          onPressEdit={() => setIsEditMode(true)}
          onRefresh={refetchBookingProfile}
          phoneNumber={phoneNumber}
          queryState={bookingProfile}
          services={services}
          showVerifiedBadge={profile?.showVerifiedBadge ?? false}
        />
      )}
    </View>
  );
}
