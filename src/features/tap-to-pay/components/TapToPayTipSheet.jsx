import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button, SurfaceTextField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  TAP_TO_PAY_TIP_PRESETS,
  formatTipUsd,
  parseTipAmountInputToCents,
  tipCentsFromPercent,
} from '../utils/tapToPayTip';

const CLOSE_ANIMATION_MS = 280;

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeTipAmountInput(raw) {
  const input = String(raw ?? '').replace(/\$/g, '');
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
  return `${parts[0].slice(0, 5)}.${parts.slice(1).join('').slice(0, 2)}`;
}

/**
 * Customer-facing tip step shown before Apple's Tap to Pay screen.
 *
 * @param {{
 *   amountDueCents: number;
 *   onClose: () => void;
 *   onContinue: (tipCents: number) => void;
 * }} props
 */
export function TapToPayTipSheet({ amountDueCents, onClose, onContinue }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);
  const pendingAfterCloseRef = useRef(null);
  const [selection, setSelection] = useState(
    /** @type {number | 'custom' | 'none' | null} */ (null),
  );
  const [customAmount, setCustomAmount] = useState('');

  const baseCents = Math.max(0, Math.round(Number(amountDueCents) || 0));
  const customCents = parseTipAmountInputToCents(customAmount);
  const customOverMax =
    customAmount.trim().length > 0 && customCents == null && Number.parseFloat(customAmount) > 0;

  const tipCents = useMemo(() => {
    if (selection === 'none') {
      return 0;
    }
    if (typeof selection === 'number') {
      return tipCentsFromPercent(baseCents, selection);
    }
    if (selection === 'custom') {
      return customCents;
    }
    return null;
  }, [baseCents, customCents, selection]);

  const chargeCents = baseCents + (tipCents ?? 0);

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

  const select = useCallback((next) => {
    if (next !== 'custom') {
      Keyboard.dismiss();
    }
    setSelection(next);
    void Haptics.selectionAsync().catch(() => {});
  }, []);

  const handleCharge = useCallback(() => {
    if (tipCents == null) {
      return;
    }
    Keyboard.dismiss();
    onContinue(tipCents);
  }, [onContinue, tipCents]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          gap: 28,
          paddingTop: 8,
          width: '100%',
        },
        amountBlock: {
          gap: 8,
        },
        amountLine: {
          color: colors.text,
          fontSize: 48,
          fontWeight: '800',
          letterSpacing: -1,
          lineHeight: 56,
        },
        sheetHint: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 21,
        },
        presetRow: {
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        presetPress: {
          flex: 1,
          minWidth: 0,
        },
        presetFace: {
          alignItems: 'center',
          borderRadius: 18,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: 104,
          paddingHorizontal: 8,
          paddingVertical: 16,
          width: '100%',
        },
        presetFaceSelected: {
          backgroundColor: colors.buttonPrimaryBg,
          borderColor: colors.buttonPrimaryBg,
        },
        presetFaceIdle: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
        },
        presetPercent: {
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.4,
        },
        presetAmount: {
          fontSize: 15,
          fontWeight: '600',
          marginTop: 6,
        },
        choiceRow: {
          flexDirection: 'row',
          gap: 12,
          width: '100%',
        },
        choicePress: {
          flex: 1,
          minWidth: 0,
        },
        choiceFace: {
          alignItems: 'center',
          borderRadius: 16,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: 56,
          paddingHorizontal: 12,
          width: '100%',
        },
        choiceLabel: {
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        customField: {
          marginBottom: 8,
        },
        footerWrap: {
          width: '100%',
        },
      }),
    [colors],
  );

  const hint = useMemo(() => {
    if (tipCents == null) {
      return 'Service total';
    }
    if (tipCents <= 0) {
      return 'No tip added.';
    }
    return `Includes a ${formatTipUsd(tipCents)} tip.`;
  }, [tipCents]);

  return (
    <BottomSheetModal
      footer={
        <View style={styles.footerWrap}>
          <Button
            disabled={tipCents == null}
            fullWidth
            title={tipCents == null ? 'Charge' : `Charge ${formatTipUsd(chargeCents)}`}
            variant="primary"
            onPress={handleCharge}
          />
        </View>
      }
      sheetHeightPercent={92}
      stickyFooter
      title="Add a tip"
      visible={visible}
      onRequestClose={close}
    >
      <View style={styles.body}>
        <View style={styles.amountBlock}>
          <AppText accessibilityRole="text" style={styles.amountLine}>
            {formatTipUsd(chargeCents)}
          </AppText>
          <AppText style={styles.sheetHint}>{hint}</AppText>
        </View>

        <View style={styles.presetRow}>
          {TAP_TO_PAY_TIP_PRESETS.map((percent) => {
            const selected = selection === percent;
            const presetCents = tipCentsFromPercent(baseCents, percent);
            const labelColor = selected ? colors.buttonPrimaryText : colors.text;
            const amountColor = selected ? colors.buttonPrimaryText : colors.textMuted;
            return (
              <Pressable
                key={percent}
                accessibilityLabel={`${percent} percent, ${formatTipUsd(presetCents)}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={styles.presetPress}
                onPress={() => select(percent)}
              >
                <View
                  style={[
                    styles.presetFace,
                    selected ? styles.presetFaceSelected : styles.presetFaceIdle,
                  ]}
                >
                  <AppText style={[styles.presetPercent, { color: labelColor }]}>
                    {percent}%
                  </AppText>
                  <AppText style={[styles.presetAmount, { color: amountColor }]}>
                    {formatTipUsd(presetCents)}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

        {selection === 'custom' ? (
          <SurfaceTextField
            autoFocus
            containerStyle={styles.customField}
            errorText={customOverMax ? 'Enter a tip up to $9,999.99.' : undefined}
            keyboardType="decimal-pad"
            label="Custom tip"
            placeholder="0.00"
            prefixText="$"
            value={customAmount}
            onChangeText={(text) => setCustomAmount(normalizeTipAmountInput(text))}
          />
        ) : null}

        <View style={styles.choiceRow}>
          <ChoiceButton
            label="Custom"
            selected={selection === 'custom'}
            styles={styles}
            textColor={selection === 'custom' ? colors.buttonPrimaryText : colors.text}
            onPress={() => select('custom')}
          />
          <ChoiceButton
            label="No tip"
            selected={selection === 'none'}
            styles={styles}
            textColor={selection === 'none' ? colors.buttonPrimaryText : colors.text}
            onPress={() => select('none')}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}

/**
 * @param {{
 *   label: string;
 *   selected: boolean;
 *   onPress: () => void;
 *   textColor: string;
 *   styles: {
 *     choicePress: object;
 *     choiceFace: object;
 *     choiceLabel: object;
 *     presetFaceSelected: object;
 *     presetFaceIdle: object;
 *   };
 * }} props
 */
function ChoiceButton({ label, selected, onPress, textColor, styles }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={styles.choicePress}
      onPress={onPress}
    >
      <View
        style={[styles.choiceFace, selected ? styles.presetFaceSelected : styles.presetFaceIdle]}
      >
        <AppText style={[styles.choiceLabel, { color: textColor }]}>{label}</AppText>
      </View>
    </Pressable>
  );
}
