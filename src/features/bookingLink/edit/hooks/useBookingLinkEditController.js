import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import { useAuth } from '../../../auth';
import { useTheme } from '../../../../theme';
import {
  buildServiceAreaPayload,
  DEFAULT_SERVICE_AREA_RADIUS,
  fetchPrimaryServiceArea,
  formatLocationDisplay,
  normalizeServiceAreaRadius,
  primaryServiceAreaQueryKey,
  resolveLegacyServiceLocation,
  saveUserLocation,
  useLocationPrompt,
} from '../../../location';
import { formatBookingServiceAreaLabel } from '../utils/formatBookingServiceAreaLabel';
import {
  formatPhoneForDisplay,
  formatPhoneInputAsYouType,
  getPhoneInputValidationMessage,
} from '../../../../utils/phone';
import { safeUserFacingMessage } from '../../../../utils/safeUserFacingMessage';
import {
  sanitizeBusinessSpecialties,
  specialtiesAllowedForBusinessType,
  resolveBusinessSpecialties,
  SPECIALTIES_REQUIRED_ERROR,
} from '../../../../constants/businessSpecialties';
import { getBusinessTypeSelectOptions } from '../../../../constants/businessTypes';
import {
  BOOKING_LINK_EDIT_GALLERY_COLUMNS,
  BOOKING_LINK_EDIT_GALLERY_GAP,
  BOOKING_LINK_GALLERY_MAX_IMAGES_FREE,
  getBookingLinkGalleryMaxImages,
} from '../constants/galleryLayout';
import { bookingLinkGalleryAccessCopy } from '../constants/galleryAccessCopy';
import { showWebAccountFeatureAlert } from '../../../subscription';
import { useSaveBookingLinkText } from '../../hooks/useSaveBookingLinkText';
import { shopAddressPromptQueryKey } from '../../queryKeys';
import { validateBookingLinkEditFields } from '../../utils/bookingLinkEditValidation';
import {
  buildSaveBookingLinkTextVariables,
  bookingLinkEditDirtyVsProps,
} from '../../utils/bookingLinkTextSave';
import { buildProfileCompletionChecklist } from '../utils/profileCompletionChecklist';
import {
  BOOKING_DEFAULT_LANGUAGE_EN,
  BOOKING_SERVICE_TYPE_MOBILE,
} from '../constants/bookingLinkBookingTab';
import { buildSavedShopLocation, formatShopAddressLabel } from '../../utils/shopAddressLocation';
import {
  pickCoverPhotoUri,
  pickGalleryPhotoUri,
  pickLogoPhotoUri,
} from '../../utils/pickProfileImage';
import { portfolioImageKey } from '../../utils/portfolio';
import { portfolioRowStoragePath } from '../../utils/storagePath';
import { normalizeSocialHandle, socialMediaFromDb } from '../../utils/socialMedia';
import { normalizeBookingPolicyText } from '../constants/bookingLinkCustomerPolicy';

