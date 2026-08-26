import { StyleSheet, View } from 'react-native';
import { SuccessMoment } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { CREATE_PAYMENT_PAID_SUBTITLE, CREATE_PAYMENT_PAID_TITLE } from '../constants';

export function CreatePaymentPaidStep({ footerPadding }) {
  return (
    <View style={[styles.root, { paddingBottom: footerPadding }]} testID="create-payment-paid">
      <SuccessMoment
        body={CREATE_PAYMENT_PAID_SUBTITLE}
        centered
        iconAccessibilityLabel="You’re paid"
        title={CREATE_PAYMENT_PAID_TITLE}
        variant="inline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: SCREEN_GUTTER,
  },
});
