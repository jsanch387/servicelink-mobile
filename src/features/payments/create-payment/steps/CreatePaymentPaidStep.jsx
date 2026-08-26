import { StyleSheet, View } from 'react-native';
import { Button, SuccessMoment } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { CREATE_PAYMENT_PAID_SUBTITLE, CREATE_PAYMENT_PAID_TITLE } from '../constants';

export function CreatePaymentPaidStep({ footerPadding, onDone }) {
  return (
    <View style={[styles.root, { paddingBottom: footerPadding }]} testID="create-payment-paid">
      <View style={styles.moment}>
        <SuccessMoment
          body={CREATE_PAYMENT_PAID_SUBTITLE}
          centered
          iconAccessibilityLabel="You’re paid"
          title={CREATE_PAYMENT_PAID_TITLE}
          variant="inline"
        />
      </View>
      <Button
        accessibilityLabel="Done"
        fullWidth
        testID="create-payment-paid-done"
        title="Done"
        variant="primary"
        onPress={onDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: SCREEN_GUTTER,
  },
  moment: {
    flex: 1,
  },
});
