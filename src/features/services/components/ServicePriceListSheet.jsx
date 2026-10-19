import Ionicons from '@expo/vector-icons/Ionicons';
import { useLayoutEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  DurationSelectField,
  SkeletonBox,
  SurfaceTextField,
} from '../../../components/ui';
import { formatServiceDurationSelectLabel } from '../../../components/ui/durationTime';
import { useTheme } from '../../../theme';

function SheetListSkeleton({ rows = 4 }) {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={`price-skel-${index}`} style={styles.skeletonRow}>
          <View style={styles.skeletonCopy}>
            <SkeletonBox borderRadius={6} height={14} pulse width="58%" />
            <SkeletonBox
              borderRadius={6}
              height={11}
              pulse
              style={styles.skeletonMeta}
              width="36%"
            />
          </View>
          <SkeletonBox borderRadius={6} height={18} pulse width={18} />
        </View>
      ))}
    </View>
  );
}

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

function priceOptionParts(option) {
  const price = String(option?.price ?? '').trim();
  return {
    price: price ? `$${price}` : '',
    duration: formatServiceDurationSelectLabel(option?.durationHHmm),
  };
}

export function summarizePrices(options) {
  const count = (options ?? []).length;
  if (count === 0) return 'None';
  if (count === 1) return '1 price';
  return `${count} prices`;
}

/**
 * One row on the new-service screen. Opens the price form, or the list once prices exist.
 */
export function ServicePriceSummaryRow({ summary, onPress }) {
  const { colors } = useTheme();

  return (
    <Pressable accessibilityRole="button" android_ripple={null} onPress={onPress}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryLabelCol}>
          <AppText numberOfLines={1} style={[styles.summaryTitle, { color: colors.text }]}>
            Pricing options
          </AppText>
          <AppText numberOfLines={1} style={[styles.summaryMeta, { color: colors.textMuted }]}>
            {summary}
          </AppText>
        </View>
        <View style={styles.chevronCol}>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        </View>
      </View>
    </Pressable>
  );
}

