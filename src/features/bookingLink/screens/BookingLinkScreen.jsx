import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  InteractionManager,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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
import { BOOKING_LINK_DEFAULT_TAB } from '../constants/bookingLinkPreviewTabs';
import { mapServicesForCards } from '../utils/bookingLinkModel';
import { buildServiceCategoriesFromRows } from '../../services/categories/utils/buildServiceCategoriesModel';
import { normalizeBusinessZip, splitServiceAreaCityState } from '../utils/serviceArea';
import { formatBookingServiceAreaLabel } from '../edit/utils/formatBookingServiceAreaLabel';
import {
  dbModeToUiServiceType,
  languagesFromProfile,
  normalizeDbServiceLocationMode,
} from '../utils/bookingLinkBookingSettings';
import { useSubscription } from '../../subscription';
import { BOOKING_LINK_ROUTE_PARAMS } from '../constants/bookingLinkRouteParams';
import {
  BOOKING_LINK_EDIT_DEFAULT_TAB,
  BOOKING_LINK_EDIT_TABS,
} from '../edit/constants/bookingLinkEditTabs';

const VALID_EDIT_TABS = new Set(BOOKING_LINK_EDIT_TABS.map((tab) => tab.key));

export function BookingLinkScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const bookingProfile = useBookingLinkProfile();
  const { profile, refetch: refetchBookingProfile } = bookingProfile;
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();
  const coverHeight = width >= 768 ? 256 : width >= 640 ? 224 : 192;
  const [activeTab, setActiveTab] = useState(BOOKING_LINK_DEFAULT_TAB);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialEditTab, setInitialEditTab] = useState(BOOKING_LINK_EDIT_DEFAULT_TAB);
  /** Set from feature-announcement deep link; edit opens after profile loads. */
  const [pendingEditOpen, setPendingEditOpen] = useState(
    /** @type {{ editTab: string } | null} */ (null),
  );

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
  const [welcomeAfterTransition, setWelcomeAfterTransition] = useState(false);

  useEffect(() => {
    if (!bookingWelcomeVisible) {
      setWelcomeAfterTransition(false);
      return undefined;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      setWelcomeAfterTransition(true);
    });
    return () => {
      if (typeof task?.cancel === 'function') {
        task.cancel();
      }
    };
  }, [bookingWelcomeVisible]);

  const services = useMemo(() => mapServicesForCards(profile?.services), [profile?.services]);
  const serviceCategories = useMemo(
    () => buildServiceCategoriesFromRows(profile?.serviceCategories),
    [profile?.serviceCategories],
  );
  const galleryImages = useMemo(
    () => (profile?.images ?? []).filter((image) => Boolean(image?.preview_url)),
    [profile?.images],
  );
  const businessNameDisplay = profile?.business_name?.trim() || 'Business Name';
  const businessTypeDisplay = profile?.business_type?.trim() || '';
  const businessNameEdit = profile?.business_name?.trim() ?? '';
  const businessTypeEdit = profile?.business_type?.trim() ?? '';
  const serviceAreaTrimmed = profile?.service_area?.trim() ?? '';
  const [city, state] = splitServiceAreaCityState(profile?.service_area);
  const zip = normalizeBusinessZip(profile?.business_zip);
  const location =
    formatBookingServiceAreaLabel(city, state, zip) ||
    (serviceAreaTrimmed.length > 0 ? serviceAreaTrimmed : null);
  const bio = profile?.bio?.trim() || '';
  const bookingLanguages = useMemo(() => languagesFromProfile(profile ?? {}), [profile]);
  const phoneNumber = profile?.phone_number_call?.trim() || '';
  const showRequestQuoteCta = profile?.showRequestQuoteCta ?? false;
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
    setInitialEditTab(BOOKING_LINK_EDIT_DEFAULT_TAB);
  }, [refetchBookingProfile]);

  const handleEditBack = useCallback(() => {
    setIsEditMode(false);
    setInitialEditTab(BOOKING_LINK_EDIT_DEFAULT_TAB);
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

  /** Feature announcements — queue edit mode until booking profile has loaded. */
  useFocusEffect(
    useCallback(() => {
      const params = route.params ?? {};
      const openEdit = params[BOOKING_LINK_ROUTE_PARAMS.OPEN_EDIT];
      if (!openEdit) {
        return;
      }

      const editTab = params[BOOKING_LINK_ROUTE_PARAMS.EDIT_TAB];
      setPendingEditOpen({
        editTab:
          typeof editTab === 'string' && VALID_EDIT_TABS.has(editTab)
            ? editTab
            : BOOKING_LINK_EDIT_DEFAULT_TAB,
      });
      navigation.setParams({
        [BOOKING_LINK_ROUTE_PARAMS.OPEN_EDIT]: undefined,
        [BOOKING_LINK_ROUTE_PARAMS.EDIT_TAB]: undefined,
      });
    }, [navigation, route.params]),
  );

  useEffect(() => {
    if (!pendingEditOpen) {
      return;
    }
    if (bookingProfile.isLoading) {
      return;
    }
    if (!profile?.id) {
      setPendingEditOpen(null);
      return;
    }

    setInitialEditTab(pendingEditOpen.editTab);
    setIsEditMode(true);
    setPendingEditOpen(null);
  }, [pendingEditOpen, bookingProfile.isLoading, profile?.id]);

  const showEditMode = isEditMode && Boolean(profile?.id) && !bookingProfile.isLoading;
  const showLoadingSkeleton = bookingProfile.isLoading || Boolean(pendingEditOpen);

  return (
    <View style={styles.container}>
      {showEditMode ? (
        <BookingLinkEditMode
          key={profile.id}
          businessBio={bio}
          businessCity={city}
          businessId={profile?.id}
          businessName={businessNameEdit}
          businessState={state}
          businessType={businessTypeEdit}
          businessZip={zip}
          coverImageUrl={coverImageUrl}
          coverImagePath={coverImagePath}
          defaultLanguage={bookingLanguages.defaultLocale}
          hasProAccess={hasProAccess}
          initialEditTab={initialEditTab}
          isOwnerProfileLoaded={isOwnerProfileLoaded}
          logoUrl={logoUrl}
          logoPath={logoPath}
          phoneNumber={phoneNumber}
          portfolioImages={galleryImages}
          publicBookingLocales={bookingLanguages.locales}
          serviceLocationMode={normalizeDbServiceLocationMode(profile?.service_location_mode)}
          shopStreetAddress={profile?.shop_street_address ?? ''}
          shopUnit={profile?.shop_unit ?? ''}
          spanishEnabled={bookingLanguages.offerSpanish}
          serviceType={dbModeToUiServiceType(profile?.service_location_mode)}
          onBack={handleEditBack}
          onSaved={handleEditSaved}
        />
      ) : showLoadingSkeleton ? (
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
            businessId={profile?.id}
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
            serviceCategories={serviceCategories}
            services={services}
            showRequestQuoteCta={showRequestQuoteCta}
            showVerifiedBadge={profile?.showVerifiedBadge ?? false}
          />
          <BookingLinkEditFab
            bottom={30}
            onPress={() => {
              setInitialEditTab(BOOKING_LINK_EDIT_DEFAULT_TAB);
              setIsEditMode(true);
            }}
          />
        </View>
      )}
      {!showEditMode ? (
        <BookingLinkWelcomeModal
          visible={bookingWelcomeVisible && welcomeAfterTransition}
          onDismiss={handleWelcomeDismiss}
        />
      ) : null}
    </View>
  );
}
