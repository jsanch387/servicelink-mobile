import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import { useAuth } from '../../../auth';
import { useTheme } from '../../../../theme';
import {
  formatPhoneForDisplay,
  formatPhoneInputAsYouType,
  getPhoneInputValidationMessage,
} from '../../../../utils/phone';
import { safeUserFacingMessage } from '../../../../utils/safeUserFacingMessage';
import { BUSINESS_TYPE_OPTIONS } from '../../constants/businessTypeOptions';
import {
  BOOKING_LINK_EDIT_GALLERY_COLUMNS,
  BOOKING_LINK_EDIT_GALLERY_GAP,
  BOOKING_LINK_GALLERY_MAX_IMAGES_FREE,
  getBookingLinkGalleryMaxImages,
} from '../constants/galleryLayout';
import { bookingLinkGalleryAccessCopy } from '../constants/galleryAccessCopy';
import { showWebAccountFeatureAlert } from '../../../subscription';
import { useSaveBookingLinkText } from '../../hooks/useSaveBookingLinkText';
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
import {
  pickCoverPhotoUri,
  pickGalleryPhotoUri,
  pickLogoPhotoUri,
} from '../../utils/pickProfileImage';
import { portfolioImageKey } from '../../utils/portfolio';
import { portfolioRowStoragePath } from '../../utils/storagePath';
import { normalizeSocialHandle, socialMediaFromDb } from '../../utils/socialMedia';

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
  spanishEnabled: initialSpanishEnabled = false,
  defaultLanguage: initialDefaultLanguage = BOOKING_DEFAULT_LANGUAGE_EN,
  publicBookingLocales,
  portfolioImages = [],
  hasProAccess = false,
  isOwnerProfileLoaded = false,
}) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

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
  const [bioInput, setBioInput] = useState(() => String(businessBio ?? ''));
  const [phoneInput, setPhoneInput] = useState(() => formatPhoneForDisplay(phoneNumber));
  const [instagramInput, setInstagramInput] = useState(
    () => socialMediaFromDb(socialMedia).instagram,
  );
  const [tiktokInput, setTiktokInput] = useState(() => socialMediaFromDb(socialMedia).tiktok);
  const [serviceTypeInput, setServiceTypeInput] = useState(() => initialServiceType);
  const [shopStreetInput, setShopStreetInput] = useState(() => String(shopStreetAddress ?? ''));
  const [shopUnitInput, setShopUnitInput] = useState(() => String(shopUnit ?? ''));
  const [spanishEnabled, setSpanishEnabled] = useState(() => Boolean(initialSpanishEnabled));
  const [defaultLanguageInput, setDefaultLanguageInput] = useState(() =>
    initialDefaultLanguage === 'es' ? 'es' : BOOKING_DEFAULT_LANGUAGE_EN,
  );

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

  const businessTypeOptions = useMemo(() => {
    const t = typeInput.trim();
    if (t && !BUSINESS_TYPE_OPTIONS.some((o) => o.value === t)) {
      return [{ value: t, label: t }, ...BUSINESS_TYPE_OPTIONS];
    }
    return BUSINESS_TYPE_OPTIONS;
  }, [typeInput]);

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

  const onStateInputChange = useCallback((t) => {
    setStateInput(
      t
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 2)
        .toUpperCase(),
    );
  }, []);

  const onZipInputChange = useCallback((t) => {
    setZipInput(t.replace(/\D/g, '').slice(0, 5));
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
      spanishEnabled,
      defaultLanguageInput,
    }),
    [
      nameInput,
      typeInput,
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
      spanishEnabled,
      defaultLanguageInput,
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
      phoneNumber,
      socialMedia,
      serviceLocationMode,
      shopStreetAddress,
      shopUnit,
      publicBookingLocales,
      publicBookingDefaultLocale: initialDefaultLanguage,
    }),
    [
      businessBio,
      businessCity,
      businessName,
      businessState,
      businessZip,
      businessType,
      phoneNumber,
      socialMedia,
      serviceLocationMode,
      shopStreetAddress,
      shopUnit,
      publicBookingLocales,
      initialDefaultLanguage,
    ],
  );

  const hasTextChanges = useMemo(
    () => bookingLinkEditDirtyVsProps(editBaselineProps, editFieldsForSnapshot),
    [editBaselineProps, editFieldsForSnapshot],
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

  const hasRequiredNameType = Boolean(nameInput.trim() && typeInput.trim());

  const phoneInputError = useMemo(() => getPhoneInputValidationMessage(phoneInput), [phoneInput]);

  const profileCompletion = useMemo(
    () =>
      buildProfileCompletionChecklist({
        hasCover: Boolean(coverDisplayUri),
        hasLogo: Boolean(logoDisplayUri),
        nameInput,
        typeInput,
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
    (hasTextChanges || hasImageChanges || hasGalleryChanges) &&
    !saveMutation.isPending &&
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
    });
    if (!locationValidation.ok) {
      Alert.alert(locationValidation.title, locationValidation.message);
      return;
    }
    try {
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
      onSaved?.();
    } catch (e) {
      Alert.alert('Could not save', safeUserFacingMessage(e, { fallback: 'Please try again.' }));
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
    setTypeInput,
    cityInput,
    setCityInput,
    stateInput,
    onStateInputChange,
    zipInput,
    onZipInputChange,
    serviceTypeInput,
    setServiceTypeInput,
    shopStreetInput,
    setShopStreetInput,
    shopUnitInput,
    setShopUnitInput,
    spanishEnabled,
    onSpanishEnabledChange,
    defaultLanguageInput,
    setDefaultLanguageInput,
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
    saveMutation,
    profileCompletionPercent: profileCompletion.percent,
    profileCompletionItems: profileCompletion.items,
  };
}
