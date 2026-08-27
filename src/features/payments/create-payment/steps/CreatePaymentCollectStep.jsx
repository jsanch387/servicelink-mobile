import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { AppText, Button } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { CREATE_PAYMENT_COLLECT_SUBTITLE, CREATE_PAYMENT_COLLECT_TITLE } from '../constants';
import { CreatePaymentChargePending } from '../components/CreatePaymentChargePending';
import {
  CreatePaymentAmountCard,
  useCreatePaymentCardActionVariant,
} from '../components/CreatePaymentAmountCard';
import { hasCreatePaymentNote, parseCreatePaymentAmount } from '../utils/createPaymentAmount';

export function CreatePaymentCollectStep({
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onCharge,
  onPreviewPaid,
  charging = false,
  chargePhase = 'idle',
  readerWasWarm = false,
  error = null,
  footerPadding,
}) {
  const { colors } = useTheme();
  const parsed = parseCreatePaymentAmount(amount);
  const canCharge = parsed != null && hasCreatePaymentNote(note);
  const chargeVariant = useCreatePaymentCardActionVariant();
  const hasError = Boolean(error) && !charging;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        error: {
          color: colors.danger,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 16,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  if (charging) {
    return <CreatePaymentChargePending phase={chargePhase} readerWasWarm={readerWasWarm} />;
  }

  return (
    <CreatePaymentAmountCard
      action={
        <Button
          disabled={!canCharge}
          fullWidth
          testID="create-payment-charge"
          title={hasError ? 'Try again' : 'Charge'}
          variant={chargeVariant}
          onLongPress={
            typeof __DEV__ !== 'undefined' && __DEV__ && typeof onPreviewPaid === 'function'
              ? onPreviewPaid
              : undefined
          }
          onPress={onCharge}
        />
      }
      amount={amount}
      eyebrow={CREATE_PAYMENT_COLLECT_TITLE}
      footerPadding={footerPadding}
      hint={CREATE_PAYMENT_COLLECT_SUBTITLE}
      note={note}
      testID="create-payment-collect"
      onAmountChange={onAmountChange}
      onNoteChange={onNoteChange}
    >
      {hasError ? <AppText style={styles.error}>{error}</AppText> : null}
    </CreatePaymentAmountCard>
  );
}
