import { StyleSheet, View } from 'react-native';
import { SuccessMoment } from '../../../components/ui';

/**
 * Same confirmation moment as create-appointment after send succeeds.
 *
 * @param {object} props
 * @param {string} props.body
 */
export function InvoiceSendSuccess({ body }) {
  return (
    <View style={styles.root}>
      <SuccessMoment
        body={body}
        centered
        iconAccessibilityLabel="Invoice sent"
        title="Invoice sent"
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
