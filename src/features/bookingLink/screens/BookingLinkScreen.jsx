import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useAuth } from '../../auth';
import { useTheme } from '../../../theme';
import { markProfileWelcomeModalSeen } from '../api/bookingLink';
import { BookingLinkEditMode } from '../edit';
import { useBookingLinkProfile } from '../hooks/useBookingLinkProfile';
import { BookingLinkWelcomeModal } from '../components/BookingLinkWelcomeModal';
import { BookingLinkEditFab } from '../preview/components/BookingLinkEditFab';
import { BookingLinkPreview } from '../preview/BookingLinkPreview';
import { BookingLinkScreenSkeleton } from '../preview/components/BookingLinkScreenSkeleton';
import { bookingLinkOwnerProfileQueryKey } from '../queryKeys';
import { mapServicesForCards } from '../utils/bookingLinkModel';
import { splitServiceAreaCityState } from '../utils/serviceArea';
import { useSubscription } from '../../subscription';

export function BookingLinkScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const bookingProfile = useBookingLinkProfile();
  const { profile, refetch: refetchBookingProfile } = bookingProfile;
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();
  const coverHeight = width >= 768 ? 256 : width >= 640 ? 224 : 192;
  const [activeTab, setActiveTab] = useState('services');
  const [isEditMode, setIsEditMode] = useState(false);

  const welcomeSeenMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await markProfileWelcomeModalSeen(userId);
      if (error) throw error;
    },
    onMutate: async () => {
      if (!userId) return {};
      await queryClient.cancelQueries({ queryKey: bookingLinkOwnerProfileQueryKey(userId) });
      const previous = queryClient.getQueryData(bookingLinkOwnerProfileQueryKey(userId));
      queryClient.setQueryData(bookingLinkOwnerProfileQueryKey(userId), (old) => {
        if (!old || typeof old !== 'object') return old;
        return { ...old, profileWelcomeModalSeen: true };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (!userId || context?.previous == null) return;
      queryClient.setQueryData(bookingLinkOwnerProfileQueryKey(userId), context.previous);
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: bookingLinkOwnerProfileQueryKey(userId) });
    },
  });

  /** `profiles.profile_welcome_modal_seen` → `profile.profileWelcomeModalSeen` (true = hide modal). */
  const bookingWelcomeVisible = Boolean(profile?.id && profile.profileWelcomeModalSeen !== true);
  const services = useMemo(() => mapServicesForCards(profile?.services), [profile?.services]);
  const galleryImages = useMemo(
    () => (profile?.images ?? []).filter((image) => Boolean(image?.preview_url)),
    [profile?.images],
  );
  const businessNameDisplay = profile?.business_name?.trim() || 'Business Name';
  const businessTypeDisplay = profile?.business_type?.trim() || 'Business type';
  const businessNameEdit = profile?.business_name?.trim() ?? '';
  const businessTypeEdit = profile?.business_type?.trim() ?? '';
  const serviceAreaTrimmed = profile?.service_area?.trim() ?? '';
  const location = serviceAreaTrimmed.length > 0 ? serviceAreaTrimmed : null;
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
        /** Same idea as home: `flex:1` wrapper so the FAB’s absolute position is relative to this layer. */
        previewLayer: {
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

  const handleWelcomeDismiss = useCallback(() => {
    if (!userId) return;
    welcomeSeenMutation.mutate();
  }, [userId, welcomeSeenMutation]);

  /** Tabs keep this screen mounted — refetch so `profiles.profile_welcome_modal_seen` matches DB when you return. */
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      void refetchBookingProfile();
    }, [userId, refetchBookingProfile]),
  );

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
          hasProAccess={hasProAccess}
          isOwnerProfileLoaded={isOwnerProfileLoaded}
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
        <View style={styles.previewLayer}>
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
            onRefresh={refetchBookingProfile}
            phoneNumber={phoneNumber}
            queryState={bookingProfile}
            services={services}
            showVerifiedBadge={profile?.showVerifiedBadge ?? false}
          />
          <BookingLinkEditFab bottom={30} onPress={() => setIsEditMode(true)} />
        </View>
      )}
      {!isEditMode ? (
        <BookingLinkWelcomeModal visible={bookingWelcomeVisible} onDismiss={handleWelcomeDismiss} />
      ) : null}
    </View>
  );
}
