import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  SurfaceCard,
  SurfaceTextField,
  WhiteSegmentedTabs,
} from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const CLOSE_ANIMATION_MS = 280;

function normalizeFeeAmountInput(rawText) {
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
  const parts = out.split('.');
  if (parts.length <= 1) {
    return out;
  }
  return `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`;
}

/**
 * @param {number} amount
 * @returns {string}
 */
function formatUsd(amount) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(safe);
}

/**
 * Slides up over the complete-visit Payment screen to add or clear a fee or discount.
 *
 * @param {{
 *   items?: Array<{ id: string; label: string; amount: number }>;
 *   onClose: () => void;
 *   onAdd: (fee: { id: string; label: string; amount: number }) => void;
 *   onRemove?: (id: string) => void;
 * }} props
 */
export function CompleteVisitAddFeeSheet({ items = [], onClose, onAdd, onRemove }) {
  const { colors } = useTheme();
  const [added, setAdded] = useState(items);
  const [visible, setVisible] = useState(true);
  const pendingAfterCloseRef = useRef(null);
  const idRef = useRef(0);
  const [mode, setMode] = useState(/** @type {'fee' | 'discount'} */ ('fee'));
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');

  const runClose = useCallback((afterClose) => {
    pendingAfterCloseRef.current = typeof afterClose === 'function' ? afterClose : null;
    setVisible(false);
  }, []);

  const finishPendingClose = useCallback(() => {
    const afterClose = pendingAfterCloseRef.current;
    pendingAfterCloseRef.current = null;
    afterClose?.();
  }, []);

  useEffect(() => {
    if (visible) {
      return undefined;
    }
    const delay =
      typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ? 0 : CLOSE_ANIMATION_MS;
    const id = setTimeout(finishPendingClose, delay);
    return () => clearTimeout(id);
  }, [finishPendingClose, visible]);

  const close = useCallback(() => {
    Keyboard.dismiss();
    runClose(onClose);
  }, [onClose, runClose]);

  const parsedAmount = Number.parseFloat(amount.replace(/[^0-9.]/g, ''));
  const canAdd = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isDiscount = mode === 'discount';
  const fees = added.filter((item) => item.amount >= 0);
  const discounts = added.filter((item) => item.amount < 0);
  const visibleItems = isDiscount ? discounts : fees;
  const hasAdded = fees.length > 0 || discounts.length > 0;

  const handleClear = (id) => {
    setAdded((prev) => prev.filter((item) => item.id !== id));
    onRemove?.(id);
  };

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }
    const next = {
      id: `adj-${Date.now()}-${idRef.current++}`,
      label: label.trim() || (isDiscount ? 'Discount' : 'Additional fee'),
      amount: isDiscount ? -parsedAmount : parsedAmount,
    };
    setAdded((prev) => [...prev, next]);
    onAdd(next);
    setLabel('');
    setAmount('');
    Keyboard.dismiss();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          gap: 16,
          width: '100%',
        },
        fieldFlush: {
          marginBottom: 0,
        },
        itemCard: {
          paddingLeft: 14,
          paddingRight: 6,
          paddingVertical: 10,
          width: '100%',
        },
        addedGroup: {
          gap: 8,
          width: '100%',
        },
        addedLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          marginBottom: 6,
        },
        addedRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          width: '100%',
        },
        addedTextCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        addedTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '400',
          lineHeight: 20,
        },
        addedAmount: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 16,
          marginTop: 2,
        },
        addedDiscount: {
          color: colors.moneyPositive,
        },
        trashCol: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        trashPressed: {
          opacity: 0.55,
        },
        footerWrap: {
          width: '100%',
        },
        footer: {
          flexDirection: 'row',
          gap: 12,
        },
        footerGrow: {
          flex: 1,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      footer={
        <View style={styles.footerWrap}>
          <View style={styles.footer}>
            <View style={styles.footerGrow}>
              <Button
                fullWidth
                title={hasAdded ? 'Done' : 'Cancel'}
                variant="secondary"
                onPress={close}
              />
            </View>
            <View style={styles.footerGrow}>
              <Button
                disabled={!canAdd}
                fullWidth
                title={isDiscount ? 'Add discount' : 'Add fee'}
                variant="primary"
                onPress={handleAdd}
              />
            </View>
          </View>
        </View>
      }
      sheetHeightPercent={92}
      showCloseButton
      stickyFooter
      title="Fee or discount"
      visible={visible}
      onRequestClose={close}
    >
      <View style={styles.body}>
        <WhiteSegmentedTabs
          options={[
            { id: 'fee', label: 'Fee' },
            { id: 'discount', label: 'Discount' },
          ]}
          value={mode}
          onChange={(id) => setMode(id === 'discount' ? 'discount' : 'fee')}
        />
        <SurfaceTextField
          containerStyle={styles.fieldFlush}
          label="Description"
          placeholder={isDiscount ? 'Returning customer' : 'Travel fee'}
          value={label}
          onChangeText={setLabel}
        />
        <SurfaceTextField
          containerStyle={styles.fieldFlush}
          keyboardType="decimal-pad"
          label="Amount"
          placeholder="$0.00"
          value={amount ? `$${amount}` : ''}
          onChangeText={(text) => setAmount(normalizeFeeAmountInput(text))}
        />

        {visibleItems.length > 0 ? (
          <AddedGroup
            discount={isDiscount}
            items={visibleItems}
            styles={styles}
            title={isDiscount ? 'Discounts' : 'Fees'}
            onClear={handleClear}
          />
        ) : null}
      </View>
    </BottomSheetModal>
  );
}

/**
 * @param {{
 *   title: string;
 *   items: Array<{ id: string; label: string; amount: number }>;
 *   discount: boolean;
 *   onClear: (id: string) => void;
 *   styles: Record<string, object>;
 * }} props
 */
function AddedGroup({ title, items, discount, onClear, styles }) {
  const { colors } = useTheme();

  return (
    <View style={styles.addedGroup}>
      <AppText style={styles.addedLabel}>{title}</AppText>
      {items.map((item) => (
        <SurfaceCard key={item.id} outlined padding="none" style={styles.itemCard}>
          <View style={styles.addedRow}>
            <View style={styles.addedTextCol}>
              <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.addedTitle}>
                {item.label}
              </AppText>
              <AppText style={[styles.addedAmount, discount ? styles.addedDiscount : null]}>
                {discount ? `−${formatUsd(Math.abs(item.amount))}` : formatUsd(item.amount)}
              </AppText>
            </View>
            <Pressable
              accessibilityLabel={`Remove ${item.label}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onClear(item.id)}
            >
              {({ pressed }) => (
                <View style={[styles.trashCol, pressed ? styles.trashPressed : null]}>
                  <Ionicons color={colors.danger} name="trash-outline" size={18} />
                </View>
              )}
            </Pressable>
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}
