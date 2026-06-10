import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../../components/ui';
import { useModalFadeBackdropSlideSheet } from '../../../../components/ui/useModalFadeBackdropSlideSheet';
import { useTheme } from '../../../../theme';

/** @typedef {'cash' | 'payment_app' | 'other'} InPersonPaymentMethod */

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const [selectedMethod, setSelectedMethod] = useState(
    /** @type {InPersonPaymentMethod} */ ('cash'),
  );

  const close = useCallback(() => {
    runClose(onClose);
  }, [runClose, onClose]);

  useEffect(() => {
    prepareOpen();
    const id = requestAnimationFrame(() => runOpen());
    return () => cancelAnimationFrame(id);
  }, [prepareOpen, runOpen]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlayRoot: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'flex-end',
        },
        backdropFill: {
          backgroundColor: 'rgba(0,0,0,0.55)',
        },
        sheetWrap: {
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderTopWidth: 1,
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
        },
        sheetContent: {
          paddingBottom: Math.max(insets.bottom, 16) + 12,
          paddingHorizontal: 20,
          paddingTop: 18,
        },
        sheetTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: -0.25,
          marginBottom: 8,
        },
        sheetHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 16,
        },
        amountDue: {
          color: colors.text,
          fontWeight: '700',
        },
        headerDivider: {
          backgroundColor: colors.border,
          height: 1,
          marginBottom: 14,
        },
        methodRow: {
          columnGap: 8,
          flexDirection: 'row',
        },
        methodOption: {
          alignItems: 'center',
          borderRadius: 12,
          borderWidth: 2,
          flex: 1,
          justifyContent: 'center',
          minHeight: 48,
          paddingHorizontal: 8,
          paddingVertical: 10,
        },
        methodOptionSelected: {
          backgroundColor: colors.buttonPrimaryBg,
          borderColor: colors.buttonPrimaryBg,
        },
        methodOptionUnselected: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
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
        footer: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 22,
        },
        footerGrow: {
          flex: 1,
        },
      }),
    [colors, insets.bottom],
  );

  const handleConfirm = () => {
    onConfirm(selectedMethod);
    close();
  };

  return (
    <View style={styles.overlayRoot}>
      <Animated.View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFillObject, backdropStyle, styles.backdropFill]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={close}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheetWrap,
          sheetStyle,
          {
            backgroundColor: colors.shellElevated,
            borderTopColor: colors.borderStrong,
          },
        ]}
      >
        <View style={styles.sheetContent}>
          <AppText style={styles.sheetTitle}>Mark as paid</AppText>
          <AppText style={styles.sheetHint}>
            Record <AppText style={styles.amountDue}>{formatUsd(amountDue)}</AppText> collected
            outside the app.
          </AppText>
          <View style={styles.headerDivider} />
          <View style={styles.methodRow}>
            {METHOD_OPTIONS.map((option) => {
              const selected = selectedMethod === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
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
          <View style={styles.footer}>
            <View style={styles.footerGrow}>
              <Button fullWidth title="Cancel" variant="secondary" onPress={close} />
            </View>
            <View style={styles.footerGrow}>
              <Button fullWidth title="Mark as paid" variant="primary" onPress={handleConfirm} />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
