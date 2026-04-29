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
import { DEPOSIT_AMOUNT_MODE } from '../constants/depositAmount';
import { paymentLayoutStyles, paymentTextStyles } from '../constants/paymentTypography';
import {
  sanitizeFixedDepositInput,
  sanitizePercentageDepositInput,
} from '../utils/depositAmountModel';
import { PaymentDepositUnitSegment } from './PaymentDepositUnitSegment';

function depositHelperCopy(mode) {
  if (mode === DEPOSIT_AMOUNT_MODE.PERCENTAGE) {
    return 'Percent of the service cost.';
  }
  return 'Fixed amount in dollars.';
}

/**
 * Deposits settings UI (controlled). Persist via parent `Save changes` (e.g. `buildDepositSavePayload` when API exists).
 */
export function PaymentDepositsSection({
  requireDeposits,
  onRequireDepositsChange,
  depositAmount,
  onDepositAmountChange,
  depositMode,
  onDepositModeChange,
}) {
  const { colors } = useTheme();
  const inputTextStyle = useSurfaceInputTextStyle();
  const [inputFocused, setInputFocused] = useState(false);

  const setDepositModeAndClamp = useCallback(
    (next) => {
      onDepositModeChange(next);
      if (next === DEPOSIT_AMOUNT_MODE.PERCENTAGE) {
        const n = parseFloat(String(depositAmount).replace(/,/g, ''));
        if (!Number.isNaN(n) && n > 100) {
          onDepositAmountChange('100');
        }
      }
    },
    [depositAmount, onDepositAmountChange, onDepositModeChange],
  );

  const onAmountChange = useCallback(
    (text) => {
      if (depositMode === DEPOSIT_AMOUNT_MODE.FIXED) {
        onDepositAmountChange(sanitizeFixedDepositInput(text));
      } else {
        onDepositAmountChange(sanitizePercentageDepositInput(text));
      }
    },
    [depositMode, onDepositAmountChange],
  );

  const rowShellStyle = useMemo(
    () => ({
      borderColor: inputFocused ? colors.borderStrong : colors.inputBorder,
      borderWidth: inputFocused ? 1.5 : 1,
      flex: 1,
    }),
    [colors.borderStrong, colors.inputBorder, inputFocused],
  );

  const amountLeft =
    depositMode === DEPOSIT_AMOUNT_MODE.FIXED ? (
      <AppText style={[paymentTextStyles.inputPrefix, { color: colors.textMuted }]}>$</AppText>
    ) : null;

  const amountRight =
    depositMode === DEPOSIT_AMOUNT_MODE.PERCENTAGE ? (
      <AppText style={[paymentTextStyles.inputSuffix, { color: colors.textMuted }]}>%</AppText>
    ) : null;

  const placeholder = depositMode === DEPOSIT_AMOUNT_MODE.FIXED ? '0.00' : '0';

  return (
    <SurfaceCard style={styles.card}>
      <View style={paymentLayoutStyles.headerTextGroup}>
        <AppText style={[paymentTextStyles.sectionTitle, { color: colors.text }]}>Deposits</AppText>
        <AppText style={[paymentTextStyles.sectionBody, { color: colors.textMuted }]}>
          Collect part of the price when someone books. Amounts are in US dollars (USD).
        </AppText>
      </View>

      <SurfaceCard outlined padding="sm" style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <AppText
            style={[
              paymentTextStyles.toggleRowLabel,
              styles.toggleLabelText,
              { color: colors.text },
            ]}
          >
            Require deposits
          </AppText>
          <Switch
            thumbColor={requireDeposits ? '#f8fafc' : '#f4f4f5'}
            trackColor={{ false: colors.borderStrong, true: '#10b981' }}
            value={requireDeposits}
            onValueChange={onRequireDepositsChange}
          />
        </View>
      </SurfaceCard>

      <View style={styles.amountBlock}>
        <AppText style={[paymentTextStyles.fieldLabel, { color: colors.text }]}>
          Deposit amount
        </AppText>
        <View
          pointerEvents={requireDeposits ? 'auto' : 'none'}
          style={[styles.amountRowWrap, !requireDeposits && styles.amountRowDisabled]}
        >
          <View style={styles.amountRow}>
            <View style={styles.amountInputFlex}>
              <SurfaceInputRow left={amountLeft} right={amountRight} style={rowShellStyle}>
                <AppTextInput
                  editable={requireDeposits}
                  keyboardType="decimal-pad"
                  placeholder={placeholder}
                  placeholderTextColor={colors.placeholder}
                  style={inputTextStyle}
                  value={depositAmount}
                  onBlur={() => setInputFocused(false)}
                  onChangeText={onAmountChange}
                  onFocus={() => setInputFocused(true)}
                />
              </SurfaceInputRow>
            </View>
            <PaymentDepositUnitSegment
              disabled={!requireDeposits}
              value={depositMode}
              onChange={setDepositModeAndClamp}
            />
          </View>
        </View>
        <AppText
          style={[paymentTextStyles.caption, styles.helperAfterField, { color: colors.textMuted }]}
        >
          {depositHelperCopy(depositMode)}
        </AppText>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.footerRow}>
        <Ionicons
          color={colors.textMuted}
          name="information-circle-outline"
          size={16}
          style={styles.footerIcon}
        />
        <AppText
          style={[paymentTextStyles.caption, styles.footerText, { color: colors.textMuted }]}
        >
          Deposits up front often mean fewer no-shows.
        </AppText>
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
  },
  toggleLabelText: {
    flex: 1,
    paddingRight: 12,
  },
  amountBlock: {
    gap: 10,
  },
  helperAfterField: {
    marginTop: 0,
  },
  amountRowWrap: {
    alignSelf: 'stretch',
  },
  amountRowDisabled: {
    opacity: 0.4,
  },
  amountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  amountInputFlex: {
    flex: 1,
    minWidth: 0,
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
  footerText: {
    flex: 1,
  },
});
