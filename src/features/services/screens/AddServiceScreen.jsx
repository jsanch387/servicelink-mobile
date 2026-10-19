import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  DurationSelectField,
  InlineCardError,
  SettingsSection,
  SurfaceTextField,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useAuth } from '../../auth';
import { showWebAccountFeatureAlert, useSubscription } from '../../subscription';
import { ServiceCategoryPickerField } from '../categories';
import { AddonEditorSheet } from '../components/AddonEditorSheet';
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
import { FREE_TIER_MAX_SERVICES, freeTierServicesLimitCopy } from '../constants/freeTierLimits';
import { serviceMultiplePricingAccessCopy } from '../constants/servicePricingAccessCopy';
import { useCreateCatalogService } from '../hooks/useCreateCatalogService';
import { useServicesCatalog } from '../hooks/useServicesCatalog';
import { validateNewServiceDraft } from '../utils/validateNewServiceDraft';

const DESCRIPTION_MAX_LENGTH = 1000;

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

/**
 * Full-screen setup for a new catalog service.
 * The price customers see is always on the page. Other prices and add-ons stay optional.
 */
export function AddServiceScreen({ route }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasProAccess, isOwnerProfileLoaded, isReady: subscriptionReady } = useSubscription();
  const catalog = useServicesCatalog();
  const { createCatalogService, isCreating } = useCreateCatalogService({
    businessId: catalog.businessId,
    userId: user?.id,
  });

  const localSeq = useRef(0);
  const scrollRef = useRef(null);
  const presetCategoryId = String(route?.params?.categoryId ?? '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('01:00');
  const [categoryId, setCategoryId] = useState(presetCategoryId);
  const [pricingOptions, setPricingOptions] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [pendingAddons, setPendingAddons] = useState([]);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [priceFormFirst, setPriceFormFirst] = useState(false);
  const [addonPickerOpen, setAddonPickerOpen] = useState(false);
  const [addonSheetMode, setAddonSheetMode] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const hasCategories = (catalog.categories?.length ?? 0) > 0;
  const pricingAccessPending = Boolean(user?.id) && !subscriptionReady;
  const pricingLocked = Boolean(user?.id) && subscriptionReady && !hasProAccess;
  const servicesLimitCopy = useMemo(() => freeTierServicesLimitCopy(FREE_TIER_MAX_SERVICES), []);
  const atFreeTierServicesLimit =
    isOwnerProfileLoaded &&
    !hasProAccess &&
    (catalog.services?.length ?? 0) >= FREE_TIER_MAX_SERVICES;

  const editingPendingAddon = useMemo(() => {
    if (!addonSheetMode || addonSheetMode === 'new') return null;
    return pendingAddons.find((addon) => addon.localId === addonSheetMode) ?? null;
  }, [addonSheetMode, pendingAddons]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function nextLocalId(prefix) {
    localSeq.current += 1;
    return `${prefix}${Date.now()}-${localSeq.current}`;
  }

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

  function togglePendingAddon(localId) {
    setPendingAddons((current) =>
      current.map((addon) =>
        addon.localId === localId ? { ...addon, selected: !addon.selected } : addon,
      ),
    );
  }

  function handlePriceSave({
    id,
    name: optionName,
    price: optionPrice,
    durationHHmm: optionDuration,
  }) {
    const label = String(optionName ?? '').trim();
    if (!label) return;
    if (id) {
      setPricingOptions((current) =>
        current.map((option) =>
          option.id === id
            ? { ...option, label, price: optionPrice, durationHHmm: optionDuration }
            : option,
        ),
      );
      return;
    }
    setPricingOptions((current) => [
      ...current,
      {
        id: nextLocalId('option-new-'),
        label,
        price: optionPrice,
        durationHHmm: optionDuration,
      },
    ]);
  }

  function handleAddonSheetSave({
    name: addonName,
    price: addonPrice,
    durationHHmm: addonDuration,
    description: addonDescription,
  }) {
    const trimmedName = String(addonName ?? '').trim();
    if (!trimmedName) return;
    if (addonSheetMode && addonSheetMode !== 'new') {
      setPendingAddons((current) =>
        current.map((addon) =>
          addon.localId === addonSheetMode
            ? {
                ...addon,
                name: trimmedName,
                price: addonPrice,
                durationHHmm: addonDuration,
                description: addonDescription,
              }
            : addon,
        ),
      );
    } else {
      setPendingAddons((current) => [
        ...current,
        {
          localId: nextLocalId('addon-new-'),
          name: trimmedName,
          price: addonPrice,
          durationHHmm: addonDuration,
          description: addonDescription,
          selected: true,
        },
      ]);
    }
    setAddonSheetMode(null);
  }

  async function handleCreate() {
    const message = validateNewServiceDraft({
      name,
      description,
      price,
      durationHHmm,
      pricingOptions,
    });
    if (message) {
      setSubmitError(message);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!catalog.businessId) {
      setSubmitError('Missing business context.');
      return;
    }
    if (atFreeTierServicesLimit) {
      setSubmitError(servicesLimitCopy.sheetError);
      return;
    }

    try {
      setSubmitError('');
      Keyboard.dismiss();
      await createCatalogService({
        name: name.trim(),
        description: description.trim(),
        price,
        durationHHmm,
        categoryId: categoryId.trim(),
        multiPriceEnabled: !pricingLocked && pricingOptions.length > 0,
        pricingOptions,
        selectedAddonIds,
        pendingAddons,
      });
      navigation.goBack();
    } catch (err) {
      if (err?.serviceId) {
        Alert.alert(
          'Service saved',
          'Other prices or add-ons could not be saved. Open the service from your list to finish them.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }
      setSubmitError(safeUserFacingMessage(err, { fallback: 'Could not create service.' }));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }

  const addonSummary = summarizeSelectedAddons({
    catalogAddons: catalog.addons,
    pendingAddons,
    selectedAddonIds,
  });
  const priceSummary = summarizePrices(pricingOptions);
  const sheetOpen = Boolean(priceListOpen || addonSheetMode || addonPickerOpen);
  const showCreateButton = !keyboardVisible && !sheetOpen;
  const showDescriptionCount = description.length >= DESCRIPTION_MAX_LENGTH - 40;

  return (
    <View style={[styles.root, { backgroundColor: colors.shell }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        style={styles.root}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 108 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {submitError ? (
            <View style={styles.errorWrap}>
              <InlineCardError message={submitError} />
            </View>
          ) : null}

          <View style={styles.details}>
            <SurfaceTextField
              compact
              containerStyle={styles.field}
              label="Service name"
              onChangeText={setName}
              placeholder="Full detail"
              value={name}
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
                options={catalog.categorySelectOptionsWithNone}
                value={categoryId}
                onValueChange={setCategoryId}
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

        {showCreateButton ? (
          <View style={[styles.createBar, { bottom: Math.max(insets.bottom, 12) }]}>
            <Button
              disabled={isCreating}
              fullWidth
              loading={isCreating}
              title="Create service"
              variant="surfaceLight"
              onPress={() => {
                void handleCreate();
              }}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <ServicePriceListSheet
        options={pricingOptions}
        startOnForm={priceFormFirst}
        visible={priceListOpen}
        onRemove={(id) => {
          const next = pricingOptions.filter((option) => option.id !== id);
          setPricingOptions(next);
          if (next.length === 0) setPriceListOpen(false);
        }}
        onRequestClose={() => setPriceListOpen(false)}
        onSave={handlePriceSave}
      />
      <ServiceAddonPickerSheet
        catalogAddons={catalog.addons}
        pendingAddons={pendingAddons}
        selectedAddonIds={selectedAddonIds}
        visible={addonPickerOpen && !addonSheetMode}
        onAdd={() => setAddonSheetMode('new')}
        onRequestClose={() => setAddonPickerOpen(false)}
        onToggleCatalog={toggleAddon}
        onTogglePending={togglePendingAddon}
      />
      <AddonEditorSheet
        allowBackdropClose={false}
        initialDescription={editingPendingAddon?.description ?? ''}
        initialDurationHHmm={editingPendingAddon?.durationHHmm ?? ''}
        initialName={editingPendingAddon?.name ?? ''}
        initialPrice={editingPendingAddon?.price ?? ''}
        primaryButtonTitle={editingPendingAddon ? 'Save' : 'Add add-on'}
        title={editingPendingAddon ? 'Edit add-on' : 'New add-on'}
        visible={Boolean(addonSheetMode)}
        onRequestClose={() => setAddonSheetMode(null)}
        onSave={handleAddonSheetSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  errorWrap: {
    marginBottom: 16,
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
  createBar: {
    left: 16,
    position: 'absolute',
    right: 16,
  },
});
