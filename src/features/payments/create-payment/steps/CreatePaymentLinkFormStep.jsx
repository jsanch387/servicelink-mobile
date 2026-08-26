import { Button } from '../../../../components/ui';
import {
  CreatePaymentAmountCard,
  useCreatePaymentCardActionVariant,
} from '../components/CreatePaymentAmountCard';
import {
  CREATE_PAYMENT_LINK_CREATE_LABEL,
  CREATE_PAYMENT_LINK_SUBTITLE,
  CREATE_PAYMENT_LINK_TITLE,
} from '../constants';
import { hasCreatePaymentNote, parseCreatePaymentAmount } from '../utils/createPaymentAmount';

export function CreatePaymentLinkFormStep({
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onCreateLink,
  creating = false,
  footerPadding,
}) {
  const parsed = parseCreatePaymentAmount(amount);
  const canCreate = parsed != null && hasCreatePaymentNote(note);
  const actionVariant = useCreatePaymentCardActionVariant();

  return (
    <CreatePaymentAmountCard
      action={
        <Button
          disabled={!canCreate || creating}
          fullWidth
          loading={creating}
          testID="create-payment-create-link"
          title={CREATE_PAYMENT_LINK_CREATE_LABEL}
          variant={actionVariant}
          onPress={onCreateLink}
        />
      }
      amount={amount}
      eyebrow={CREATE_PAYMENT_LINK_TITLE}
      footerPadding={footerPadding}
      hint={CREATE_PAYMENT_LINK_SUBTITLE}
      note={note}
      testID="create-payment-link-form"
      onAmountChange={onAmountChange}
      onNoteChange={onNoteChange}
    />
  );
}
