import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import { useAuth } from '../../../auth';
import { useTheme } from '../../../../theme';
import { formatPhoneForDisplay, formatPhoneInputAsYouType } from '../../../../utils/phone';
import { BUSINESS_TYPE_OPTIONS } from '../../constants/businessTypeOptions';
import {
  BOOKING_LINK_EDIT_GALLERY_COLUMNS,
  BOOKING_LINK_EDIT_GALLERY_GAP,
} from '../constants/galleryLayout';
import { useSaveBookingLinkText } from '../../hooks/useSaveBookingLinkText';
import {
  buildSaveBookingLinkTextVariables,
  bookingLinkTextDirtyVsProps,
} from '../../utils/bookingLinkTextSave';
import {
  pickCoverPhotoUri,
  pickGalleryPhotoUri,
  pickLogoPhotoUri,
} from '../../utils/pickProfileImage';
import { portfolioImageKey } from '../../utils/portfolio';
import { portfolioRowStoragePath } from '../../utils/storagePath';

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
  businessBio,
  phoneNumber,
  portfolioImages = [],
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
  const [bioInput, setBioInput] = useState(() => String(businessBio ?? ''));
  const [phoneInput, setPhoneInput] = useState(() => formatPhoneForDisplay(phoneNumber));

  const onPhoneInputChange = useCallback((text) => {
    setPhoneInput(formatPhoneInputAsYouType(text));
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

  const onGalleryAddPress = useCallback(async () => {
    const uri = await pickGalleryPhotoUri();
    if (!uri) return;
    setLocalGalleryUris((prev) => [
      ...prev,
      { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, uri },
    ]);
    await triggerImageHaptic();
  }, [triggerImageHaptic]);

  const visiblePortfolioImages = useMemo(() => {
    return portfolioImages.filter((img) => !removedPortfolioKeys.has(portfolioImageKey(img)));
  }, [portfolioImages, removedPortfolioKeys]);

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

  const saveMutation = useSaveBookingLinkText();

  const textBaselineProps = useMemo(
    () => ({
      businessBio,
      businessCity,
      businessName,
      businessState,
      businessType,
      phoneNumber,
    }),
    [businessBio, businessCity, businessName, businessState, businessType, phoneNumber],
  );

  const hasTextChanges = useMemo(
    () =>
      bookingLinkTextDirtyVsProps(textBaselineProps, {
        nameInput,
        typeInput,
        cityInput,
        stateInput,
        bioInput,
        phoneInput,
      }),
    [textBaselineProps, nameInput, typeInput, cityInput, stateInput, bioInput, phoneInput],
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

  const canSave = Boolean(
    businessId &&
    user?.id &&
    (hasTextChanges || hasImageChanges || hasGalleryChanges) &&
    !saveMutation.isPending &&
    (hasRequiredNameType || hasImageChanges || hasGalleryChanges),
  );

  const handleSave = useCallback(async () => {
    if (!businessId || !user?.id) {
      Alert.alert('Could not save', 'Your profile is still loading. Try again in a moment.');
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
          nameInput,
          typeInput,
          cityInput,
          stateInput,
          bioInput,
          phoneInput,
          coverImageUri: localCoverUri,
          logoImageUri: localLogoUri,
          previousBannerPath: coverImagePath,
          previousLogoPath: logoPath,
          ...(galleryPayload ? { gallery: galleryPayload } : {}),
        }),
      );
      onSaved?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Please try again.';
      Alert.alert('Could not save', message);
    }
  }, [
    businessId,
    user?.id,
    nameInput,
    typeInput,
    cityInput,
    stateInput,
    bioInput,
    phoneInput,
    localCoverUri,
    localLogoUri,
    coverImagePath,
    logoPath,
    hasGalleryChanges,
    visiblePortfolioImages,
    localGalleryUris,
    onSaved,
    saveMutation,
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
    bioInput,
    setBioInput,
    phoneInput,
    onPhoneInputChange,
    onCoverPhotoPress,
    onLogoPhotoPress,
    onGalleryAddPress,
    visiblePortfolioImages,
    localGalleryUris,
    removePortfolioImage,
    removeLocalGalleryItem,
    onPreview: onBack,
    handleSave,
    canSave,
    saveMutation,
  };
}
