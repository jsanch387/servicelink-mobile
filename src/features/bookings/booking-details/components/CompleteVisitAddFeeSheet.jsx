import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, AppTextInput, Button, TextField } from '../../../../components/ui';
import { useModalFadeBackdropSlideSheet } from '../../../../components/ui/useModalFadeBackdropSlideSheet';
import { useTheme } from '../../../../theme';

function sanitizeFeeAmountInput(text) {
  const cleaned = String(text ?? '').replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) {
    return parts[0] ?? '';
  }
  return `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`;
}

/**
 * Slides up over the complete-visit full screen for adding a fee line item.
 *
 * @param {{
 *   onClose: () => void;
 *   onAdd: (fee: { label: string; amount: number }) => void;
 * }} props
 */
export function CompleteVisitAddFeeSheet({ onClose, onAdd }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [iosKeyboardScrollPadding, setIosKeyboardScrollPadding] = useState(0);

  const close = useCallback(() => {
    runClose(onClose);
  }, [runClose, onClose]);

  useEffect(() => {
    prepareOpen();
    const id = requestAnimationFrame(() => runOpen());
    return () => cancelAnimationFrame(id);
  }, [prepareOpen, runOpen]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return undefined;
    }
    const onShow = (e) => {
      setIosKeyboardScrollPadding(Math.max(0, e?.endCoordinates?.height ?? 0));
    };
    const onHide = () => setIosKeyboardScrollPadding(0);
    const subShow = Keyboard.addListener('keyboardWillShow', onShow);
    const subHide = Keyboard.addListener('keyboardWillHide', onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const parsedAmount = Number.parseFloat(amount.replace(/[^0-9.]/g, ''));
  const canAdd = Number.isFinite(parsedAmount) && parsedAmount > 0;

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
          maxHeight: '62%',
          position: 'absolute',
          right: 0,
        },
        sheetScroll: {
          flexGrow: 0,
        },
        sheetContent: {
          paddingHorizontal: 20,
          paddingTop: 18,
        },
        sheetTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: -0.25,
          marginBottom: 6,
        },
        sheetHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 16,
        },
        headerDivider: {
          backgroundColor: colors.border,
          height: 1,
          marginBottom: 16,
        },
        fields: {
          gap: 8,
        },
        fieldFlush: {
          marginBottom: 0,
        },
        amountField: {
          gap: 8,
        },
        amountLabel: {
          fontSize: 14,
          fontWeight: '500',
        },
        amountInputRow: {
          alignItems: 'center',
          borderRadius: 14,
          borderWidth: 1.5,
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        amountPrefix: {
          fontSize: 16,
          fontWeight: '600',
          marginRight: 4,
        },
        amountInput: {
          flex: 1,
          fontSize: 16,
          minWidth: 0,
          padding: 0,
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
    [colors],
  );

  const scrollPaddingBottom = Math.max(insets.bottom, 16) + 12 + iosKeyboardScrollPadding;

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }
    onAdd({
      label: label.trim() || 'Additional fee',
      amount: parsedAmount,
    });
    Keyboard.dismiss();
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
        <ScrollView
          contentContainerStyle={[styles.sheetContent, { paddingBottom: scrollPaddingBottom }]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.sheetScroll}
        >
          <AppText style={styles.sheetTitle}>Add fee</AppText>
          <AppText style={styles.sheetHint}>
            Extra charge for this service — shows on the breakdown.
          </AppText>
          <View style={styles.headerDivider} />
          <View style={styles.fields}>
            <TextField
              containerStyle={styles.fieldFlush}
              label="Description"
              placeholder="Extra soil removal"
              value={label}
              onChangeText={setLabel}
            />
            <View style={styles.amountField}>
              <AppText style={[styles.amountLabel, { color: colors.textMuted }]}>Amount</AppText>
              <View
                style={[
                  styles.amountInputRow,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <AppText style={[styles.amountPrefix, { color: colors.text }]}>$</AppText>
                <AppTextInput
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  style={[styles.amountInput, { color: colors.inputText }]}
                  value={amount}
                  onChangeText={(text) => setAmount(sanitizeFeeAmountInput(text))}
                />
              </View>
            </View>
          </View>
          <View style={styles.footer}>
            <View style={styles.footerGrow}>
              <Button fullWidth title="Cancel" variant="secondary" onPress={close} />
            </View>
            <View style={styles.footerGrow}>
              <Button
                disabled={!canAdd}
                fullWidth
                title="Add"
                variant="primary"
                onPress={handleAdd}
              />
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
