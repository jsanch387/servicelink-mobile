import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  DurationSelectField,
  InlineCardError,
  SurfaceCard,
  SurfaceTextField,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import {
  formatServiceDurationSelectLabel,
  serviceDurationHHmmToMinutes,
} from '../../../components/ui/durationTime';
import { useAuth } from '../../auth';
import { useSubscription, showWebAccountFeatureAlert } from '../../subscription';
import { serviceMultiplePricingAccessCopy } from '../constants/servicePricingAccessCopy';
import { AddonEditorSheet } from '../components/AddonEditorSheet';
import { CollapsibleEditorSectionCard } from '../components/CollapsibleEditorSectionCard';
import { ServiceCategorySectionContent } from '../categories';
import { SelectableAddonCard } from '../components/SelectableAddonCard';
import { buildServiceEditDraft } from '../utils/buildServiceEditDraft';
import { normalizeAddonDurationHHmm } from '../utils/serviceAddonModel';
import { useDeleteServiceAddon } from '../hooks/useDeleteServiceAddon';
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

/** Dimmed preview when multiple prices are managed on web and none are saved yet. */
const MOCK_PRICING_OPTION_PREVIEW = {
  label: 'Larger vehicle',
  price: '180',
  durationHHmm: '04:00',
};

function validateEditorInput({
  serviceName,
  description,
  price,
  durationHHmm,
  pricingOptions,
  multiPriceEnabled,
  skipPricingOptionValidation,
}) {
  if (!String(serviceName ?? '').trim()) return 'Service name is required.';
  if (!String(description ?? '').trim()) return 'Service description is required.';
  if (!String(price ?? '').trim()) return 'Service price is required.';
  if (!String(durationHHmm ?? '').trim()) return 'Service duration is required.';

  if (skipPricingOptionValidation) return null;

  if (multiPriceEnabled && (pricingOptions?.length ?? 0) === 0) {
    return 'Add at least one pricing option before offering multiple prices.';
  }

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
  const { user } = useAuth();
  const {
    hasProAccess,
    isReady: subscriptionReady,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const stickyBarHeight = 84;
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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const [addonsExpanded, setAddonsExpanded] = useState(false);
  const [multiPriceEnabled, setMultiPriceEnabled] = useState(true);
  const [selectedAddonIds, setSelectedAddonIds] = useState(initialSelectedAddonIds);
  const [addonSheetOpen, setAddonSheetOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [addonSheetError, setAddonSheetError] = useState('');
  const [pricingOptionSheetOpen, setPricingOptionSheetOpen] = useState(false);
  const [editingPricingOptionId, setEditingPricingOptionId] = useState(null);
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

  const blockPricingControls = Boolean(user?.id) && (!subscriptionReady || !hasProAccess);

  const editingPricingOption = useMemo(
    () =>
      editingPricingOptionId
        ? (pricingOptions.find((o) => o.id === editingPricingOptionId) ?? null)
        : null,
    [editingPricingOptionId, pricingOptions],
  );

  const categoryCollapsedSubtitle = useMemo(() => {
    if (categoryExpanded) return null;
    if (categories.length === 0) return 'No categories set up';
    const selected = categories.find((cat) => cat.id === categoryId);
    return selected?.name ?? 'Not assigned';
  }, [categories, categoryExpanded, categoryId]);

  const pricingCollapsedSubtitle = useMemo(() => {
    if (pricingExpanded) return null;
    if (blockPricingControls) {
      if (pricingOptions.length > 0) {
        return serviceMultiplePricingAccessCopy.collapsedSubtitleWithSaved(pricingOptions.length);
      }
      return serviceMultiplePricingAccessCopy.collapsedSubtitleEmpty;
    }
    return `${pricingOptions.length} option${pricingOptions.length === 1 ? '' : 's'}`;
  }, [blockPricingControls, pricingExpanded, pricingOptions.length]);

  const handleMultiPriceToggle = useCallback(
    (nextEnabled) => {
      if (blockPricingControls) return;
      if (nextEnabled && pricingOptions.length === 0) {
        const msg = 'Add at least one pricing option before turning this on.';
        setSaveFeedback(msg);
        setTimeout(() => {
          setSaveFeedback((current) => (current === msg ? '' : current));
        }, 4000);
        return;
      }
      setMultiPriceEnabled(nextEnabled);
    },
    [blockPricingControls, pricingOptions.length],
  );

  const handleCategoryIdChange = useCallback((nextCategoryId) => {
    setCategoryId(nextCategoryId);
  }, []);

  useEffect(() => {
    if (blockPricingControls) return;
    if (multiPriceEnabled && pricingOptions.length === 0) {
      setMultiPriceEnabled(false);
    }
  }, [blockPricingControls, multiPriceEnabled, pricingOptions.length]);

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
  const { mutateAddon, isSavingAddon } = useMutateServiceAddon({
    businessId,
    userId: user?.id,
    serviceId: routeServiceId,
  });
  const { deleteAddon, isDeletingAddon } = useDeleteServiceAddon({
    businessId,
    userId: user?.id,
    serviceId: routeServiceId,
  });

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
      if (text.trim().length === 0) {
        return '• ';
      }
      const needsLineBreak = !text.endsWith('\n');
      return `${text}${needsLineBreak ? '\n' : ''}• `;
    });
  }

  function toggleAddon(addonId) {
    setSelectedAddonIds((current) =>
      current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId],
    );
  }

  function openAddPricingOptionSheet() {
    if (blockPricingControls) return;
    setEditingPricingOptionId(null);
    setPricingOptionSheetOpen(true);
  }

  function openEditPricingOptionSheet(option) {
    if (blockPricingControls) return;
    setEditingPricingOptionId(option.id);
    setPricingOptionSheetOpen(true);
  }

  async function handlePricingOptionSheetSave({ name, price, durationHHmm }) {
    if (blockPricingControls) return;
    const label = String(name ?? '').trim();
    if (!label) return;

    if (editingPricingOptionId) {
      setPricingOptions((current) =>
        current.map((option) =>
          option.id === editingPricingOptionId
            ? {
                ...option,
                label,
                price,
                durationHHmm,
              }
            : option,
        ),
      );
    } else {
      const nextId = `option-new-${Date.now()}`;
      setPricingOptions((current) => [
        ...current,
        {
          id: nextId,
          label,
          price,
          durationHHmm,
        },
      ]);
    }
    setEditingPricingOptionId(null);
    setPricingOptionSheetOpen(false);
  }

  function openAddAddonSheet() {
    setEditingAddonId(null);
    setAddonSheetError('');
    setAddonSheetOpen(true);
  }

  function openEditAddonSheet(addon) {
    setEditingAddonId(addon.id);
    setAddonSheetError('');
    setAddonSheetOpen(true);
  }

  async function handleAddonSheetSave({ name, price, durationHHmm }) {
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
        });
        setAddonOptions((prev) => {
          const nextOptions = prev.filter((a) => a.id !== addon.id).concat(addon);
          setSelectedAddonIds((curSel) => {
            setInitialSnapshot((s) => patchEditorSnapshotAddons(s, nextOptions, curSel));
            return curSel;
          });
          return nextOptions;
        });
        setAddonsExpanded(true);
      }
      setAddonSheetOpen(false);
      setEditingAddonId(null);
    } catch (err) {
      setAddonSheetError(safeUserFacingMessage(err, { fallback: 'Could not save add-on' }));
    }
  }

  function confirmDeleteAddon(addon) {
    const name = String(addon?.name ?? 'This add-on').trim() || 'This add-on';
    Alert.alert(
      'Delete add-on?',
      `"${name}" will be removed from every service. This can't be undone.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            void handleDeleteAddon(addon);
          },
        },
      ],
    );
  }

  async function handleDeleteAddon(addon) {
    try {
      setSaveFeedback('');
      await deleteAddon({ addonId: addon.id });
      const nextOptions = addonOptions.filter((a) => a.id !== addon.id);
      const nextSelected = selectedAddonIds.filter((id) => id !== addon.id);
      setAddonOptions(nextOptions);
      setSelectedAddonIds(nextSelected);
      setInitialSnapshot((s) => patchEditorSnapshotAddons(s, nextOptions, nextSelected));
      if (editingAddonId === addon.id) {
        setAddonSheetOpen(false);
        setEditingAddonId(null);
      }
    } catch (err) {
      showTransientSaveFeedback(
        safeUserFacingMessage(err, { fallback: 'Could not delete add-on.' }),
      );
    }
  }

  function handleDeletePricingOption(option) {
    if (blockPricingControls) return;
    setSaveFeedback('');
    setPricingOptions((prev) => prev.filter((o) => o.id !== option.id));
    if (editingPricingOptionId === option.id) {
      setPricingOptionSheetOpen(false);
      setEditingPricingOptionId(null);
    }
  }

  async function handleSaveChanges() {
    const validationError = validateEditorInput({
      serviceName,
      description,
      price,
      durationHHmm,
      pricingOptions,
      multiPriceEnabled: !blockPricingControls && multiPriceEnabled,
      skipPricingOptionValidation: blockPricingControls,
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

    const savedMultiPriceEnabled =
      !blockPricingControls && multiPriceEnabled && pricingOptions.length > 0;

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
    if (!blockPricingControls || !pricingOptionSheetOpen) return;
    setPricingOptionSheetOpen(false);
    setEditingPricingOptionId(null);
  }, [blockPricingControls, pricingOptionSheetOpen]);

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
            { paddingBottom: Math.max(insets.bottom, 16) + stickyBarHeight + 20 },
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

          <CollapsibleEditorSectionCard
            expanded={detailsExpanded}
            onToggle={() => setDetailsExpanded((v) => !v)}
            subtitle={!detailsExpanded ? serviceName : null}
            title="Service details"
          >
            <View style={styles.detailsFormSection}>
              <SurfaceTextField
                containerStyle={styles.detailsFieldFlush}
                label="Service name"
                onChangeText={setServiceName}
                value={serviceName}
              />
            </View>
            <View style={styles.detailsFormSection}>
              <SurfaceTextField
                containerStyle={styles.detailsFieldFlush}
                label="Description"
                multiline
                onChangeText={setDescription}
                style={styles.descriptionInput}
                textAlignVertical="top"
                value={description}
              />
              <View style={styles.descriptionToolbar}>
                <Pressable
                  accessibilityLabel="Insert bullet point"
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.bulletButton}
                  onPress={insertBulletPoint}
                >
                  <Ionicons color={colors.textMuted} name="list-outline" size={18} />
                </Pressable>
                <AppText style={[styles.charCount, { color: colors.textMuted }]}>
                  {description.length}/800
                </AppText>
              </View>
            </View>
            <View style={styles.detailsFormSection}>
              <SurfaceTextField
                containerStyle={[styles.detailsFieldFlush, styles.detailsPriceField]}
                keyboardType="decimal-pad"
                label="Price"
                onChangeText={(text) => setPrice(normalizePriceInput(text))}
                value={`$${price}`}
              />
              <DurationSelectField
                containerStyle={styles.detailsDurationField}
                label="Duration"
                onValueChange={setDurationHHmm}
                triggerStyle={{ borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1 }}
                value={durationHHmm}
              />
            </View>
          </CollapsibleEditorSectionCard>

          <CollapsibleEditorSectionCard
            contentStyle={styles.categoryContent}
            expanded={categoryExpanded}
            onToggle={() => setCategoryExpanded((v) => !v)}
            subtitle={categoryCollapsedSubtitle}
            title="Category"
          >
            <ServiceCategorySectionContent
              categories={categories}
              categoryId={categoryId}
              categorySelectOptionsWithNone={categorySelectOptionsWithNone}
              onCategoryIdChange={handleCategoryIdChange}
            />
          </CollapsibleEditorSectionCard>

          <CollapsibleEditorSectionCard
            contentStyle={styles.pricingContent}
            expanded={pricingExpanded}
            onToggle={() => setPricingExpanded((v) => !v)}
            subtitle={pricingCollapsedSubtitle}
            title="Pricing options"
          >
            <View style={[styles.switchCard, { borderColor: colors.border }]}>
              <AppText style={[styles.switchText, { color: colors.text }]}>
                Offer multiple prices
              </AppText>
              <View style={styles.switchControlWrap}>
                <Switch
                  disabled={blockPricingControls}
                  thumbColor={
                    (blockPricingControls ? false : multiPriceEnabled) ? '#f8fafc' : '#f4f4f5'
                  }
                  trackColor={{ false: colors.borderStrong, true: '#10b981' }}
                  value={blockPricingControls ? false : multiPriceEnabled}
                  onValueChange={blockPricingControls ? () => {} : handleMultiPriceToggle}
                />
              </View>
            </View>

            <AppText style={[styles.pricingHint, { color: colors.textMuted }]}>
              {subscriptionLoading
                ? 'Loading…'
                : blockPricingControls
                  ? serviceMultiplePricingAccessCopy.hint
                  : 'Your lowest price option is shown as "Starting at" to customers.'}
            </AppText>

            {blockPricingControls ? (
              <Button
                fullWidth
                style={styles.webAccessButtonSpacing}
                title={serviceMultiplePricingAccessCopy.buttonTitle}
                variant="secondary"
                onPress={() =>
                  showWebAccountFeatureAlert({
                    title: serviceMultiplePricingAccessCopy.alertTitle,
                    message: serviceMultiplePricingAccessCopy.alertMessage,
                  })
                }
              />
            ) : null}

            {!blockPricingControls ? (
              <Button
                fullWidth
                iconName="add"
                style={styles.pricingAddButton}
                title="Add option"
                variant="outline"
                onPress={openAddPricingOptionSheet}
              />
            ) : null}

            {blockPricingControls && pricingOptions.length === 0 ? (
              <View
                accessible={false}
                pointerEvents="none"
                style={[styles.optionCard, styles.mockOptionCard, { borderColor: colors.border }]}
              >
                <View style={styles.optionHeaderRow}>
                  <View style={[styles.optionHeaderTap, styles.optionReadOnlyTap]}>
                    <View style={styles.optionMain}>
                      <AppText
                        numberOfLines={2}
                        style={[styles.optionTitle, { color: colors.text }]}
                      >
                        {MOCK_PRICING_OPTION_PREVIEW.label}
                      </AppText>
                      <AppText
                        numberOfLines={1}
                        style={[styles.optionMeta, { color: colors.textMuted }]}
                      >
                        ${MOCK_PRICING_OPTION_PREVIEW.price} ·{' '}
                        {formatServiceDurationSelectLabel(MOCK_PRICING_OPTION_PREVIEW.durationHHmm)}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            {pricingOptions.map((option) => {
              return (
                <View key={option.id} style={[styles.optionCard, { borderColor: colors.border }]}>
                  <View style={styles.optionHeaderRow}>
                    {blockPricingControls ? null : (
                      <Pressable
                        accessibilityLabel="Delete pricing option"
                        accessibilityRole="button"
                        hitSlop={10}
                        onPress={() => handleDeletePricingOption(option)}
                        style={styles.optionTrashHit}
                      >
                        <Ionicons color="#fb7185" name="trash-outline" size={18} />
                      </Pressable>
                    )}
                    {blockPricingControls ? (
                      <View style={[styles.optionHeaderTap, styles.optionReadOnlyTap]}>
                        <View style={styles.optionMain}>
                          <AppText
                            numberOfLines={2}
                            style={[styles.optionTitle, { color: colors.text }]}
                          >
                            {option.label}
                          </AppText>
                          <AppText
                            numberOfLines={1}
                            style={[styles.optionMeta, { color: colors.textMuted }]}
                          >
                            {option.price ? `$${option.price}` : 'No price'} ·{' '}
                            {option.durationHHmm
                              ? formatServiceDurationSelectLabel(option.durationHHmm)
                              : 'No duration'}
                          </AppText>
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openEditPricingOptionSheet(option)}
                        style={styles.optionHeaderTap}
                      >
                        <View style={styles.optionMain}>
                          <AppText
                            numberOfLines={2}
                            style={[styles.optionTitle, { color: colors.text }]}
                          >
                            {option.label}
                          </AppText>
                          <AppText
                            numberOfLines={1}
                            style={[styles.optionMeta, { color: colors.textMuted }]}
                          >
                            {option.price ? `$${option.price}` : 'No price'} ·{' '}
                            {option.durationHHmm
                              ? formatServiceDurationSelectLabel(option.durationHHmm)
                              : 'No duration'}
                          </AppText>
                        </View>
                        <View style={styles.optionChevronHit}>
                          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
                        </View>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </CollapsibleEditorSectionCard>

          <CollapsibleEditorSectionCard
            contentStyle={styles.addonsContent}
            expanded={addonsExpanded}
            onToggle={() => setAddonsExpanded((v) => !v)}
            subtitle={!addonsExpanded ? `${selectedAddonIds.length} selected` : null}
            title="Add-ons"
          >
            {addonOptions.map((addon) => (
              <SelectableAddonCard
                key={addon.id}
                addon={addon}
                deleteDisabled={isDeletingAddon}
                onDelete={() => confirmDeleteAddon(addon)}
                onEdit={() => openEditAddonSheet(addon)}
                onToggle={() => toggleAddon(addon.id)}
                selected={selectedAddonIds.includes(addon.id)}
              />
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={openAddAddonSheet}
              style={[styles.addAddonButton, { borderColor: colors.borderStrong }]}
            >
              <Ionicons color="#00d084" name="add" size={18} />
              <AppText style={styles.addAddonText}>Add new add-on</AppText>
            </Pressable>
          </CollapsibleEditorSectionCard>
        </ScrollView>

        {!addonSheetOpen && !pricingOptionSheetOpen && !keyboardVisible ? (
          <View
            style={[
              styles.stickySaveWrap,
              {
                bottom: Math.max(insets.bottom - 12, 0),
              },
            ]}
          >
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
        initialDurationHHmm={editingAddon?.durationHHmm ?? ''}
        initialName={editingAddon?.name ?? ''}
        initialPrice={editingAddon?.price ?? ''}
        isSaving={isSavingAddon}
        primaryButtonTitle={editingAddonId ? 'Save' : 'Save add-on'}
        submitError={addonSheetError}
        title={editingAddonId ? 'Edit add-on' : 'Add new add-on'}
        visible={addonSheetOpen}
        onRequestClose={() => {
          setAddonSheetOpen(false);
          setEditingAddonId(null);
          setAddonSheetError('');
        }}
        onSave={handleAddonSheetSave}
      />

      <AddonEditorSheet
        allowBackdropClose={false}
        durationMode="service"
        durationPlaceholder="Select duration"
        initialDurationHHmm={editingPricingOption?.durationHHmm ?? ''}
        initialName={editingPricingOption?.label ?? ''}
        initialPrice={editingPricingOption?.price ?? ''}
        primaryButtonTitle={editingPricingOptionId ? 'Save' : 'Add option'}
        submitError=""
        title={editingPricingOptionId ? 'Edit option' : 'Add new option'}
        visible={pricingOptionSheetOpen}
        onRequestClose={() => {
          setPricingOptionSheetOpen(false);
          setEditingPricingOptionId(null);
        }}
        onSave={handlePricingOptionSheetSave}
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
    paddingTop: 6,
  },
  loadErrorCard: {
    marginBottom: 12,
  },
  loadErrorRetry: {
    marginTop: 12,
  },
  descriptionInput: {
    minHeight: 140,
    paddingTop: 12,
  },
  /** Match onboarding add-service vertical rhythm (`OnboardingServicesStep`). */
  detailsFormSection: {
    marginBottom: 16,
  },
  detailsFieldFlush: {
    marginBottom: 0,
  },
  detailsPriceField: {
    marginBottom: 12,
  },
  detailsDurationField: {
    marginBottom: 0,
    marginTop: 0,
  },
  descriptionToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    marginTop: 8,
  },
  bulletButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  charCount: {
    fontSize: 12,
  },
  switchCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  switchControlWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pricingHint: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  pricingContent: {
    paddingTop: 12,
  },
  categoryContent: {
    paddingTop: 8,
  },
  addonsContent: {
    paddingTop: 12,
  },
  addAddonButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 44,
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addAddonText: {
    color: '#00d084',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
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
  optionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  optionHeaderRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 4,
    minHeight: 48,
  },
  optionHeaderTap: {
    alignItems: 'stretch',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    minWidth: 0,
  },
  optionTrashHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    width: 40,
  },
  optionMain: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 2,
    minWidth: 0,
  },
  optionReadOnlyTap: {
    flex: 1,
  },
  optionChevronHit: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    width: 28,
  },
  webAccessButtonSpacing: {
    marginBottom: 10,
  },
  pricingAddButton: {
    marginBottom: 8,
  },
  mockOptionCard: {
    marginTop: 4,
    opacity: 0.5,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.15,
    lineHeight: 18,
    marginBottom: 1,
  },
  optionMeta: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
});