export function useBookingLinkEditController({
  onBack,
  onSaved,
  businessId,
  coverImageUrl,
  coverImagePath,
  logoUrl,
  logoPath,
  businessName,
  businessType,
  businessCity,
  businessState,
  businessZip,
  businessBio,
  phoneNumber,
  socialMedia,
  serviceType: initialServiceType = BOOKING_SERVICE_TYPE_MOBILE,
  serviceLocationMode,
  shopStreetAddress,
  shopUnit,
  shopCity,
  shopState,
  shopZip,
  spanishEnabled: initialSpanishEnabled = false,
  defaultLanguage: initialDefaultLanguage = BOOKING_DEFAULT_LANGUAGE_EN,
  publicBookingLocales,
  bookingPolicyEnabled: initialBookingPolicyEnabled = false,
  bookingPolicyText: initialBookingPolicyText = '',
  specialties: initialSpecialties = null,
  portfolioImages = [],
  hasProAccess = false,
  isOwnerProfileLoaded = false,
}) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { recheckPromptStatus } = useLocationPrompt();

  const portfolioTilePx = useMemo(() => {
    const horizontalPad = 32;
    const contentWidth = Math.max(0, windowWidth - horizontalPad);
    const totalGaps = BOOKING_LINK_EDIT_GALLERY_GAP * (BOOKING_LINK_EDIT_GALLERY_COLUMNS - 1);
    return Math.max(88, Math.floor((contentWidth - totalGaps) / BOOKING_LINK_EDIT_GALLERY_COLUMNS));
  }, [windowWidth]);

  const galleryTileStyle = useMemo(
    () => ({ width: portfolioTilePx, height: portfolioTilePx }),
    [portfolioTilePx],
  );

  const previewOutlineColor = isDark ? colors.borderStrong : colors.cardBorder;

  const [nameInput, setNameInput] = useState(() => String(businessName ?? ''));
  const [typeInput, setTypeInput] = useState(() => String(businessType ?? ''));
  const [specialtiesInput, setSpecialtiesInput] = useState(() =>
    resolveBusinessSpecialties(businessType, initialSpecialties),
  );
  const [cityInput, setCityInput] = useState(() => String(businessCity ?? ''));
  const [stateInput, setStateInput] = useState(() =>
    String(businessState ?? '')
      .replace(/[^a-z]/gi, '')
      .slice(0, 2)
      .toUpperCase(),
  );
  const [zipInput, setZipInput] = useState(() =>
    String(businessZip ?? '')
      .replace(/\D/g, '')
      .slice(0, 5),
  );
  const [locationInput, setLocationInput] = useState(
    () => formatBookingServiceAreaLabel(businessCity, businessState, businessZip) ?? '',
  );
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [radiusInput, setRadiusInput] = useState(DEFAULT_SERVICE_AREA_RADIUS);
  const [locationHydrated, setLocationHydrated] = useState(false);
  const [isSavingServiceArea, setIsSavingServiceArea] = useState(false);
  const locationTouchedRef = useRef(false);
  const [bioInput, setBioInput] = useState(() => String(businessBio ?? ''));
  const [phoneInput, setPhoneInput] = useState(() => formatPhoneForDisplay(phoneNumber));
  const [instagramInput, setInstagramInput] = useState(
    () => socialMediaFromDb(socialMedia).instagram,
  );
  const [tiktokInput, setTiktokInput] = useState(() => socialMediaFromDb(socialMedia).tiktok);
  const [serviceTypeInput, setServiceTypeInput] = useState(() => initialServiceType);
  const [shopStreetInput, setShopStreetInput] = useState(() => String(shopStreetAddress ?? ''));
  const [shopCityInput, setShopCityInput] = useState(() => String(shopCity ?? ''));
  const [shopStateInput, setShopStateInput] = useState(() =>
    String(shopState ?? '')
      .replace(/[^a-z]/gi, '')
      .slice(0, 2)
      .toUpperCase(),
  );
  const [shopZipInput, setShopZipInput] = useState(() =>
    String(shopZip ?? '')
      .replace(/\D/g, '')
      .slice(0, 5),
  );
  const [shopAddressInput, setShopAddressInput] = useState(
    () =>
      formatShopAddressLabel(shopStreetAddress, shopCity, shopState, shopZip) ||
      String(shopStreetAddress ?? ''),
  );
  const [selectedShopLocation, setSelectedShopLocation] = useState(() =>
    buildSavedShopLocation({
      street: shopStreetAddress,
      city: shopCity,
      state: shopState,
      zip: shopZip,
    }),
  );
  const [shopAddressError, setShopAddressError] = useState('');
  const [shopUnitInput, setShopUnitInput] = useState(() => String(shopUnit ?? ''));
  const [spanishEnabled, setSpanishEnabled] = useState(() => Boolean(initialSpanishEnabled));
  const [defaultLanguageInput, setDefaultLanguageInput] = useState(() =>
    initialDefaultLanguage === 'es' ? 'es' : BOOKING_DEFAULT_LANGUAGE_EN,
  );
  const [policyEnabled, setPolicyEnabled] = useState(() => Boolean(initialBookingPolicyEnabled));
  const [policyInput, setPolicyInput] = useState(() =>
    normalizeBookingPolicyText(initialBookingPolicyText),
  );

  const onPolicyInputChange = useCallback((text) => {
    setPolicyInput(normalizeBookingPolicyText(text));
  }, []);

  const onPhoneInputChange = useCallback((text) => {
    setPhoneInput(formatPhoneInputAsYouType(text));
  }, []);

  const onInstagramInputChange = useCallback((text) => {
    setInstagramInput(normalizeSocialHandle(text));
  }, []);

  const onTiktokInputChange = useCallback((text) => {
    setTiktokInput(normalizeSocialHandle(text));
  }, []);

  const [localCoverUri, setLocalCoverUri] = useState(null);
  const [localLogoUri, setLocalLogoUri] = useState(null);
  const [localGalleryUris, setLocalGalleryUris] = useState([]);
  const [removedPortfolioKeys, setRemovedPortfolioKeys] = useState(() => new Set());

  const businessTypeOptions = useMemo(() => getBusinessTypeSelectOptions(typeInput), [typeInput]);

  const onTypeInputChange = useCallback((next) => {
    setTypeInput(next);
    setSpecialtiesInput((prev) => specialtiesAllowedForBusinessType(next, prev));
  }, []);

  const onSpecialtiesChange = useCallback((next) => {
    setSpecialtiesInput(sanitizeBusinessSpecialties(next));
  }, []);

  const coverDisplayUri = localCoverUri ?? coverImageUrl ?? null;
  const logoDisplayUri = localLogoUri ?? logoUrl ?? null;

  const triggerImageHaptic = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* simulator / module unavailable */
    }
  }, []);

  const onCoverPhotoPress = useCallback(async () => {
    const uri = await pickCoverPhotoUri();
    if (!uri) return;
    setLocalCoverUri(uri);
    await triggerImageHaptic();
  }, [triggerImageHaptic]);

  const onLogoPhotoPress = useCallback(async () => {
    const uri = await pickLogoPhotoUri();
    if (!uri) return;
    setLocalLogoUri(uri);
    await triggerImageHaptic();
  }, [triggerImageHaptic]);

  const visiblePortfolioImages = useMemo(() => {
    return portfolioImages.filter((img) => !removedPortfolioKeys.has(portfolioImageKey(img)));
  }, [portfolioImages, removedPortfolioKeys]);

  const galleryMaxImages = useMemo(
    () => getBookingLinkGalleryMaxImages(Boolean(hasProAccess)),
    [hasProAccess],
  );

  const galleryImageCount = visiblePortfolioImages.length + localGalleryUris.length;
  const canAddGalleryImage = galleryImageCount < galleryMaxImages;

  const showFreeGalleryLimitHint = useMemo(
    () =>
      isOwnerProfileLoaded &&
      !hasProAccess &&
      galleryImageCount >= BOOKING_LINK_GALLERY_MAX_IMAGES_FREE,
    [galleryImageCount, hasProAccess, isOwnerProfileLoaded],
  );

  const onGalleryAddPress = useCallback(async () => {
    if (!canAddGalleryImage) {
      if (!hasProAccess && galleryImageCount >= BOOKING_LINK_GALLERY_MAX_IMAGES_FREE) {
        const copy = bookingLinkGalleryAccessCopy();
        showWebAccountFeatureAlert({
          title: copy.alertTitle,
          message: copy.alertMessage,
        });
      } else {
        Alert.alert(
          'Gallery full',
          `You can have up to ${galleryMaxImages} images. Remove one to add another.`,
        );
      }
      return;
    }
    const uri = await pickGalleryPhotoUri();
    if (!uri) return;
    setLocalGalleryUris((prev) => {
      const nextCount = visiblePortfolioImages.length + prev.length;
      if (nextCount >= galleryMaxImages) return prev;
      return [
        ...prev,
        { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, uri },
      ];
    });
    await triggerImageHaptic();
  }, [
    canAddGalleryImage,
    galleryImageCount,
    galleryMaxImages,
    hasProAccess,
    triggerImageHaptic,
    visiblePortfolioImages.length,
  ]);

  const removePortfolioImage = useCallback((image) => {
    const key = portfolioImageKey(image);
    if (!key) return;
    setRemovedPortfolioKeys((prev) => new Set(prev).add(key));
  }, []);

  const removeLocalGalleryItem = useCallback((id) => {
    setLocalGalleryUris((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const serviceAreaQuery = useQuery({
    queryKey: primaryServiceAreaQueryKey(businessId),
    queryFn: async () => {
      const { serviceArea, error } = await fetchPrimaryServiceArea(businessId);
      if (error) throw error;
      return serviceArea;
    },
    enabled: Boolean(businessId),
    staleTime: 45 * 1000,
  });

  useEffect(() => {
    if (!serviceAreaQuery.isSuccess || locationHydrated) return;
    if (locationTouchedRef.current) {
      setLocationHydrated(true);
      return;
    }

    const area = serviceAreaQuery.data;
    const abortController = new AbortController();

    async function hydrateLocation() {
      if (area?.location) {
        setSelectedLocation(area.location);
        setLocationInput(area.location.label);
        setCityInput(area.location.city);
        setStateInput(area.location.state);
        if (area.location.zip) {
          setZipInput(area.location.zip);
        }
      } else {
        const resolved = await resolveLegacyServiceLocation({
          city: businessCity,
          state: businessState,
          zip: businessZip,
          signal: abortController.signal,
        });
        if (abortController.signal.aborted || locationTouchedRef.current) return;

        if (resolved) {
          setSelectedLocation(resolved);
          setLocationInput(formatLocationDisplay(resolved));
          if (resolved.city) setCityInput(resolved.city.trim());
          if (resolved.state) {
            setStateInput(
              String(resolved.state)
                .replace(/[^a-z]/gi, '')
                .slice(0, 2)
                .toUpperCase(),
            );
          }
          if (resolved.zip) {
            setZipInput((prev) => {
              const next = String(resolved.zip).replace(/\D/g, '').slice(0, 5);
              return next.length === 5 ? next : prev;
            });
          }
        } else if (area?.label) {
          setLocationInput(area.label);
        } else {
          const fallback = formatBookingServiceAreaLabel(businessCity, businessState, businessZip);
          if (fallback) setLocationInput(fallback);
        }
      }

      if (area?.radiusMiles) {
        setRadiusInput(normalizeServiceAreaRadius(area.radiusMiles));
      }

      if (!abortController.signal.aborted) {
        setLocationHydrated(true);
      }
    }

    hydrateLocation();
    return () => abortController.abort();
  }, [
    businessCity,
    businessState,
    businessZip,
    locationHydrated,
    serviceAreaQuery.data,
    serviceAreaQuery.isSuccess,
  ]);

  const clearSelectedLocationIfDiverged = useCallback((city, state, zip) => {
    setSelectedLocation((prev) => {
      if (!prev) return null;
      const nextState = String(state ?? '')
        .replace(/[^a-z]/gi, '')
        .slice(0, 2)
        .toUpperCase();
      const nextZip = String(zip ?? '')
        .replace(/\D/g, '')
        .slice(0, 5);
      if (
        prev.city.trim() === String(city ?? '').trim() &&
        prev.state === nextState &&
        (!prev.zip || prev.zip === nextZip)
      ) {
        return prev;
      }
      return null;
    });
  }, []);

  const onCityInputChange = useCallback(
    (next) => {
      setCityInput(next);
      clearSelectedLocationIfDiverged(next, stateInput, zipInput);
    },
    [clearSelectedLocationIfDiverged, stateInput, zipInput],
  );

  const onStateInputChange = useCallback(
    (t) => {
      const next = t
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 2)
        .toUpperCase();
      setStateInput(next);
      clearSelectedLocationIfDiverged(cityInput, next, zipInput);
    },
    [cityInput, clearSelectedLocationIfDiverged, zipInput],
  );

  const onZipInputChange = useCallback(
    (t) => {
      const next = t.replace(/\D/g, '').slice(0, 5);
      setZipInput(next);
      clearSelectedLocationIfDiverged(cityInput, stateInput, next);
    },
    [cityInput, clearSelectedLocationIfDiverged, stateInput],
  );

  const onLocationInputChange = useCallback((next) => {
    locationTouchedRef.current = true;
    setLocationInput(next);
    setSelectedLocation(null);
    setLocationError('');
  }, []);

  const onLocationSelect = useCallback((location) => {
    locationTouchedRef.current = true;
    setSelectedLocation(location);
    setLocationInput(formatLocationDisplay(location));
    setCityInput(location.city.trim());
    setStateInput(
      String(location.state ?? '')
        .replace(/[^a-z]/gi, '')
        .slice(0, 2)
        .toUpperCase(),
    );
    setZipInput((prev) => {
      const next = String(location.zip ?? '')
        .replace(/\D/g, '')
        .slice(0, 5);
      return next.length === 5 ? next : prev;
    });
    setLocationError('');
  }, []);

  const onRadiusChange = useCallback((next) => {
    locationTouchedRef.current = true;
    setRadiusInput(normalizeServiceAreaRadius(next));
  }, []);

  const shopAddressBaseline = useMemo(
    () =>
      formatShopAddressLabel(shopStreetAddress, shopCity, shopState, shopZip) ||
      String(shopStreetAddress ?? '').trim(),
    [shopCity, shopState, shopStreetAddress, shopZip],
  );

  const shopRequiresSuggestion = Boolean(
    shopAddressInput.trim() !== shopAddressBaseline && !selectedShopLocation,
  );

  const onShopAddressInputChange = useCallback((next) => {
    setShopAddressInput(next);
    setSelectedShopLocation(null);
    setShopStreetInput('');
    setShopCityInput('');
    setShopStateInput('');
    setShopZipInput('');
    setShopAddressError('');
  }, []);

  const onShopAddressSelect = useCallback((location) => {
    const street = String(location?.street ?? '').trim() || String(location?.label ?? '').trim();
    const nextZip = String(location?.zip ?? '')
      .replace(/\D/g, '')
      .slice(0, 5);
    const nextCity = String(location?.city ?? '').trim();
    const nextState = String(location?.state ?? '')
      .replace(/[^a-z]/gi, '')
      .slice(0, 2)
      .toUpperCase();

    if (!String(location?.street ?? '').trim()) {
      setSelectedShopLocation(null);
      setShopStreetInput('');
      setShopCityInput('');
      setShopStateInput('');
      setShopZipInput('');
      setShopAddressError('Choose a street address from the list.');
      return;
    }

    const fullLabel =
      formatShopAddressLabel(street, nextCity, nextState, nextZip) ||
      formatLocationDisplay(location);

    setSelectedShopLocation(location);
    setShopAddressInput(fullLabel);
    setShopStreetInput(street);
    setShopCityInput(nextCity);
    setShopStateInput(nextState);
    setShopZipInput(nextZip);
    setShopAddressError('');
  }, []);

  const onSpanishEnabledChange = useCallback((next) => {
    setSpanishEnabled(next);
    if (!next) {
      setDefaultLanguageInput(BOOKING_DEFAULT_LANGUAGE_EN);
    }
  }, []);

  const editFieldsForSnapshot = useMemo(
    () => ({
      nameInput,
      typeInput,
      specialtiesInput,
      cityInput,
      stateInput,
      zipInput,
      bioInput,
      phoneInput,
      instagramInput,
      tiktokInput,
      serviceTypeInput,
      shopStreetInput,
      shopUnitInput,
      shopCityInput,
      shopStateInput,
      shopZipInput,
      spanishEnabled,
      defaultLanguageInput,
      policyEnabled,
      policyInput,
    }),
    [
      nameInput,
      typeInput,
      specialtiesInput,
      cityInput,
      stateInput,
      zipInput,
      bioInput,
      phoneInput,
      instagramInput,
      tiktokInput,
      serviceTypeInput,
      shopStreetInput,
      shopUnitInput,
      shopCityInput,
      shopStateInput,
      shopZipInput,
      spanishEnabled,
      defaultLanguageInput,
      policyEnabled,
      policyInput,
    ],
  );

  const saveMutation = useSaveBookingLinkText();

  const editBaselineProps = useMemo(
    () => ({
      businessBio,
      businessCity,
      businessName,
      businessState,
      businessZip,
      businessType,
      specialties: initialSpecialties,
      phoneNumber,
      socialMedia,
      serviceLocationMode,
      shopStreetAddress,
      shopUnit,
      shopCity,
      shopState,
      shopZip,
      publicBookingLocales,
      publicBookingDefaultLocale: initialDefaultLanguage,
      bookingPolicyEnabled: initialBookingPolicyEnabled,
      bookingPolicyText: initialBookingPolicyText,
    }),
    [
      businessBio,
      businessCity,
      businessName,
      businessState,
      businessZip,
      businessType,
      initialSpecialties,
      phoneNumber,
      socialMedia,
      serviceLocationMode,
      shopStreetAddress,
      shopUnit,
      shopCity,
      shopState,
      shopZip,
      publicBookingLocales,
      initialDefaultLanguage,
      initialBookingPolicyEnabled,
      initialBookingPolicyText,
    ],
  );

  const hasTextChanges = useMemo(
    () => bookingLinkEditDirtyVsProps(editBaselineProps, editFieldsForSnapshot),
    [editBaselineProps, editFieldsForSnapshot],
  );

  const baselineRadius = useMemo(
    () =>
      serviceAreaQuery.data?.radiusMiles
        ? normalizeServiceAreaRadius(serviceAreaQuery.data.radiusMiles)
        : DEFAULT_SERVICE_AREA_RADIUS,
    [serviceAreaQuery.data],
  );

  const baselineLocationKey = useMemo(() => {
    const location = serviceAreaQuery.data?.location;
    if (!location) return '';
    return `${location.latitude},${location.longitude}`;
  }, [serviceAreaQuery.data]);

  const currentLocationKey = selectedLocation
    ? `${selectedLocation.latitude},${selectedLocation.longitude}`
    : '';

  const locationInputBaseline = useMemo(() => {
    if (serviceAreaQuery.data?.location?.label) return serviceAreaQuery.data.location.label;
    if (serviceAreaQuery.data?.label) return serviceAreaQuery.data.label;
    return formatBookingServiceAreaLabel(businessCity, businessState, businessZip) ?? '';
  }, [businessCity, businessState, businessZip, serviceAreaQuery.data]);

  const hasLocationChanges = Boolean(
    locationHydrated &&
    selectedLocation &&
    (currentLocationKey !== baselineLocationKey || radiusInput !== baselineRadius),
  );

  const locationRequiresSuggestion = Boolean(
    locationInput.trim() !== locationInputBaseline.trim() && !selectedLocation,
  );

  const hasImageChanges = Boolean(localCoverUri || localLogoUri);

  const hasGalleryChanges = useMemo(() => {
    const basePaths = (portfolioImages ?? [])
      .map((img) => portfolioRowStoragePath(img, businessId))
      .filter(Boolean)
      .join('\u0001');
    const keptPaths = visiblePortfolioImages
      .map((img) => portfolioRowStoragePath(img, businessId))
      .filter(Boolean)
      .join('\u0001');
    if (basePaths !== keptPaths) return true;
    if (localGalleryUris.length > 0) return true;
    return false;
  }, [portfolioImages, visiblePortfolioImages, localGalleryUris, businessId]);

  const specialtyError = useMemo(() => {
    if (!typeInput.trim()) return '';
    return sanitizeBusinessSpecialties(specialtiesInput).length === 0
      ? SPECIALTIES_REQUIRED_ERROR
      : '';
  }, [specialtiesInput, typeInput]);

  const hasRequiredNameType = Boolean(nameInput.trim() && typeInput.trim() && !specialtyError);

  const phoneInputError = useMemo(() => getPhoneInputValidationMessage(phoneInput), [phoneInput]);

  const profileCompletion = useMemo(
    () =>
      buildProfileCompletionChecklist({
        hasCover: Boolean(coverDisplayUri),
        hasLogo: Boolean(logoDisplayUri),
        nameInput,
        typeInput,
        specialtiesInput,
        cityInput,
        stateInput,
        zipInput,
        phoneInput,
        bioInput,
        serviceTypeInput,
        shopStreetInput,
        galleryImageCount,
      }),
    [
      coverDisplayUri,
      logoDisplayUri,
      nameInput,
      typeInput,
      specialtiesInput,
      cityInput,
      stateInput,
      zipInput,
      phoneInput,
      bioInput,
      serviceTypeInput,
      shopStreetInput,
      galleryImageCount,
    ],
  );

  const canSave = Boolean(
    businessId &&
    user?.id &&
    (hasTextChanges || hasImageChanges || hasGalleryChanges || hasLocationChanges) &&
    !saveMutation.isPending &&
    !isSavingServiceArea &&
    !phoneInputError &&
    (hasRequiredNameType || hasImageChanges || hasGalleryChanges),
  );

  const handleSave = useCallback(async () => {
    if (!businessId || !user?.id) {
      Alert.alert('Could not save', 'Your profile is still loading. Try again in a moment.');
      return;
    }
    const galleryTotal = visiblePortfolioImages.length + localGalleryUris.length;
    if (galleryTotal > galleryMaxImages) {
      Alert.alert(
        'Too many photos',
        `Please keep your gallery at ${galleryMaxImages} images or fewer before saving.`,
      );
      return;
    }
    const phoneErr = getPhoneInputValidationMessage(phoneInput);
    if (phoneErr) {
      Alert.alert('Phone number', phoneErr);
      return;
    }
    const locationValidation = validateBookingLinkEditFields({
      cityInput,
      stateInput,
      zipInput,
      serviceTypeInput,
      shopStreetInput,
      shopCityInput,
      shopStateInput,
      shopZipInput,
      shopRequiresSuggestion,
      typeInput,
      specialtiesInput,
      locationRequiresSuggestion,
      policyEnabled,
      policyInput,
    });
    if (!locationValidation.ok) {
      if (locationRequiresSuggestion) {
        setLocationError(locationValidation.message);
      }
      if (shopRequiresSuggestion) {
        setShopAddressError(locationValidation.message);
      }
      Alert.alert(locationValidation.title, locationValidation.message);
      return;
    }
    try {
      let locationToPersist = selectedLocation;
      if (!locationToPersist) {
        locationToPersist = await resolveLegacyServiceLocation({
          city: cityInput,
          state: stateInput,
          zip: zipInput,
        });
        if (locationToPersist) {
          setSelectedLocation(locationToPersist);
          setLocationInput(formatLocationDisplay(locationToPersist));
        }
      }

      const shouldWriteServiceArea = Boolean(
        locationToPersist &&
        (!serviceAreaQuery.data?.location ||
          `${locationToPersist.latitude},${locationToPersist.longitude}` !== baselineLocationKey ||
          radiusInput !== baselineRadius),
      );

      if (shouldWriteServiceArea) {
        setIsSavingServiceArea(true);
        const payload = buildServiceAreaPayload(locationToPersist, parseInt(radiusInput, 10));
        const result = await saveUserLocation(payload, businessId);
        if (!result.ok) {
          throw result.error ?? new Error('Unable to save service area.');
        }
        await queryClient.invalidateQueries({ queryKey: primaryServiceAreaQueryKey(businessId) });
        await recheckPromptStatus();
      }

      const shouldSaveProfile =
        hasTextChanges ||
        hasImageChanges ||
        hasGalleryChanges ||
        hasLocationChanges ||
        shouldWriteServiceArea;
      if (shouldSaveProfile) {
        const galleryPayload =
          hasGalleryChanges && businessId
            ? {
                existingOrderedStoragePaths: visiblePortfolioImages
                  .map((img) => portfolioRowStoragePath(img, businessId))
                  .filter(Boolean),
                newLocalUrisOrdered: localGalleryUris.map((item) => item.uri),
              }
            : undefined;

        await saveMutation.mutateAsync(
          buildSaveBookingLinkTextVariables({
            userId: user.id,
            businessId,
            ...editFieldsForSnapshot,
            coverImageUri: localCoverUri,
            logoImageUri: localLogoUri,
            previousBannerPath: coverImagePath,
            previousLogoPath: logoPath,
            ...(galleryPayload ? { gallery: galleryPayload } : {}),
          }),
        );
        await queryClient.invalidateQueries({ queryKey: shopAddressPromptQueryKey(user.id) });
      }

      onSaved?.();
    } catch (e) {
      Alert.alert('Could not save', safeUserFacingMessage(e, { fallback: 'Please try again.' }));
    } finally {
      setIsSavingServiceArea(false);
    }
  }, [
    businessId,
    user?.id,
    editFieldsForSnapshot,
    localCoverUri,
    localLogoUri,
    coverImagePath,
    logoPath,
    hasGalleryChanges,
    hasTextChanges,
    hasImageChanges,
    hasLocationChanges,
    baselineLocationKey,
    baselineRadius,
    locationRequiresSuggestion,
    shopRequiresSuggestion,
    selectedLocation,
    serviceAreaQuery.data,
    radiusInput,
    queryClient,
    recheckPromptStatus,
    visiblePortfolioImages,
    localGalleryUris,
    onSaved,
    saveMutation,
    galleryMaxImages,
    phoneInput,
    cityInput,
    stateInput,
    zipInput,
    serviceTypeInput,
    shopStreetInput,
    shopCityInput,
    shopStateInput,
    shopZipInput,
    typeInput,
    specialtiesInput,
    policyEnabled,
    policyInput,
  ]);

  return {
    colors,
    previewOutlineColor,
    coverDisplayUri,
    logoDisplayUri,
    businessTypeOptions,
    galleryTileStyle,
    nameInput,
    setNameInput,
    typeInput,
    onTypeInputChange,
    specialtiesInput,
    onSpecialtiesChange,
    specialtyError,
    cityInput,
    onCityInputChange,
    stateInput,
    onStateInputChange,
    zipInput,
    onZipInputChange,
    locationInput,
    selectedLocation,
    locationError,
    radiusInput,
    onLocationInputChange,
    onLocationSelect,
    onRadiusChange,
    serviceTypeInput,
    setServiceTypeInput,
    shopStreetInput,
    shopAddressInput,
    selectedShopLocation,
    shopAddressError,
    onShopAddressInputChange,
    onShopAddressSelect,
    shopUnitInput,
    setShopUnitInput,
    spanishEnabled,
    onSpanishEnabledChange,
    defaultLanguageInput,
    setDefaultLanguageInput,
    policyEnabled,
    setPolicyEnabled,
    policyInput,
    onPolicyInputChange,
    bioInput,
    setBioInput,
    phoneInput,
    phoneInputError,
    onPhoneInputChange,
    instagramInput,
    onInstagramInputChange,
    tiktokInput,
    onTiktokInputChange,
    onCoverPhotoPress,
    onLogoPhotoPress,
    onGalleryAddPress,
    canAddGalleryImage,
    galleryImageCount,
    galleryMaxImages,
    hasProAccess: Boolean(hasProAccess),
    showFreeGalleryLimitHint,
    visiblePortfolioImages,
    localGalleryUris,
    removePortfolioImage,
    removeLocalGalleryItem,
    onDoneEditing: onBack,
    handleSave,
    canSave,
    isSaving: saveMutation.isPending || isSavingServiceArea,
    saveMutation,
    profileCompletionPercent: profileCompletion.percent,
    profileCompletionItems: profileCompletion.items,
  };
}
