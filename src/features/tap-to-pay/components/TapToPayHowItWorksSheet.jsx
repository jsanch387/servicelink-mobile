import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  TAP_TO_PAY_HOW_IT_WORKS_DISMISS_LABEL,
  TAP_TO_PAY_HOW_IT_WORKS_INTRO,
  TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE,
  TAP_TO_PAY_HOW_IT_WORKS_STEPS,
} from '../constants/tapToPayHowItWorksCopy';

/**
 * In-app explainer for Tap to Pay in ServiceLink (checkout flow), not Apple’s merchant card guide.
 */
export function TapToPayHowItWorksSheet({ visible, onRequestClose }) {
  const { colors } = useTheme();
  const dismiss = onRequestClose ?? (() => {});

  const styles = useMemo(
    () =>
      StyleSheet.create({
        intro: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          marginBottom: 18,
        },
        steps: {
          gap: 14,
        },
        stepRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
        },
        stepNumber: {
          alignItems: 'center',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 999,
          height: 24,
          justifyContent: 'center',
          marginTop: 1,
          minWidth: 24,
          paddingHorizontal: 6,
        },
        stepNumberText: {
          color: colors.buttonPrimaryText,
          fontSize: 13,
          fontWeight: '700',
        },
        stepText: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        footer: {
          marginTop: 20,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <Button
            fullWidth
            title={TAP_TO_PAY_HOW_IT_WORKS_DISMISS_LABEL}
            variant="secondary"
            onPress={dismiss}
          />
        </View>
      }
      sheetHeightPercent={58}
      title={TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE}
      visible={visible}
      onRequestClose={dismiss}
    >
      <AppText style={styles.intro}>{TAP_TO_PAY_HOW_IT_WORKS_INTRO}</AppText>
      <View style={styles.steps}>
        {TAP_TO_PAY_HOW_IT_WORKS_STEPS.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <AppText style={styles.stepNumberText}>{index + 1}</AppText>
            </View>
            <AppText style={styles.stepText}>{step}</AppText>
          </View>
        ))}
      </View>
    </BottomSheetModal>
  );
}
