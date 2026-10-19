import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  DurationSelectField,
  InlineCardError,
  SettingsSection,
  SurfaceCard,
  SurfaceTextField,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { serviceDurationHHmmToMinutes } from '../../../components/ui/durationTime';
import { useAuth } from '../../auth';
import { useSubscription, showWebAccountFeatureAlert } from '../../subscription';
import { serviceMultiplePricingAccessCopy } from '../constants/servicePricingAccessCopy';
import { AddonEditorSheet } from '../components/AddonEditorSheet';
import { ServiceCategoryPickerField } from '../categories';
import {
  ServiceAddonPickerSheet,
  ServiceAddonSummaryRow,
  summarizeSelectedAddons,
} from '../components/ServiceAddonPickerSheet';
import {
  ServicePriceListSheet,
  ServicePriceSummaryRow,
  summarizePrices,
} from '../components/ServicePriceListSheet';
import { ServiceHeaderDeleteButton } from '../components/ServiceHeaderDeleteButton';
import { buildServiceEditDraft } from '../utils/buildServiceEditDraft';
import { normalizeAddonDurationHHmm } from '../utils/serviceAddonModel';
import { useDeleteBusinessService } from '../hooks/useDeleteBusinessService';
import { useMutateServiceAddon } from '../hooks/useMutateServiceAddon';
import { useServiceEditData } from '../hooks/useServiceEditData';
import { useSaveServiceEdits } from '../hooks/useSaveServiceEdits';

function normalizePriceInput(rawText) {
  const input = String(rawText ?? '').replace(/\$/g, '');
  let out = '';
  let dotSeen = false;
  for (const ch of input) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if (ch === '.' && !dotSeen) {
      out += ch;
      dotSeen = true;
    }
  }
  return out;
}

