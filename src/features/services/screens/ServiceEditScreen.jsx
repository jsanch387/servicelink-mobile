import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, DurationSelectField, SurfaceTextField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  formatServiceDurationSelectLabel,
  serviceDurationHHmmToMinutes,
} from '../../../components/ui/durationTime';
import { useAuth } from '../../auth';
import { AddonEditorSheet } from '../components/AddonEditorSheet';
import { CollapsibleEditorSectionCard } from '../components/CollapsibleEditorSectionCard';
import { SelectableAddonCard } from '../components/SelectableAddonCard';
import { buildServiceEditDraft } from '../utils/buildServiceEditDraft';
import { normalizeAddonDurationHHmm } from '../utils/serviceAddonModel';
import { useDeleteServicePriceOption } from '../hooks/useDeleteServicePriceOption';
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

function validateEditorInput({ serviceName, description, price, durationHHmm, pricingOptions }) {
  if (!String(serviceName ?? '').trim()) return 'Service name is required.';
  if (!String(description ?? '').trim()) return 'Service description is required.';
  if (!String(price ?? '').trim()) return 'Service price is required.';
  if (!String(durationHHmm ?? '').trim()) return 'Service duration is required.';

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

export function ServiceEditScreen({ route }) {
  const { user } = useAuth();
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
  } = useServiceEditData(routeServiceId, routeService);
  const [serviceName, setServiceName] = useState(initialDraft.serviceName);
  const [description, setDescription] = useState(initialDraft.description);
  const [price, setPrice] = useState(initialDraft.price);
  const [durationHHmm, setDurationHHmm] = useState(initialDraft.durationHHmm);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const [addonsExpanded, setAddonsExpanded] = useState(false);
  const [multiPriceEnabled, setMultiPriceEnabled] = useState(true);
  const [selectedAddonIds, setSelectedAddonIds] = useState(initialSelectedAddonIds);
  const [addonSheetOpen, setAddonSheetOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState(null);
  const [addonSheetError, setAddonSheetError] = useState('');
  const [pricingOptionSheetOpen, setPricingOptionSheetOpen] = useState(false);
  const [editingPricingOptionId, setEditingPricingOptionId] = useState(null);
  const [pricingOptionDraftName, setPricingOptionDraftName] = useState('');
  const [pricingOptionDraftPrice, setPricingOptionDraftPrice] = useState('');
  const [pricingOptionDraftDurationHHmm, setPricingOptionDraftDurationHHmm] = useState('');
  const [pricingOptions, setPricingOptions] = useState(initialPricingOptions);
  const [addonOptions, setAddonOptions] = useState(initialAddonOptions);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    buildEditorSnapshot({
      ...fallbackEditorModel,
    }),
  );
  const [hydratedServiceId, setHydratedServiceId] = useState('');
  const canAddPricingOption = pricingOptionDraftName.trim().length > 0;
  const allowPricingModalBackdropClose = false;
  const { saveChanges, isSaving, saveError } = useSaveServiceEdits({
    businessId,
    serviceId: routeServiceId,
    userId: user?.id,
  });
  const { deletePricingOption, isDeleting: isDeletingPriceOption } = useDeleteServicePriceOption({
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
      multiPriceEnabled,
      pricingOptions,
      addonOptions,
      selectedAddonIds,
    });
    return currentSnapshot !== initialSnapshot;
  }, [
    addonOptions,
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
    setPricingOptionDraftName('New option');
    setPricingOptionDraftPrice('');
    setPricingOptionDraftDurationHHmm('');
    setEditingPricingOptionId(null);
    setPricingOptionSheetOpen(true);
  }

  function openEditPricingOptionSheet(option) {
    setEditingPricingOptionId(option.id);
    setPricingOptionDraftName(option.label);
    setPricingOptionDraftPrice(option.price);
    setPricingOptionDraftDurationHHmm(option.durationHHmm);
    setPricingOptionSheetOpen(true);
  }

  function savePricingOptionDraft() {
    if (!canAddPricingOption) return;
    if (editingPricingOptionId) {
      setPricingOptions((current) =>
        current.map((option) =>
          option.id === editingPricingOptionId
            ? {
                ...option,
                label: pricingOptionDraftName.trim(),
                price: pricingOptionDraftPrice,
                durationHHmm: pricingOptionDraftDurationHHmm,
              }
            : option,
        ),
      );
    } else {
      const nextId = `option-new-${Date.now()}`;
      const nextOption = {
        id: nextId,
        label: pricingOptionDraftName.trim(),
        price: pricingOptionDraftPrice,
        durationHHmm: pricingOptionDraftDurationHHmm,
      };
      setPricingOptions((current) => [...current, nextOption]);
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
        const nextOptions = addonOptions.map((a) => (a.id === editingAddonId ? addon : a));
        setAddonOptions(nextOptions);
        setInitialSnapshot((s) => patchEditorSnapshotAddons(s, nextOptions, selectedAddonIds));
      } else {
        const { addon } = await mutateAddon({
          mode: 'create',
          name,
          price,
          durationHHmm: normalizedDuration,
        });
        const nextOptions = [...addonOptions, addon];
        const nextSelected = [...new Set([...selectedAddonIds, addon.id])];
        setAddonOptions(nextOptions);
        setSelectedAddonIds(nextSelected);
        setInitialSnapshot((s) => patchEditorSnapshotAddons(s, nextOptions, nextSelected));
      }
      setAddonSheetOpen(false);
      setEditingAddonId(null);
    } catch (err) {
      setAddonSheetError(err?.message ?? 'Could not save add-on');
    }
  }

  function confirmDeleteAddon(addon) {
    Alert.alert(
      'Remove add-on?',
      'This add-on will be deleted. It will be removed from any services that use it. This cannot be undone.',
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
      setSaveFeedback(err?.message ?? 'Could not delete add-on.');
    }
  }

  function closeModalFromBackdrop(allowClose, onClose) {
    if (!allowClose) return;
    onClose();
  }

  function confirmDeletePricingOption(option) {
    Alert.alert(
      'Remove pricing option?',
      'This will be removed from the service. This cannot be undone.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete',
          onPress: () => {
            void handleDeletePricingOption(option);
          },
        },
      ],
    );
  }

  async function handleDeletePricingOption(option) {
    try {
      setSaveFeedback('');
      await deletePricingOption({ optionId: option.id });
      setPricingOptions((prev) => prev.filter((o) => o.id !== option.id));
      if (editingPricingOptionId === option.id) {
        setPricingOptionSheetOpen(false);
        setEditingPricingOptionId(null);
      }
    } catch (err) {
      setSaveFeedback(err?.message ?? 'Could not delete pricing option.');
    }
  }

  async function handleSaveChanges() {
    const validationError = validateEditorInput({
      serviceName,
      description,
      price,
      durationHHmm,
      pricingOptions,
    });
    if (validationError) {
      setSaveFeedback(validationError);
      return;
    }
    const addonValidationError = validateAddonInput(addonOptions);
    if (addonValidationError) {
      setSaveFeedback(addonValidationError);
      return;
    }

    if (!businessId || !routeServiceId) {
      setSaveFeedback('Missing service context. Please reopen this screen.');
      return;
    }

    const payload = {
      serviceDetails: {
        serviceName,
        description,
        price,
        durationMinutes: serviceDurationHHmmToMinutes(durationHHmm),
      },
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
    };

    try {
      setSaveFeedback('');
      await saveChanges(payload);
      setHydratedServiceId('');
      const nextSnapshot = buildEditorSnapshot({
        serviceName,
        description,
        price,
        durationHHmm,
        multiPriceEnabled,
        pricingOptions,
        addonOptions,
        selectedAddonIds,
      });
      setInitialSnapshot(nextSnapshot);
      setSaveFeedback('Saved');
      setTimeout(() => setSaveFeedback(''), 1500);
    } catch (error) {
      setSaveFeedback(error?.message ?? 'Could not save changes.');
    }
  }

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
    if (!fetchedEditorData || !routeServiceId || hydratedServiceId === routeServiceId) return;

    setServiceName(fetchedEditorData.serviceName ?? '');
    setDescription(fetchedEditorData.description ?? '');
    setPrice(fetchedEditorData.price ?? '');
    setDurationHHmm(fetchedEditorData.durationHHmm ?? '');
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
          showsVerticalScrollIndicator={false}
        >
          {isEditorLoading ? (
            <AppText style={[styles.loadStateText, { color: colors.textMuted }]}>
              Loading latest service details...
            </AppText>
          ) : null}
          {editorErrorMessage ? (
            <AppText style={[styles.loadStateText, { color: '#fca5a5' }]}>
              {editorErrorMessage}
            </AppText>
          ) : null}

          <CollapsibleEditorSectionCard
            expanded={detailsExpanded}
            onToggle={() => setDetailsExpanded((v) => !v)}
            subtitle={!detailsExpanded ? serviceName : null}
            title="Service details"
          >
            <SurfaceTextField
              label="Service name"
              onChangeText={setServiceName}
              value={serviceName}
            />
            <SurfaceTextField
              containerStyle={{ marginBottom: 8 }}
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
            <SurfaceTextField
              keyboardType="decimal-pad"
              label="Price"
              onChangeText={(text) => setPrice(normalizePriceInput(text))}
              value={`$${price}`}
            />
            <DurationSelectField
              label="Duration"
              onValueChange={setDurationHHmm}
              triggerStyle={{ borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1 }}
              value={durationHHmm}
            />
          </CollapsibleEditorSectionCard>

          <CollapsibleEditorSectionCard
            contentStyle={styles.pricingContent}
            expanded={pricingExpanded}
            onToggle={() => setPricingExpanded((v) => !v)}
            subtitle={
              !pricingExpanded
                ? `${pricingOptions.length} option${pricingOptions.length === 1 ? '' : 's'}`
                : null
            }
            title="Pricing options"
          >
            <View style={[styles.switchCard, { borderColor: colors.border }]}>
              <AppText style={[styles.switchText, { color: colors.text }]}>
                Offer multiple prices
              </AppText>
              <View style={styles.switchControlWrap}>
                <Switch
                  onValueChange={setMultiPriceEnabled}
                  thumbColor={multiPriceEnabled ? '#f8fafc' : '#f4f4f5'}
                  trackColor={{ false: colors.borderStrong, true: '#10b981' }}
                  value={multiPriceEnabled}
                />
              </View>
            </View>

            <AppText style={[styles.pricingHint, { color: colors.textMuted }]}>
              The price and time at the top should be your lowest one. That is your starting at
              value.
            </AppText>

            <Button
              fullWidth
              iconName="add"
              title="Add option"
              variant="outline"
              onPress={openAddPricingOptionSheet}
            />

            {pricingOptions.map((option) => {
              return (
                <View key={option.id} style={[styles.optionCard, { borderColor: colors.border }]}>
                  <View style={styles.optionHeaderRow}>
                    <Pressable
                      accessibilityLabel="Delete pricing option"
                      accessibilityRole="button"
                      disabled={isDeletingPriceOption}
                      hitSlop={10}
                      onPress={() => confirmDeletePricingOption(option)}
                      style={styles.optionTrashHit}
                    >
                      <Ionicons color="#fb7185" name="trash-outline" size={20} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => openEditPricingOptionSheet(option)}
                      style={styles.optionHeaderTap}
                    >
                      <View style={styles.optionMain}>
                        <AppText style={[styles.optionTitle, { color: colors.text }]}>
                          {option.label}
                        </AppText>
                        <AppText style={[styles.optionMeta, { color: colors.textMuted }]}>
                          {option.price ? `$${option.price}` : 'No price'} -{' '}
                          {option.durationHHmm
                            ? formatServiceDurationSelectLabel(option.durationHHmm)
                            : 'No duration'}
                        </AppText>
                      </View>
                      <Ionicons color={colors.textMuted} name="chevron-forward" size={22} />
                    </Pressable>
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
              <Ionicons color="#00d084" name="add" size={20} />
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

      <Modal
        animationType="fade"
        onRequestClose={() => setPricingOptionSheetOpen(false)}
        transparent
        visible={pricingOptionSheetOpen}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={styles.modalRoot}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              closeModalFromBackdrop(allowPricingModalBackdropClose, () =>
                setPricingOptionSheetOpen(false),
              )
            }
            style={styles.addonSheetBackdrop}
          />
          <View
            style={[
              styles.addonSheetWrap,
              {
                backgroundColor: colors.shellElevated,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.addonSheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <AppText style={[styles.addonSheetTitle, { color: colors.text }]}>
                {editingPricingOptionId ? 'Edit option' : 'Add new option'}
              </AppText>

              <SurfaceTextField
                containerStyle={styles.addonField}
                label="Name"
                onChangeText={setPricingOptionDraftName}
                value={pricingOptionDraftName}
              />
              <SurfaceTextField
                containerStyle={styles.addonField}
                keyboardType="decimal-pad"
                label="Price"
                onChangeText={(text) => setPricingOptionDraftPrice(normalizePriceInput(text))}
                value={`$${pricingOptionDraftPrice}`}
              />
              <DurationSelectField
                containerStyle={styles.addonDurationField}
                label="Duration"
                onValueChange={setPricingOptionDraftDurationHHmm}
                triggerStyle={{ borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1 }}
                value={pricingOptionDraftDurationHHmm}
              />

              <View style={styles.addonSheetActions}>
                <Button
                  fullWidth
                  labelColor="#ffffff"
                  outlineColor="rgba(255,255,255,0.52)"
                  title="Cancel"
                  variant="outline"
                  onPress={() => setPricingOptionSheetOpen(false)}
                  style={styles.addonActionBtn}
                />
                <Button
                  disabled={!canAddPricingOption}
                  fullWidth
                  title={editingPricingOptionId ? 'Save' : 'Add option'}
                  variant="surfaceLight"
                  onPress={savePricingOptionDraft}
                  style={styles.addonActionBtn}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {(saveFeedback && saveFeedback !== 'Saved') || saveError ? (
        <View style={[styles.saveFeedbackWrap, { backgroundColor: 'rgba(127,29,29,0.9)' }]}>
          <AppText style={styles.saveFeedbackText}>{saveError || saveFeedback}</AppText>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loadStateText: {
    fontSize: 13,
    marginBottom: 8,
  },
  descriptionInput: {
    minHeight: 140,
    paddingTop: 12,
  },
  descriptionToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    minHeight: 74,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  switchControlWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pricingHint: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  pricingContent: {
    paddingTop: 16,
  },
  addonsContent: {
    paddingTop: 18,
  },
  addAddonButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    minHeight: 50,
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addAddonText: {
    color: '#00d084',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
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
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    position: 'relative',
  },
  addonSheetBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.76)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  addonSheetWrap: {
    alignSelf: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '78%',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addonSheetContent: {
    paddingBottom: 6,
  },
  addonSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  addonField: {
    marginBottom: 14,
  },
  addonDurationField: {
    marginTop: 0,
  },
  addonSheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  addonActionBtn: {
    flex: 1,
  },
  optionCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    minHeight: 64,
  },
  optionHeaderTap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  optionTrashHit: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingRight: 4,
  },
  optionMain: { flex: 1, marginRight: 8 },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionMeta: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});
