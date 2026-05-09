import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';

/**
 * @param {object} props
 * @param {number} props.stepIndex
 * @param {number} props.lastStepIndex
 * @param {boolean} props.canContinue
 * @param {boolean} props.sending
 * @param {boolean} props.disabled — e.g. missing business slug
 * @param {number} props.paddingBottom
 * @param {() => void} props.onBack
 * @param {() => void} props.onContinue
 * @param {string} props.sendButtonTitle
 * @param {boolean} [props.sendSuccessMode]
 * @param {() => void} [props.onSuccessDone]
 */
export function CreateQuoteWizardFooter({
  stepIndex,
  lastStepIndex,
  canContinue,
  sending,
  disabled = false,
  paddingBottom,
  onBack,
  onContinue,
  sendButtonTitle,
  sendSuccessMode = false,
  onSuccessDone,
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
          flexShrink: 0,
          gap: 12,
          marginTop: 'auto',
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 12,
        },
        footerBtn: {
          flex: 1,
        },
      }),
    [colors],
  );

  const isLast = stepIndex === lastStepIndex;
  const leftTitle = stepIndex === 0 ? 'Cancel' : 'Back';
  const rightTitle = isLast ? sendButtonTitle : 'Continue';

  if (sendSuccessMode) {
    return (
      <View style={[styles.footer, { paddingBottom }]}>
        <View style={styles.footerBtn}>
          <Button fullWidth title="Done" variant="primary" onPress={onSuccessDone} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.footer, { paddingBottom }]}>
      <View style={styles.footerBtn}>
        <Button fullWidth title={leftTitle} variant="secondary" onPress={onBack} />
      </View>
      <View style={styles.footerBtn}>
        <Button
          disabled={disabled || !canContinue || (isLast && sending)}
          fullWidth
          loading={isLast && sending}
          title={rightTitle}
          variant="primary"
          onPress={onContinue}
        />
      </View>
    </View>
  );
}
