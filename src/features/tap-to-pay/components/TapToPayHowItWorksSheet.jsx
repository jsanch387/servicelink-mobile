import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  TAP_TO_PAY_HOW_IT_WORKS_DISMISS_LABEL,
  TAP_TO_PAY_HOW_IT_WORKS_INTRO,
  TAP_TO_PAY_HOW_IT_WORKS_SHEET_TITLE,
  TAP_TO_PAY_HOW_IT_WORKS_STEPS,
  TAP_TO_PAY_VIEW_DEMO_HINT,
  TAP_TO_PAY_VIEW_DEMO_LABEL,
} from '../constants/tapToPayHowItWorksCopy';
import {
  getTapToPayEducationUnavailableMessage,
  isTapToPayEducationAvailable,
  presentTapToPayEducation,
} from '../native/presentTapToPayEducation';

/**
 * ServiceLink checkout explainer with optional replay of Apple’s merchant education.
 */
export function TapToPayHowItWorksSheet({ visible, onRequestClose }) {
  const { colors } = useTheme();
  const dismiss = onRequestClose ?? (() => {});
  const [openingDemo, setOpeningDemo] = useState(false);
  const canViewDemo = isTapToPayEducationAvailable();

  const openAppleDemo = useCallback(async () => {
    if (!isTapToPayEducationAvailable()) {
      Alert.alert('Tap to Pay demo', getTapToPayEducationUnavailableMessage());
      return;
    }

    setOpeningDemo(true);
    try {
      await presentTapToPayEducation({ markSeen: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open Tap to Pay demo.';
      Alert.alert('Tap to Pay demo', message);
    } finally {
      setOpeningDemo(false);
    }
  }, []);

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
          marginBottom: canViewDemo ? 18 : 0,
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
        demoBlock: {
          gap: 12,
          marginBottom: 4,
        },
        demoHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        footer: {
          gap: 10,
          marginTop: 20,
        },
      }),
    [canViewDemo, colors],
  );

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          {canViewDemo ? (
            <Button
              fullWidth
              loading={openingDemo}
              title={TAP_TO_PAY_VIEW_DEMO_LABEL}
              variant="primary"
              onPress={() => {
                void openAppleDemo();
              }}
            />
          ) : null}
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
      {canViewDemo ? (
        <View style={styles.demoBlock}>
          <AppText style={styles.demoHint}>{TAP_TO_PAY_VIEW_DEMO_HINT}</AppText>
        </View>
      ) : null}
    </BottomSheetModal>
  );
}