function buildEditorSnapshot({
  serviceName,
  description,
  price,
  durationHHmm,
  categoryId,
  multiPriceEnabled,
  pricingOptions,
  addonOptions,
  selectedAddonIds,
}) {
  const normalizedPricing = [...(pricingOptions ?? [])]
    .map((option) => ({
      id: String(option.id ?? ''),
      label: String(option.label ?? ''),
      price: String(option.price ?? ''),
      durationHHmm: String(option.durationHHmm ?? ''),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const normalizedAddons = [...(addonOptions ?? [])]
    .map((addon) => ({
      id: String(addon.id ?? ''),
      name: String(addon.name ?? ''),
      priceLabel: String(addon.priceLabel ?? ''),
      durationLabel: String(addon.durationLabel ?? ''),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return JSON.stringify({
    serviceName: String(serviceName ?? ''),
    description: String(description ?? ''),
    price: String(price ?? ''),
    durationHHmm: String(durationHHmm ?? ''),
    categoryId: String(categoryId ?? ''),
    multiPriceEnabled: Boolean(multiPriceEnabled),
    selectedAddonIds: [...(selectedAddonIds ?? [])].map(String).sort(),
    pricingOptions: normalizedPricing,
    addonOptions: normalizedAddons,
  });
}

function patchEditorSnapshotAddons(prevSnapshot, addonOptions, selectedAddonIds) {
  try {
    const o = JSON.parse(prevSnapshot);
    o.addonOptions = [...(addonOptions ?? [])]
      .map((addon) => ({
        id: String(addon.id ?? ''),
        name: String(addon.name ?? ''),
        priceLabel: String(addon.priceLabel ?? ''),
        durationLabel: String(addon.durationLabel ?? ''),
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
    o.selectedAddonIds = [...(selectedAddonIds ?? [])].map(String).sort();
    return JSON.stringify(o);
  } catch {
    return prevSnapshot;
  }
}

const DESCRIPTION_MAX_LENGTH = 800;

function validateEditorInput({
  serviceName,
  description,
  price,
  durationHHmm,
  pricingOptions,
  skipPricingOptionValidation,
}) {
  if (!String(serviceName ?? '').trim()) return 'Service name is required.';
  if (!String(description ?? '').trim()) return 'Service description is required.';
  if (!String(price ?? '').trim()) return 'Service price is required.';
  if (!String(durationHHmm ?? '').trim()) return 'Service duration is required.';

  if (skipPricingOptionValidation) return null;

  for (const option of pricingOptions ?? []) {
    if (!String(option.label ?? '').trim()) return 'Each pricing option requires a name.';
    if (!String(option.price ?? '').trim())
      return `Price is required for "${option.label || 'option'}".`;
    if (!String(option.durationHHmm ?? '').trim()) {
      return `Duration is required for "${option.label || 'option'}".`;
    }
  }

  return null;
}

function validateAddonInput(addonOptions) {
  for (const addon of addonOptions ?? []) {
    if (!String(addon.name ?? '').trim()) return 'Each add-on requires a name.';
    if (!String(addon.price ?? '').trim())
      return `Price is required for "${addon.name || 'add-on'}".`;
  }

  return null;
}

/** How long save-time validation / error banners stay visible before auto-clearing. */
const TRANSIENT_SAVE_FEEDBACK_MS = 5000;

export function ServiceEditScreen({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { hasProAccess, isReady: subscriptionReady } = useSubscription();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const routeService = route?.params?.service;
  const routeServiceId = String(route?.params?.serviceId ?? routeService?.id ?? '');
  const initialDraft = useMemo(() => buildServiceEditDraft(routeService), [routeService]);
  const initialSelectedAddonIds = useMemo(() => ['addon-pet-hair'], []);
  const initialPricingOptions = useMemo(
    () => [
      { id: 'option-truck', label: 'Truck', price: '200', durationHHmm: '03:30' },
      { id: 'option-suv', label: 'SUV', price: '150', durationHHmm: '03:30' },
    ],
    [],
  );
  const initialAddonOptions = useMemo(
    () => [
      {
        id: 'addon-pet-hair',
        name: 'Pet hair removal',
        durationLabel: '+30 mins',
        priceLabel: '$20',
        price: '20.00',
        durationHHmm: '00:30',
      },
      {
        id: 'addon-odor',
        name: 'Odor treatment',
        durationLabel: '+30 mins',
        priceLabel: '$35',
        price: '35.00',
        durationHHmm: '00:30',
      },
    ],
    [],
  );
  const fallbackEditorModel = useMemo(
    () => ({
      serviceName: initialDraft.serviceName,
      description: initialDraft.description,
      price: initialDraft.price,
      durationHHmm: initialDraft.durationHHmm,
      multiPriceEnabled: true,
      pricingOptions: initialPricingOptions,
      addonOptions: initialAddonOptions,
      selectedAddonIds: initialSelectedAddonIds,
    }),
    [initialAddonOptions, initialDraft, initialPricingOptions, initialSelectedAddonIds],
  );
  const {
    data: fetchedEditorData,
    isLoading: isEditorLoading,
    errorMessage: editorErrorMessage,
    businessId,
    editorDataUpdatedAt,
    refetch: refetchServiceEditor,
  } = useServiceEditData(routeServiceId, routeService);

  useFocusEffect(
    useCallback(() => {
      void refetchServiceEditor();
    }, [refetchServiceEditor]),
  );
  const { categories, categorySelectOptionsWithNone } = useMemo(
    () => ({
      categories: fetchedEditorData?.categories ?? [],
      categorySelectOptionsWithNone: fetchedEditorData?.categorySelectOptionsWithNone ?? [],
    }),
    [fetchedEditorData?.categories, fetchedEditorData?.categorySelectOptionsWithNone],
  );
  const [serviceName, setServiceName] = useState(initialDraft.serviceName);
  const [description, setDescription] = useState(initialDraft.description);
  const [price, setPrice] = useState(initialDraft.price);
  const [durationHHmm, setDurationHHmm] = useState(initialDraft.durationHHmm);
  const [categoryId, setCategoryId] = useState('');
  const [multiPriceEnabled, setMultiPriceEnabled] = useState(true);
  const [selectedAddonIds, setSelectedAddonIds] = useState(initialSelectedAddonIds);
  const [addonSheetOpen, setAddonSheetOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [addonSheetError, setAddonSheetError] = useState('');
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [priceFormFirst, setPriceFormFirst] = useState(false);
  const [addonPickerOpen, setAddonPickerOpen] = useState(false);
  const [pricingOptions, setPricingOptions] = useState(initialPricingOptions);
  const [addonOptions, setAddonOptions] = useState(initialAddonOptions);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const saveFeedbackDismissTimerRef = useRef(null);
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    buildEditorSnapshot({
      ...fallbackEditorModel,
    }),
  );
  const [hydratedServiceId, setHydratedServiceId] = useState('');
  const [editorManualRefreshing, setEditorManualRefreshing] = useState(false);

  const pricingAccessPending = Boolean(user?.id) && !subscriptionReady;
  const pricingLocked = Boolean(user?.id) && subscriptionReady && !hasProAccess;
  const hasCategories = categories.length > 0;

  const handleCategoryIdChange = useCallback((nextCategoryId) => {
    setCategoryId(nextCategoryId);
  }, []);

  useEffect(() => {
    if (pricingLocked) return;
    if (multiPriceEnabled && pricingOptions.length === 0) {
      setMultiPriceEnabled(false);
    }
  }, [multiPriceEnabled, pricingLocked, pricingOptions.length]);

  const showTransientSaveFeedback = useCallback((message, ms = TRANSIENT_SAVE_FEEDBACK_MS) => {
    if (!String(message ?? '').trim()) return;
    if (saveFeedbackDismissTimerRef.current) {
      clearTimeout(saveFeedbackDismissTimerRef.current);
      saveFeedbackDismissTimerRef.current = null;
    }
    setSaveFeedback(message);
    saveFeedbackDismissTimerRef.current = setTimeout(() => {
      saveFeedbackDismissTimerRef.current = null;
      setSaveFeedback((current) => (current === message ? '' : current));
    }, ms);
  }, []);

  useEffect(() => {
    return () => {
      if (saveFeedbackDismissTimerRef.current) {
        clearTimeout(saveFeedbackDismissTimerRef.current);
      }
    };
  }, []);

  const { saveChanges, isSaving, saveError } = useSaveServiceEdits({
    businessId,
    serviceId: routeServiceId,
    userId: user?.id,
  });
  const { deleteService, isDeletingService } = useDeleteBusinessService({
    businessId,
    userId: user?.id,
  });
  const { mutateAddon, isSavingAddon } = useMutateServiceAddon({
    businessId,
    userId: user?.id,
    serviceId: routeServiceId,
  });

  const handleDeleteService = useCallback(async () => {
    if (!businessId || !routeServiceId || isDeletingService) return;
    try {
      await deleteService({ serviceId: routeServiceId });
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Could not delete',
        safeUserFacingMessage(err, { fallback: 'Please try again.' }),
      );
    }
  }, [businessId, deleteService, isDeletingService, navigation, routeServiceId]);

  const confirmDeleteService = useCallback(() => {
    if (isDeletingService) return;
    Alert.alert('Remove service?', 'This service will be deleted. This cannot be undone.', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Delete',
        onPress: () => {
          void handleDeleteService();
        },
      },
    ]);
  }, [handleDeleteService, isDeletingService]);

  const confirmDeleteServiceRef = useRef(confirmDeleteService);
  confirmDeleteServiceRef.current = confirmDeleteService;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ServiceHeaderDeleteButton
          disabled={isDeletingService}
          onPress={() => confirmDeleteServiceRef.current()}
        />
      ),
    });
  }, [isDeletingService, navigation]);

  const handleEditorPullRefresh = useCallback(async () => {
    setEditorManualRefreshing(true);
    try {
      await refetchServiceEditor();
    } finally {
      setEditorManualRefreshing(false);
    }
  }, [refetchServiceEditor]);

  const editorRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={handleEditorPullRefresh}
        refreshing={editorManualRefreshing}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, editorManualRefreshing, handleEditorPullRefresh],
  );

  const editingAddon = useMemo(
    () => (editingAddonId ? (addonOptions.find((a) => a.id === editingAddonId) ?? null) : null),
    [addonOptions, editingAddonId],
  );
  const hasChanges = useMemo(() => {
    const currentSnapshot = buildEditorSnapshot({
      serviceName,
      description,
      price,
      durationHHmm,
      categoryId,
      multiPriceEnabled,
      pricingOptions,
      addonOptions,
      selectedAddonIds,
    });
    return currentSnapshot !== initialSnapshot;
  }, [
    addonOptions,
    categoryId,
    description,
    durationHHmm,
    initialSnapshot,
    multiPriceEnabled,
    price,
    pricingOptions,
    selectedAddonIds,
    serviceName,
  ]);

  function insertBulletPoint() {
    setDescription((current) => {
      const text = String(current ?? '');
      if (text.length >= DESCRIPTION_MAX_LENGTH) return text;
      if (text.trim().length === 0) return '• ';
      const needsLineBreak = !text.endsWith('\n');
      return `${text}${needsLineBreak ? '\n' : ''}• `.slice(0, DESCRIPTION_MAX_LENGTH);
    });
  }

  function toggleAddon(addonId) {
    setSelectedAddonIds((current) =>
      current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId],
    );
  }

  function handlePriceSave({ id, name, price: optionPrice, durationHHmm: optionDuration }) {
    if (pricingLocked) return;
    const label = String(name ?? '').trim();
    if (!label) return;

    if (id) {
      setPricingOptions((current) =>
        current.map((option) =>
          option.id === id
            ? { ...option, label, price: optionPrice, durationHHmm: optionDuration }
            : option,
        ),
      );
    } else {
      setPricingOptions((current) => [
        ...current,
        {
          id: `option-new-${Date.now()}`,
          label,
          price: optionPrice,
          durationHHmm: optionDuration,
        },
      ]);
    }
    setMultiPriceEnabled(true);
  }

  function openAddAddonSheet() {
    setEditingAddonId(null);
    setAddonSheetError('');
    setAddonSheetOpen(true);
  }

  async function handleAddonSheetSave({ name, price, durationHHmm, description }) {
    if (!businessId) {
      setAddonSheetError('Missing business context.');
      return;
    }
    try {
      setAddonSheetError('');
      const normalizedDuration = normalizeAddonDurationHHmm(durationHHmm);

      if (editingAddonId) {
        const { addon } = await mutateAddon({
          mode: 'update',
          addonId: editingAddonId,
          name,
          price,
          durationHHmm: normalizedDuration,
          description,
        });
        setAddonOptions((prev) => {
          const nextOptions = prev.map((a) => (a.id === editingAddonId ? addon : a));
          setSelectedAddonIds((curSel) => {
            setInitialSnapshot((s) => patchEditorSnapshotAddons(s, nextOptions, curSel));
            return curSel;
          });
          return nextOptions;
        });
      } else {
        const { addon } = await mutateAddon({
          mode: 'create',
          name,
          price,
          durationHHmm: normalizedDuration,
          description,
        });
        setAddonOptions((prev) => {
          const nextOptions = prev.filter((a) => a.id !== addon.id).concat(addon);
          setSelectedAddonIds((curSel) => {
            const nextSel = curSel.includes(addon.id) ? curSel : [...curSel, addon.id];
            setInitialSnapshot((s) => patchEditorSnapshotAddons(s, nextOptions, curSel));
            return nextSel;
          });
          return nextOptions;
        });
      }
      setAddonSheetOpen(false);
      setEditingAddonId(null);
    } catch (err) {
      setAddonSheetError(safeUserFacingMessage(err, { fallback: 'Could not save add-on' }));
    }
  }

  async function handleSaveChanges() {
    const validationError = validateEditorInput({
      serviceName,
      description,
      price,
      durationHHmm,
      pricingOptions,
      skipPricingOptionValidation: pricingLocked,
    });
    if (validationError) {
      showTransientSaveFeedback(validationError);
      return;
    }
    const addonValidationError = validateAddonInput(addonOptions);
    if (addonValidationError) {
      showTransientSaveFeedback(addonValidationError);
      return;
    }

    if (!businessId || !routeServiceId) {
      showTransientSaveFeedback('Missing service context. Please reopen this screen.');
      return;
    }

    const savedMultiPriceEnabled = !pricingLocked && pricingOptions.length > 0;

    const payload = {
      serviceDetails: {
        serviceName,
        description,
        price,
        durationMinutes: serviceDurationHHmmToMinutes(durationHHmm),
      },
      multiPriceEnabled: savedMultiPriceEnabled,
      pricingOptions: pricingOptions.map((option) => ({
        ...option,
        durationMinutes: serviceDurationHHmmToMinutes(option.durationHHmm),
      })),
      addonOptions: addonOptions.map((addon) => ({
        ...addon,
        durationMinutes: addon.durationHHmm ? serviceDurationHHmmToMinutes(addon.durationHHmm) : 0,
      })),
      selectedAddonIds,
      priceOptionLabelKey: fetchedEditorData?.priceOptionLabelKey ?? 'label',
      categoryId: categoryId.trim() || null,
    };

    try {
      if (saveFeedbackDismissTimerRef.current) {
        clearTimeout(saveFeedbackDismissTimerRef.current);
        saveFeedbackDismissTimerRef.current = null;
      }
      setSaveFeedback('');
      await saveChanges(payload);
      await refetchServiceEditor();
      setHydratedServiceId('');
      const nextSnapshot = buildEditorSnapshot({
        serviceName,
        description,
        price,
        durationHHmm,
        categoryId,
        multiPriceEnabled: savedMultiPriceEnabled,
        pricingOptions,
        addonOptions,
        selectedAddonIds,
      });
      setInitialSnapshot(nextSnapshot);
      setSaveFeedback('Saved');
      setTimeout(() => setSaveFeedback(''), 1500);
    } catch (error) {
      showTransientSaveFeedback(
        safeUserFacingMessage(error, { fallback: 'Could not save changes.' }),
      );
    }
  }

  const serverAddonCatalogKey = useMemo(
    () =>
      (fetchedEditorData?.addonOptions ?? [])
        .map((a) => String(a.id))
        .sort()
        .join('|'),
    [fetchedEditorData?.addonOptions],
  );

  /**
   * After initial hydrate, keep add-ons + selection aligned with the server (e.g. add-on deleted on Services).
   * `editorDataUpdatedAt` ensures we re-run after refetch even if list identity is reused.
   */
  useEffect(() => {
    if (!fetchedEditorData || !routeServiceId) return;
    if (hydratedServiceId !== routeServiceId) return;

    const nextAddons = fetchedEditorData.addonOptions ?? [];
    const prevCatalogKey = addonOptions
      .map((a) => String(a.id))
      .sort()
      .join('|');
    const catalogChanged = prevCatalogKey !== serverAddonCatalogKey;

    const mergedSelected = selectedAddonIds.filter((id) =>
      nextAddons.some((a) => String(a.id) === String(id)),
    );
    const hadOrphanSelection = mergedSelected.length !== selectedAddonIds.length;

    if (!catalogChanged && !hadOrphanSelection) return;

    if (catalogChanged) {
      setAddonOptions(nextAddons);
    }
    setSelectedAddonIds(mergedSelected);
    setInitialSnapshot((snap) => patchEditorSnapshotAddons(snap, nextAddons, mergedSelected));
  }, [
    addonOptions,
    editorDataUpdatedAt,
    fetchedEditorData,
    hydratedServiceId,
    routeServiceId,
    selectedAddonIds,
    serverAddonCatalogKey,
  ]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    setHydratedServiceId('');
  }, [routeServiceId]);

  useEffect(() => {
    if (!pricingLocked || !priceListOpen) return;
    setPriceListOpen(false);
  }, [priceListOpen, pricingLocked]);

  useEffect(() => {
    if (!fetchedEditorData || !routeServiceId || hydratedServiceId === routeServiceId) return;

    setServiceName(fetchedEditorData.serviceName ?? '');
    setDescription(fetchedEditorData.description ?? '');
    setPrice(fetchedEditorData.price ?? '');
    setDurationHHmm(fetchedEditorData.durationHHmm ?? '');
    setCategoryId(fetchedEditorData.categoryId ?? '');
    setMultiPriceEnabled(Boolean(fetchedEditorData.multiPriceEnabled));
    setPricingOptions(fetchedEditorData.pricingOptions ?? []);
    setAddonOptions(fetchedEditorData.addonOptions ?? []);
    setSelectedAddonIds(fetchedEditorData.selectedAddonIds ?? []);
    setInitialSnapshot(
      buildEditorSnapshot({
        serviceName: fetchedEditorData.serviceName ?? '',
        description: fetchedEditorData.description ?? '',
        price: fetchedEditorData.price ?? '',
        durationHHmm: fetchedEditorData.durationHHmm ?? '',
        categoryId: fetchedEditorData.categoryId ?? '',
        multiPriceEnabled: Boolean(fetchedEditorData.multiPriceEnabled),
        pricingOptions: fetchedEditorData.pricingOptions ?? [],
        addonOptions: fetchedEditorData.addonOptions ?? [],
        selectedAddonIds: fetchedEditorData.selectedAddonIds ?? [],
      }),
    );
    setHydratedServiceId(routeServiceId);
  }, [fetchedEditorData, hydratedServiceId, routeServiceId]);

  const sheetsLoading = Boolean(routeServiceId) && hydratedServiceId !== routeServiceId;
  const addonSummary = summarizeSelectedAddons({
    catalogAddons: sheetsLoading ? [] : addonOptions,
    pendingAddons: [],
    selectedAddonIds: sheetsLoading ? [] : selectedAddonIds,
  });
  const priceSummary = summarizePrices(sheetsLoading ? [] : pricingOptions);
  const sheetOpen = Boolean(priceListOpen || addonSheetOpen || addonPickerOpen);
  const showSaveButton = !keyboardVisible && !sheetOpen;
  const showDescriptionCount = description.length >= DESCRIPTION_MAX_LENGTH - 40;

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.root, { backgroundColor: colors.shell }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 108 },
          ]}
          keyboardShouldPersistTaps="handled"
          refreshControl={editorRefreshControl}
          showsVerticalScrollIndicator={false}
        >
          {!isEditorLoading && editorErrorMessage ? (
            <SurfaceCard style={styles.loadErrorCard}>
              <InlineCardError message={editorErrorMessage} />
              <Button
                accessibilityHint="Attempts to load service details again"
                accessibilityLabel="Try again"
                fullWidth
                loading={editorManualRefreshing}
                style={styles.loadErrorRetry}
                title="Try again"
                variant="secondary"
                onPress={() => void refetchServiceEditor()}
              />
            </SurfaceCard>
          ) : null}

          <View style={styles.details}>
            <SurfaceTextField
              compact
              containerStyle={styles.field}
              label="Service name"
              onChangeText={setServiceName}
              placeholder="Full detail"
              value={serviceName}
            />

            <View>
              <SurfaceTextField
                compact
                containerStyle={styles.descriptionField}
                label="Description"
                maxLength={DESCRIPTION_MAX_LENGTH}
                multiline
                onChangeText={(text) =>
                  setDescription(String(text ?? '').slice(0, DESCRIPTION_MAX_LENGTH))
                }
                placeholder="What customers get with this service"
                style={styles.descriptionInput}
                textAlignVertical="top"
                value={description}
              />
              <View style={styles.descriptionToolbar}>
                <Pressable
                  accessibilityLabel="Insert bullet point"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={insertBulletPoint}
                >
                  <View style={styles.bulletButton}>
                    <Ionicons color={colors.textMuted} name="list-outline" size={18} />
                  </View>
                </Pressable>
                {showDescriptionCount ? (
                  <AppText style={[styles.charCount, { color: colors.textMuted }]}>
                    {description.length}/{DESCRIPTION_MAX_LENGTH}
                  </AppText>
                ) : (
                  <View />
                )}
              </View>
            </View>

            <View style={styles.priceRow}>
              <SurfaceTextField
                compact
                containerStyle={styles.priceField}
                keyboardType="decimal-pad"
                label="Price"
                onChangeText={(text) => setPrice(normalizePriceInput(text))}
                value={`$${price}`}
              />
              <DurationSelectField
                compact
                containerStyle={styles.priceField}
                label="Duration"
                onValueChange={setDurationHHmm}
                value={durationHHmm}
              />
            </View>
          </View>

          {hasCategories ? (
            <View style={styles.group}>
              <ServiceCategoryPickerField
                hint={null}
                options={categorySelectOptionsWithNone}
                value={categoryId}
                onValueChange={handleCategoryIdChange}
              />
            </View>
          ) : null}

          {pricingAccessPending ? null : pricingLocked ? (
            <View style={styles.group}>
              <SettingsSection first title="Pricing options">
                <View style={styles.lockedBlock}>
                  <AppText style={[styles.lockedHint, { color: colors.textMuted }]}>
                    {serviceMultiplePricingAccessCopy.hint}
                  </AppText>
                  <Button
                    fullWidth
                    title={serviceMultiplePricingAccessCopy.buttonTitle}
                    variant="secondary"
                    onPress={() =>
                      showWebAccountFeatureAlert({
                        title: serviceMultiplePricingAccessCopy.alertTitle,
                        message: serviceMultiplePricingAccessCopy.alertMessage,
                      })
                    }
                  />
                </View>
              </SettingsSection>
            </View>
          ) : null}

          <View style={styles.group}>
            {pricingAccessPending || pricingLocked ? (
              <SettingsSection first>
                <ServiceAddonSummaryRow
                  summary={addonSummary}
                  onPress={() => setAddonPickerOpen(true)}
                />
              </SettingsSection>
            ) : (
              <SettingsSection first>
                <ServicePriceSummaryRow
                  summary={priceSummary}
                  onPress={() => {
                    setPriceFormFirst(pricingOptions.length === 0);
                    setPriceListOpen(true);
                  }}
                />
                <View style={styles.rowDivider}>
                  <View style={[styles.hairline, { backgroundColor: colors.border }]} />
                </View>
                <ServiceAddonSummaryRow
                  summary={addonSummary}
                  onPress={() => setAddonPickerOpen(true)}
                />
              </SettingsSection>
            )}
          </View>
        </ScrollView>

        {showSaveButton ? (
          <View style={[styles.stickySaveWrap, { bottom: Math.max(insets.bottom, 12) }]}>
            <Button
              disabled={!hasChanges || isSaving}
              fullWidth
              loading={isSaving}
              title={saveFeedback === 'Saved' ? 'Saved' : 'Save changes'}
              onPress={handleSaveChanges}
              variant="surfaceLight"
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <AddonEditorSheet
        allowBackdropClose={false}
        initialDescription={editingAddon?.description ?? ''}
        initialDurationHHmm={editingAddon?.durationHHmm ?? ''}
        initialName={editingAddon?.name ?? ''}
        initialPrice={editingAddon?.price ?? ''}
        isSaving={isSavingAddon}
        primaryButtonTitle={editingAddonId ? 'Save' : 'Add add-on'}
        submitError={addonSheetError}
        title={editingAddonId ? 'Edit add-on' : 'New add-on'}
        visible={addonSheetOpen}
        onRequestClose={() => {
          setAddonSheetOpen(false);
          setEditingAddonId(null);
          setAddonSheetError('');
        }}
        onSave={handleAddonSheetSave}
      />

      <ServicePriceListSheet
        loading={sheetsLoading}
        options={sheetsLoading ? [] : pricingOptions}
        startOnForm={priceFormFirst}
        visible={priceListOpen}
        onRemove={(id) => {
          if (pricingLocked) return;
          const next = pricingOptions.filter((option) => option.id !== id);
          setPricingOptions(next);
          if (next.length === 0) {
            setMultiPriceEnabled(false);
            setPriceListOpen(false);
          }
        }}
        onRequestClose={() => setPriceListOpen(false)}
        onSave={handlePriceSave}
      />
      <ServiceAddonPickerSheet
        catalogAddons={sheetsLoading ? [] : addonOptions}
        loading={sheetsLoading}
        pendingAddons={[]}
        selectedAddonIds={sheetsLoading ? [] : selectedAddonIds}
        visible={addonPickerOpen && !addonSheetOpen}
        onAdd={openAddAddonSheet}
        onRequestClose={() => setAddonPickerOpen(false)}
        onToggleCatalog={toggleAddon}
      />

      {(saveFeedback && saveFeedback !== 'Saved') || saveError ? (
        <View style={[styles.saveFeedbackWrap, { backgroundColor: 'rgba(127,29,29,0.9)' }]}>
          <AppText style={styles.saveFeedbackText}>
            {safeUserFacingMessage(saveError || saveFeedback, {
              fallback: 'Something went wrong. Please try again.',
            })}
          </AppText>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadErrorCard: {
    marginBottom: 16,
  },
  loadErrorRetry: {
    marginTop: 12,
  },
  details: {
    gap: 16,
  },
  field: {
    marginBottom: 0,
  },
  descriptionField: {
    marginBottom: 0,
  },
  group: {
    marginTop: 24,
  },
  descriptionInput: {
    maxHeight: 180,
    minHeight: 96,
  },
  descriptionToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bulletButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  charCount: {
    fontSize: 12,
  },
  priceRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 10,
  },
  priceField: {
    flex: 1,
    marginBottom: 0,
    marginTop: 0,
    minWidth: 0,
  },
  rowDivider: {
    paddingHorizontal: 16,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.55,
  },
  lockedBlock: {
    gap: 12,
    padding: 16,
  },
  lockedHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  stickySaveWrap: {
    left: 16,
    position: 'absolute',
    right: 16,
    backgroundColor: 'transparent',
  },
  saveFeedbackWrap: {
    alignSelf: 'center',
    borderRadius: 10,
    bottom: 10,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 16,
  },
  saveFeedbackText: {
    color: '#fee2e2',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
