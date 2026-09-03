import { StyleSheet, View } from 'react-native';
import { SuccessMoment } from '../../../../components/ui';

/**
 * Same confirmation moment as create-appointment after send succeeds.
 *
 * @param {object} props
 * @param {string} props.customerEmail
 */
export function CreateQuoteSendSuccess({ customerEmail }) {
  const email = String(customerEmail ?? '').trim();
  const body = email ? `We've sent the quote to ${email}.` : "We've sent the quote.";

  return (
    <View style={styles.root}>
      <SuccessMoment
        body={body}
        centered
        iconAccessibilityLabel="Quote sent"
        title="Quote sent"
        variant="inline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    flex: 1,
    width: '100%',
  },
});
