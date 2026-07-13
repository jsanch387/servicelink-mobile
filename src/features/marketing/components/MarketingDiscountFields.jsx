import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceTextField } from '../../../components/ui';
import { DEPOSIT_AMOUNT_MODE } from '../../payments/constants/depositAmount';
import { PaymentDepositUnitSegment } from '../../payments/components/PaymentDepositUnitSegment';
import {
  sanitizeFixedDepositInput,
  sanitizePercentageDepositInput,
} from '../../payments/utils/depositAmountModel';
import { useTheme } from '../../../theme';

/**
 * @param {object} props
 * @param {string} props.discountMode
 * @param {(mode: string) => void} props.onDiscountModeChange
 * @param {string} props.discountAmount
 * @param {(amount: string) => void} props.onDiscountAmountChange
 * @param {string} [props.errorText]
 */
export function MarketingDiscountFields({
  discountMode,
  onDiscountModeChange,
  discountAmount,
  onDiscountAmountChange,
  errorText,
}) {
  const { colors } = useTheme();
  const isPercent = discountMode === DEPOSIT_AMOUNT_MODE.PERCENTAGE;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginBottom: 10,
        },
        row: {
          alignItems: 'flex-end',
          flexDirection: 'row',
          gap: 12,
        },
        amountGrow: {
          flex: 1,
          minWidth: 0,
        },
      }),
    [colors],
  );

  return (
    <View>
      <AppText style={styles.label}>Discount</AppText>
      <View style={styles.row}>
        <PaymentDepositUnitSegment value={discountMode} onChange={onDiscountModeChange} />
        <View style={styles.amountGrow}>
          <SurfaceTextField
            containerStyle={{ marginBottom: 0 }}
            errorText={errorText}
            keyboardType="decimal-pad"
            placeholder={isPercent ? '10' : '25'}
            value={discountAmount}
            onChangeText={(raw) =>
              onDiscountAmountChange(
                isPercent ? sanitizePercentageDepositInput(raw) : sanitizeFixedDepositInput(raw),
              )
            }
          />
        </View>
      </View>
    </View>
  );
}
