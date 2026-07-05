import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { BottomSheetModal, Button, SurfaceTextField } from '../../../../components/ui';

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
 * Slides up over the complete-visit full screen for adding a fee line item.
 *
 * @param {{
 *   onClose: () => void;
 *   onAdd: (fee: { label: string; amount: number }) => void;
 * }} props
 */
export function CompleteVisitAddFeeSheet({ onClose, onAdd }) {
  const [visible, setVisible] = useState(true);
  const pendingAfterCloseRef = useRef(null);
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fields: {
          gap: 16,
          width: '100%',
        },
        fieldFlush: {
          marginBottom: 0,
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
    [],
  );

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }
    onAdd({
      label: label.trim() || 'Additional fee',
      amount: parsedAmount,
    });
    close();
  };

  return (
    <BottomSheetModal
      footer={
        <View style={styles.footerWrap}>
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
        </View>
      }
      sheetHeightPercent={92}
      stickyFooter
      subtitle="Extra charge for this service — shows on the breakdown."
      title="Add fee"
      visible={visible}
      onRequestClose={close}
    >
      <View style={styles.fields}>
        <SurfaceTextField
          containerStyle={styles.fieldFlush}
          label="Description"
          placeholder="Extra soil removal"
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
      </View>
    </BottomSheetModal>
  );
}
