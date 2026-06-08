import { useEffect, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  DurationSelectField,
  InlineCardError,
  SurfaceTextField,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { formatServiceDurationSelectLabel } from '../../../components/ui/durationTime';
import { ServiceCategoryPickerField } from '../categories';
import { CollapsibleEditorSectionCard } from './CollapsibleEditorSectionCard';

const SERVICE_DESCRIPTION_MAX_LENGTH = 1000;

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

function categoryLabelForSubtitle(categoryId, options) {
  if (!categoryId) return 'None';
  return options?.find((o) => o.value === categoryId)?.label ?? 'None';
}

export function ServiceCreateSheet({
  visible,
  allowBackdropClose = false,
  onRequestClose,
  onSave,
  isSaving = false,
  submitError = '',
  categorySelectOptionsWithNone = null,
}) {
  const { colors } = useTheme();
  const hasCategories = Boolean(categorySelectOptionsWithNone?.length);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('01:00');
  const [categoryId, setCategoryId] = useState('');

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const [categoryExpanded, setCategoryExpanded] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setDescription('');
    setPrice('');
    setDurationHHmm('01:00');
    setCategoryId('');
    setDescriptionExpanded(false);
    setPricingExpanded(false);
    setCategoryExpanded(false);
  }, [visible]);

  const canSave =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    price.trim().length > 0 &&
    String(durationHHmm ?? '').trim().length > 0;

  const categorySubtitle = useMemo(() => {
    if (!hasCategories) return null;
    return categoryLabelForSubtitle(categoryId, categorySelectOptionsWithNone);
  }, [categoryId, categorySelectOptionsWithNone, hasCategories]);

  const pricingSubtitle = useMemo(() => {
    if (!price.trim()) return 'Price and duration';
    const durationLabel = formatServiceDurationSelectLabel(durationHHmm);
    return durationLabel ? `$${price} · ${durationLabel}` : `$${price}`;
  }, [durationHHmm, price]);

  function insertBulletPoint() {
    setDescription((current) => {
      const text = String(current ?? '');
      if (text.length >= SERVICE_DESCRIPTION_MAX_LENGTH) return text;
      if (text.trim().length === 0) {
        return '• ';
      }
      const needsLineBreak = !text.endsWith('\n');
      const next = `${text}${needsLineBreak ? '\n' : ''}• `;
      return next.slice(0, SERVICE_DESCRIPTION_MAX_LENGTH);
    });
  }

  function handleDescriptionChange(text) {
    setDescription(String(text ?? '').slice(0, SERVICE_DESCRIPTION_MAX_LENGTH));
  }

  const showDescriptionCharCount = description.length >= SERVICE_DESCRIPTION_MAX_LENGTH;

  async function handlePrimary() {
    if (!canSave || !onSave) return;
    await onSave({
      name: name.trim(),
      description: description.trim(),
      price,
      durationHHmm,
      categoryId: categoryId.trim(),
    });
  }

  return (
    <BottomSheetModal
      allowBackdropClose={allowBackdropClose}
      onRequestClose={onRequestClose}
      sheetHeightPercent={88}
      title="New service"
      visible={visible}
      footer={
        <View style={styles.actions}>
          <Button
            labelColor="#ffffff"
            outlineColor="rgba(255,255,255,0.52)"
            style={styles.actionBtn}
            title="Cancel"
            variant="outline"
            onPress={onRequestClose}
          />
          <Button
            disabled={!canSave || isSaving}
            loading={isSaving}
            style={styles.actionBtn}
            title="Create"
            variant="surfaceLight"
            onPress={() => {
              void handlePrimary();
            }}
          />
        </View>
      }
    >
      <SurfaceTextField
        containerStyle={styles.nameField}
        label="Service name"
        onChangeText={setName}
        placeholder="e.g. Full detail"
        value={name}
      />

      <CollapsibleEditorSectionCard
        contentStyle={styles.descriptionSectionContent}
        expanded={descriptionExpanded}
        onToggle={() => setDescriptionExpanded((v) => !v)}
        title="Description"
      >
        <SurfaceTextField
          containerStyle={styles.descriptionField}
          label={null}
          maxLength={SERVICE_DESCRIPTION_MAX_LENGTH}
          multiline
          onChangeText={handleDescriptionChange}
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
            style={styles.bulletButton}
            onPress={insertBulletPoint}
          >
            <Ionicons color={colors.textMuted} name="list-outline" size={18} />
          </Pressable>
          {showDescriptionCharCount ? (
            <AppText style={[styles.charCount, { color: colors.textMuted }]}>
              {description.length}/{SERVICE_DESCRIPTION_MAX_LENGTH}
            </AppText>
          ) : null}
        </View>
      </CollapsibleEditorSectionCard>

      <CollapsibleEditorSectionCard
        contentStyle={styles.sectionContent}
        expanded={pricingExpanded}
        onToggle={() => setPricingExpanded((v) => !v)}
        subtitle={pricingSubtitle}
        title="Pricing"
      >
        <View style={styles.pricingRow}>
          <SurfaceTextField
            compact
            containerStyle={styles.pricingField}
            keyboardType="decimal-pad"
            label="Price"
            onChangeText={(text) => setPrice(normalizePriceInput(text))}
            value={`$${price}`}
          />
          <DurationSelectField
            compact
            containerStyle={styles.pricingField}
            label="Duration"
            onValueChange={setDurationHHmm}
            value={durationHHmm}
          />
        </View>
      </CollapsibleEditorSectionCard>

      {hasCategories ? (
        <CollapsibleEditorSectionCard
          contentStyle={styles.sectionContent}
          expanded={categoryExpanded}
          onToggle={() => setCategoryExpanded((v) => !v)}
          subtitle={categorySubtitle}
          title="Category"
        >
          <ServiceCategoryPickerField
            hint="Optional. Groups this service on your booking link."
            options={categorySelectOptionsWithNone}
            value={categoryId}
            onValueChange={setCategoryId}
          />
        </CollapsibleEditorSectionCard>
      ) : null}

      {!hasCategories ? (
        <AppText style={[styles.categoriesHint, { color: colors.textMuted }]}>
          Categories are optional. To group services on your booking link, add them from the
          Categories tab.
        </AppText>
      ) : null}

      <AppText
        style={[
          styles.deferredNote,
          hasCategories ? styles.deferredNoteWithCategory : null,
          { color: colors.textMuted },
        ]}
      >
        Add-ons and pricing tiers can be set up after you create this service.
      </AppText>

      {submitError ? (
        <View style={styles.submitErrorWrap}>
          <InlineCardError message={submitError} />
        </View>
      ) : null}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  nameField: {
    marginBottom: 12,
  },
  sectionContent: {
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  descriptionSectionContent: {
    paddingHorizontal: 4,
    paddingTop: 20,
  },
  descriptionField: {
    marginBottom: 4,
    marginTop: 4,
  },
  descriptionInput: {
    minHeight: 96,
    paddingTop: 12,
  },
  descriptionToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: -4,
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
  pricingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  pricingField: {
    flex: 1,
    marginBottom: 0,
    marginTop: 0,
    minWidth: 0,
  },
  deferredNote: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 10,
  },
  deferredNoteWithCategory: {
    marginTop: 4,
  },
  categoriesHint: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 10,
  },
  submitErrorWrap: {
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  actionBtn: {
    flex: 1,
  },
});
