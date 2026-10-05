import { Alert } from 'react-native';

export const DELETE_INVOICE_CONFIRM_MESSAGE =
  "This can't be undone. The link you sent your customer will stop working. If they paid by card, that charge is not refunded.";

/**
 * @param {() => void} onConfirm
 */
export function confirmDeleteInvoice(onConfirm) {
  Alert.alert('Delete this invoice?', DELETE_INVOICE_CONFIRM_MESSAGE, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete invoice', style: 'destructive', onPress: onConfirm },
  ]);
}
