import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/** @typedef {'cash' | 'payment_app' | 'other'} InPersonPaymentMethod */

const CLOSE_ANIMATION_MS = 280;

const METHOD_OPTIONS = /** @type {const} */ ([
  { id: 'cash', label: 'Cash' },
  { id: 'payment_app', label: 'Payment app' },
  { id: 'other', label: 'Other' },
]);

/**
 * @param {InPersonPaymentMethod | string} method
 */
export function getInPersonPaymentRowLabel(method) {
  switch (method) {
    case 'cash':
      return 'Paid in cash';
    case 'payment_app':
      return 'Paid via payment app';
    default:
      return 'Paid · Other';
  }
}

function formatUsd(amount) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * @param {{
 *   onClose: () => void;
 *   amountDue: number;
 *   onConfirm: (method: InPersonPaymentMethod) => void;
 * }} props
 */
export function CompleteVisitMarkPaidSheet({ onClose, amountDue, onConfirm }) {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(true);
  const pendingAfterCloseRef = useRef(null);
  const [selectedMethod, setSelectedMethod] = useState(
    /** @type {InPersonPaymentMethod} */ ('cash'),
  );

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
    runClose(onClose);
  }, [onClose, runClose]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          gap: 24,
          width: '100%',
        },
        amountBlock: {
          gap: 6,
        },
        amountLine: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -0.5,
          lineHeight: 34,
        },
        sheetHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        methodPanel: {
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : colors.border,
          borderRadius: 16,
          borderWidth: 1,
          padding: 5,
        },
        methodTrack: {
          flexDirection: 'row',
          gap: 5,
        },
        methodOption: {
          alignItems: 'center',
          borderRadius: 11,
          flex: 1,
          justifyContent: 'center',
          minHeight: 48,
          paddingHorizontal: 8,
          paddingVertical: 12,
        },
        methodOptionSelected: {
          backgroundColor: colors.buttonPrimaryBg,
        },
        methodOptionUnselected: {
          backgroundColor: 'transparent',
        },
        methodLabel: {
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.1,
          textAlign: 'center',
        },
        methodLabelSelected: {
          color: colors.buttonPrimaryText,
        },
        methodLabelUnselected: {
          color: colors.textSecondary,
        },
        footerWrap: {
          marginTop: 24,
        },
        footer: {
          flexDirection: 'row',
          gap: 12,
        },
        footerGrow: {
          flex: 1,
        },
      }),
    [colors, isDark],
  );

  const handleConfirm = () => {
    onConfirm(selectedMethod);
    close();
  };

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footerWrap}>
          <View style={styles.footer}>
            <View style={styles.footerGrow}>
              <Button fullWidth title="Cancel" variant="secondary" onPress={close} />
            </View>
            <View style={styles.footerGrow}>
              <Button fullWidth title="Mark as paid" variant="primary" onPress={handleConfirm} />
            </View>
          </View>
        </View>
      }
      title="Mark as paid"
      visible={visible}
      onRequestClose={close}
    >
      <View style={styles.body}>
        <View style={styles.amountBlock}>
          <AppText accessibilityRole="text" style={styles.amountLine}>
            {formatUsd(amountDue)}
          </AppText>
          <AppText style={styles.sheetHint}>Record payment collected outside the app.</AppText>
        </View>

        <View style={styles.methodPanel}>
          <View style={styles.methodTrack}>
            {METHOD_OPTIONS.map((option) => {
              const selected = selectedMethod === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  hitSlop={{ top: 4, bottom: 4 }}
                  style={[
                    styles.methodOption,
                    selected ? styles.methodOptionSelected : styles.methodOptionUnselected,
                  ]}
                  onPress={() => setSelectedMethod(option.id)}
                >
                  <AppText
                    style={[
                      styles.methodLabel,
                      selected ? styles.methodLabelSelected : styles.methodLabelUnselected,
                    ]}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </BottomSheetModal>
  );
}
