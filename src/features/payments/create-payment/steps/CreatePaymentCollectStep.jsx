import { Button } from '../../../../components/ui';
import {
  CREATE_PAYMENT_COLLECT_SUBTITLE,
  CREATE_PAYMENT_COLLECT_TITLE,
} from '../constants';
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
  charging = false,
  footerPadding,
}) {
  const parsed = parseCreatePaymentAmount(amount);
  const canCharge = parsed != null && hasCreatePaymentNote(note);
  const chargeVariant = useCreatePaymentCardActionVariant();

  return (
    <CreatePaymentAmountCard
      action={
        <Button
          disabled={!canCharge || charging}
          fullWidth
          loading={charging}
          testID="create-payment-charge"
          title="Charge"
          variant={chargeVariant}
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
    />
  );
}
