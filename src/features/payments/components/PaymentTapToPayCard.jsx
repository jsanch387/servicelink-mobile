import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { TapToPayHowItWorksSheet } from '../../tap-to-pay/components/TapToPayHowItWorksSheet';
import {
  TAP_TO_PAY_ENABLE_CTA_LABEL,
  TAP_TO_PAY_ENABLED_LABEL,
} from '../../tap-to-pay/constants/tapToPayEnableCopy';
import {
  TAP_TO_PAY_HOW_IT_WORKS_LABEL,
  TAP_TO_PAY_PAYMENTS_CARD_LEAD_READY,
  TAP_TO_PAY_PAYMENTS_CARD_LEAD_SETUP,
  TAP_TO_PAY_PAYMENTS_CARD_TITLE,
} from '../../tap-to-pay/constants/tapToPayHowItWorksCopy';
import { paymentTextStyles } from '../constants/paymentTypography';

/**
 * @param {{
 *   isEnabled: boolean;
 *   checking: boolean;
 *   isEnabling: boolean;
 *   canEnable: boolean;
 *   onEnablePress: () => void;
 * }} props
 */
export function PaymentTapToPayCard({ isEnabled, checking, isEnabling, canEnable, onEnablePress }) {
  const { colors } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);

  const showEnableCta = canEnable && !checking && !isEnabled;
  const showEnabledPill = isEnabled && !checking;

  const leadCopy = showEnabledPill
    ? TAP_TO_PAY_PAYMENTS_CARD_LEAD_READY
    : TAP_TO_PAY_PAYMENTS_CARD_LEAD_SETUP;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: 14,
        },
        topRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
        },
        leftCluster: {
          alignItems: 'flex-start',
          flex: 1,
          flexDirection: 'row',
          gap: 12,
          minWidth: 0,
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: colors.buttonPrimaryBg,
          borderColor: colors.buttonPrimaryBg,
          borderRadius: 12,
          borderWidth: 1,
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
        textColumn: {
          flex: 1,
          gap: 2,
          minWidth: 0,
          paddingTop: 2,
        },
        lead: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        enabledPill: {
          alignItems: 'center',
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          borderRadius: 999,
          flexDirection: 'row',
          flexShrink: 0,
          gap: 5,
          marginTop: 2,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        enabledPillText: {
          color: '#15803d',
          fontSize: 12,
          fontWeight: '700',
        },
      }),
    [colors],
  );

  return (
    <>
      <SurfaceCard style={styles.card} testID="payments-tap-to-pay-card">
        <View style={styles.topRow}>
          <View style={styles.leftCluster}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.iconBadge}
            >
              <MaterialCommunityIcons
                color={colors.buttonPrimaryText}
                name="contactless-payment"
                size={22}
              />
            </View>
            <View style={styles.textColumn}>
              <AppText style={[paymentTextStyles.sectionTitle, { color: colors.text }]}>
                {TAP_TO_PAY_PAYMENTS_CARD_TITLE}
              </AppText>
              <AppText style={styles.lead}>{leadCopy}</AppText>
            </View>
          </View>
          {showEnabledPill ? (
            <View
              accessibilityLabel="Tap to Pay enabled on this iPhone"
              accessibilityRole="text"
              style={styles.enabledPill}
            >
              <Ionicons color="#16a34a" name="checkmark-circle" size={14} />
              <AppText style={styles.enabledPillText}>{TAP_TO_PAY_ENABLED_LABEL}</AppText>
            </View>
          ) : null}
        </View>

        <Button
          fullWidth
          title={TAP_TO_PAY_HOW_IT_WORKS_LABEL}
          variant="secondary"
          onPress={() => setSheetVisible(true)}
        />

        {showEnableCta ? (
          <Button
            fullWidth
            loading={isEnabling}
            title={TAP_TO_PAY_ENABLE_CTA_LABEL}
            variant="primary"
            onPress={onEnablePress}
          />
        ) : null}
      </SurfaceCard>
      <TapToPayHowItWorksSheet
        visible={sheetVisible}
        onRequestClose={() => setSheetVisible(false)}
      />
    </>
  );
}
