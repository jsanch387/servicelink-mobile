import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Wizard Back + Continue/Confirm, or a single Done button after success.
 *
 * @param {object} props
 * @param {boolean} props.appointmentConfirmed
 * @param {number} props.step
 * @param {number} props.lastStepIndex
 * @param {boolean} props.canContinue
 * @param {boolean} props.confirmLoading
 * @param {number} props.paddingBottom
 * @param {() => void} props.onBack
 * @param {() => void} props.onContinue
 * @param {() => void} props.onDone
 */
export function CreateFlowFooter({
  appointmentConfirmed,
  step,
  lastStepIndex,
  canContinue,
  confirmLoading,
  paddingBottom,
  onBack,
  onContinue,
  onDone,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        footer: {
          backgroundColor: colors.shell,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 12,
        },
        footerDone: {
          flexDirection: 'column',
          gap: 0,
        },
        footerBtn: {
          flex: 1,
        },
      }),
    [colors],
  );

  if (appointmentConfirmed) {
    return (
      <View style={[styles.footer, styles.footerDone, { paddingBottom }]}>
        <Button fullWidth title="Done" variant="primary" onPress={onDone} />
      </View>
    );
  }

  const isLast = step === lastStepIndex;

  return (
    <View style={[styles.footer, { paddingBottom }]}>
      <View style={styles.footerBtn}>
        <Button
          fullWidth
          title={step === 0 ? 'Cancel' : 'Back'}
          variant="secondary"
          onPress={onBack}
        />
      </View>
      <View style={styles.footerBtn}>
        <Button
          accessibilityLabel={isLast ? 'Create appointment' : undefined}
          disabled={!canContinue || (isLast && confirmLoading)}
          fullWidth
          loading={isLast && confirmLoading}
          title={isLast ? 'Confirm' : 'Continue'}
          variant="primary"
          onPress={onContinue}
        />
      </View>
    </View>
  );
}