function PriceOptionRow({ title, price, duration, onPress, onRemove, showDivider }) {
  const { colors } = useTheme();

  return (
    <View>
      <View style={styles.optionRow}>
        <View style={styles.optionMainCol}>
          <Pressable accessibilityRole="button" android_ripple={null} onPress={onPress}>
            <View style={styles.optionMain}>
              <AppText numberOfLines={1} style={[styles.optionTitle, { color: colors.text }]}>
                {title}
              </AppText>
              {duration || price ? (
                <View style={styles.metaRow}>
                  {price ? (
                    <AppText numberOfLines={1} style={[styles.optionMeta, { color: colors.text }]}>
                      {price}
                    </AppText>
                  ) : null}
                  {duration && price ? (
                    <AppText style={[styles.metaDot, { color: colors.textMuted }]}>·</AppText>
                  ) : null}
                  {duration ? (
                    <AppText
                      numberOfLines={1}
                      style={[styles.optionMeta, { color: colors.textMuted }]}
                    >
                      {duration}
                    </AppText>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel={`Remove ${title}`}
          accessibilityRole="button"
          android_ripple={null}
          hitSlop={6}
          onPress={onRemove}
        >
          <View style={styles.removeCol}>
            <Ionicons color={colors.textMuted} name="trash-outline" size={20} />
          </View>
        </Pressable>
      </View>
      {showDivider ? (
        <View style={styles.dividerRow}>
          <View style={[styles.hairline, { backgroundColor: colors.border }]} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Price list and the add/edit form share one sheet. Cancel on the form returns to the list.
 */
export function ServicePriceListSheet({
  visible,
  options,
  startOnForm = false,
  loading = false,
  onSave,
  onRemove,
  onRequestClose,
}) {
  const prices = options ?? [];
  const wasVisible = useRef(false);
  const pendingStartOnForm = useRef(false);
  const [editor, setEditor] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');

  useLayoutEffect(() => {
    if (!visible) {
      setEditor(null);
      wasVisible.current = false;
      pendingStartOnForm.current = false;
      return;
    }

    if (!wasVisible.current) {
      wasVisible.current = true;
      pendingStartOnForm.current = Boolean(startOnForm);
      setEditor(null);
    }

    if (loading) return;

    if (pendingStartOnForm.current) {
      pendingStartOnForm.current = false;
      if (prices.length === 0) {
        setName('');
        setPrice('');
        setDurationHHmm('');
        setEditor({ id: null });
      }
    }
  }, [loading, prices.length, startOnForm, visible]);

  function beginAdd() {
    setName('');
    setPrice('');
    setDurationHHmm('');
    setEditor({ id: null });
  }

  function beginEdit(option) {
    setName(String(option?.label ?? ''));
    setPrice(String(option?.price ?? '').replace(/\$/g, ''));
    setDurationHHmm(String(option?.durationHHmm ?? ''));
    setEditor({ id: option.id });
  }

  function leaveForm() {
    const addingFirst = editor?.id == null && prices.length === 0;
    setEditor(null);
    if (addingFirst) onRequestClose();
  }

  function handleDismiss() {
    if (editor) {
      leaveForm();
      return;
    }
    onRequestClose();
  }

  function handleSave() {
    const label = name.trim();
    if (!label || !price.trim() || !String(durationHHmm ?? '').trim()) return;
    onSave({
      id: editor?.id ?? null,
      name: label,
      price,
      durationHHmm,
    });
    setEditor(null);
  }

  const canSave =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    String(durationHHmm ?? '').trim().length > 0;
  const editing = editor?.id != null;

  const showForm = Boolean(editor) && !loading;

  const footer = loading ? (
    <Button disabled fullWidth title="Done" variant="surfaceLight" onPress={onRequestClose} />
  ) : showForm ? (
    <View style={styles.formActions}>
      <Button style={styles.formAction} title="Cancel" variant="secondary" onPress={leaveForm} />
      <Button
        disabled={!canSave}
        style={styles.formAction}
        title={editing ? 'Save' : 'Add price'}
        variant="surfaceLight"
        onPress={handleSave}
      />
    </View>
  ) : (
    <View style={styles.listActions}>
      <Button fullWidth iconName="add" title="Add a price" variant="secondary" onPress={beginAdd} />
      <Button fullWidth title="Done" variant="surfaceLight" onPress={onRequestClose} />
    </View>
  );

  return (
    <BottomSheetModal
      allowBackdropClose
      footer={footer}
      liftFooterWithKeyboard={showForm}
      sheetHeightPercent={68}
      stickyFooter
      title={showForm ? (editing ? 'Edit price' : 'Add a price') : 'Pricing options'}
      visible={visible}
      onRequestClose={handleDismiss}
    >
      {loading ? (
        <SheetListSkeleton />
      ) : showForm ? (
        <View style={styles.form}>
          <SurfaceTextField label="Name" onChangeText={setName} value={name} />
          <SurfaceTextField
            keyboardType="decimal-pad"
            label="Price"
            onChangeText={(text) => setPrice(normalizePriceInput(text))}
            value={`$${price}`}
          />
          <DurationSelectField
            containerStyle={styles.durationField}
            label="Duration"
            mode="service"
            placeholder="Select duration"
            value={durationHHmm}
            onValueChange={setDurationHHmm}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {prices.map((option, index) => {
            const parts = priceOptionParts(option);
            return (
              <PriceOptionRow
                key={option.id}
                duration={parts.duration}
                price={parts.price}
                showDivider={index < prices.length - 1}
                title={option.label}
                onPress={() => beginEdit(option)}
                onRemove={() => onRemove(option.id)}
              />
            );
          })}
        </View>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  summaryLabelCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  summaryMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  chevronCol: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    marginLeft: 8,
    width: 22,
  },
  list: {
    marginHorizontal: -16,
  },
  skeletonList: {
    gap: 4,
    marginHorizontal: -16,
  },
  skeletonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  skeletonCopy: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  skeletonMeta: {
    marginTop: 0,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    width: '100%',
  },
  optionMainCol: {
    flex: 1,
    minWidth: 0,
  },
  optionMain: {
    justifyContent: 'center',
    minHeight: 56,
    paddingLeft: 16,
    paddingVertical: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 2,
    minWidth: 0,
  },
  optionMeta: {
    fontSize: 13,
  },
  metaDot: {
    fontSize: 13,
    marginHorizontal: 6,
  },
  removeCol: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginRight: 6,
    width: 44,
  },
  dividerRow: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.55,
  },
  form: {
    gap: 4,
  },
  durationField: {
    marginTop: 0,
  },
  listActions: {
    gap: 10,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  formAction: {
    flex: 1,
  },
});
