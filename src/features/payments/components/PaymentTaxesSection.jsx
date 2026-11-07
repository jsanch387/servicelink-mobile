import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import {
  AppText,
  AppTextInput,
  Divider,
  SurfaceCard,
  SurfaceInputRow,
  useSurfaceInputTextStyle,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { paymentLayoutStyles, paymentTextStyles } from '../constants/paymentTypography';
import { sanitizeTaxPercentInput } from '../utils/taxRateModel';

/**
 * Shop sales tax (controlled). One rate, percent only. Parent persists `payment_settings`.
 */
export function PaymentTaxesSection({ collectTax, onCollectTaxChange, taxRate, onTaxRateChange }) {
  const { colors } = useTheme();
  const inputTextStyle = useSurfaceInputTextStyle();
  const [inputFocused, setInputFocused] = useState(false);

  const onRateChange = useCallback(
    (text) => {
      onTaxRateChange(sanitizeTaxPercentInput(text));
    },
    [onTaxRateChange],
  );

  const rowShellStyle = useMemo(
    () => ({
      borderColor: inputFocused ? colors.borderStrong : colors.inputBorder,
      borderWidth: inputFocused ? 1.5 : 1,
    }),
    [colors.borderStrong, colors.inputBorder, inputFocused],
  );

  return (
    <SurfaceCard style={styles.card}>
      <View style={paymentLayoutStyles.headerTextGroup}>
        <AppText style={[paymentTextStyles.sectionTitle, { color: colors.text }]}>Taxes</AppText>
        <AppText style={[paymentTextStyles.sectionBody, { color: colors.textMuted }]}>
          Add a percentage on top of the price.
        </AppText>
      </View>

      <SurfaceCard outlined padding="sm" style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelCol}>
            <AppText
              numberOfLines={1}
              style={[paymentTextStyles.toggleRowLabel, { color: colors.text }]}
            >
              Collect sales tax
            </AppText>
          </View>
          <View style={styles.switchCol}>
            <Switch
              accessibilityLabel="Collect sales tax"
              thumbColor={collectTax ? '#f8fafc' : '#f4f4f5'}
              trackColor={{ false: colors.borderStrong, true: '#10b981' }}
              value={collectTax}
              onValueChange={onCollectTaxChange}
            />
          </View>
        </View>
      </SurfaceCard>

      {collectTax ? (
        <View style={styles.amountBlock}>
          <AppText style={[paymentTextStyles.fieldLabel, { color: colors.text }]}>Tax rate</AppText>
          <SurfaceInputRow
            right={
              <AppText style={[paymentTextStyles.inputSuffix, { color: colors.textMuted }]}>
                %
              </AppText>
            }
            style={rowShellStyle}
          >
            <AppTextInput
              accessibilityLabel="Tax rate"
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.placeholder}
              style={inputTextStyle}
              value={taxRate}
              onBlur={() => setInputFocused(false)}
              onChangeText={onRateChange}
              onFocus={() => setInputFocused(true)}
            />
          </SurfaceInputRow>
        </View>
      ) : null}

      <Divider style={styles.divider} />

      <View style={styles.footerRow}>
        <Ionicons
          color={colors.textMuted}
          name="information-circle-outline"
          size={16}
          style={styles.footerIcon}
        />
        <View style={styles.footerTextCol}>
          <AppText style={[paymentTextStyles.caption, { color: colors.textMuted }]}>
            Tax is added to the final price.
          </AppText>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  toggleCard: {
    marginBottom: 0,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    width: '100%',
  },
  toggleLabelCol: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingRight: 12,
  },
  switchCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBlock: {
    gap: 10,
  },
  divider: {
    marginTop: 4,
  },
  footerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  footerIcon: {
    marginTop: 1,
  },
  footerTextCol: {
    flex: 1,
    minWidth: 0,
  },
});
