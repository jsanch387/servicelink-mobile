import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  SUBSCRIPTIONS_HOW_IT_WORKS_DONE_LABEL,
  SUBSCRIPTIONS_HOW_IT_WORKS_NEXT_LABEL,
  SUBSCRIPTIONS_HOW_IT_WORKS_STEPS,
  SUBSCRIPTIONS_HOW_IT_WORKS_TITLE,
} from '../constants/subscriptionsHowItWorksCopy';

/**
 * @param {{ visible: boolean; onRequestClose: () => void }} props
 */
export function SubscriptionsHowItWorksSheet({ visible, onRequestClose }) {
  const { colors } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = SUBSCRIPTIONS_HOW_IT_WORKS_STEPS;
  const last = stepIndex >= steps.length - 1;
  const step = steps[stepIndex] ?? steps[0];

  useEffect(() => {
    if (visible) setStepIndex(0);
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stage: {
          alignItems: 'center',
          paddingBottom: 8,
          paddingTop: 8,
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 22,
          borderWidth: 1,
          height: 64,
          justifyContent: 'center',
          marginBottom: 18,
          width: 64,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 28,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 23,
          marginTop: 8,
          maxWidth: 280,
          textAlign: 'center',
        },
        dots: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          marginTop: 22,
        },
        dot: {
          backgroundColor: colors.border,
          borderRadius: 4,
          height: 7,
          width: 7,
        },
        dotOn: {
          backgroundColor: colors.text,
          width: 18,
        },
        footer: {
          marginTop: 4,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      centerContent
      fitContent
      footer={
        <View style={styles.footer}>
          <Button
            fullWidth
            title={
              last ? SUBSCRIPTIONS_HOW_IT_WORKS_DONE_LABEL : SUBSCRIPTIONS_HOW_IT_WORKS_NEXT_LABEL
            }
            variant="primary"
            onPress={() => {
              if (last) {
                onRequestClose();
                return;
              }
              setStepIndex((n) => Math.min(n + 1, steps.length - 1));
            }}
          />
        </View>
      }
      title={SUBSCRIPTIONS_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.stage}>
        <View style={styles.iconBadge}>
          <Ionicons color={colors.text} name={step.icon} size={28} />
        </View>
        <AppText style={styles.title}>{step.title}</AppText>
        <AppText style={styles.body}>{step.body}</AppText>
        <View accessibilityLabel={`Step ${stepIndex + 1} of ${steps.length}`} style={styles.dots}>
          {steps.map((item, index) => (
            <View key={item.key} style={[styles.dot, index === stepIndex && styles.dotOn]} />
          ))}
        </View>
      </View>
    </BottomSheetModal>
  );
}
