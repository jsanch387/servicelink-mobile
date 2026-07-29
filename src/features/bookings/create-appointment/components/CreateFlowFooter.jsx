import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';

/**
 * Wizard Back + Continue/Confirm, or a single Done button after success.
 *
 * @param {object} props
 * @param {boolean} props.appointmentConfirmed
 * @param {number} props.step
 * @param {number} props.lastStepIndex
 * @param {boolean} props.canContinue
 * @param {boolean} [props.confirmLoading]
 * @param {boolean} [props.hideWhileSubmitPanel]
 * @param {number} props.paddingBottom
 * @param {() => void} props.onBack
 * @param {() => void} props.onContinue
 * @param {() => void} props.onDone
 * @param {string} [props.lastStepPrimaryTitle]
 * @param {string} [props.lastStepAccessibilityLabel]
 * @param {boolean} [props.editHubMode] Hub list only — no footer (section screens own Save)
 * @param {boolean} [props.editSectionMode] Back + Done (single-section edit)
 * @param {string} [props.sectionPrimaryTitle]
 * @param {string} [props.backTitle]
 */
export function CreateFlowFooter({
  appointmentConfirmed,
  step,
  lastStepIndex,
  canContinue,
  confirmLoading = false,
  hideWhileSubmitPanel = false,
  paddingBottom,
  onBack,
  onContinue,
  onDone,
  lastStepPrimaryTitle = 'Confirm',
  lastStepAccessibilityLabel,
  editHubMode = false,
  editSectionMode = false,
  sectionPrimaryTitle = 'Done',
  backTitle,
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
          paddingHorizontal: SCREEN_GUTTER,
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

  if (hideWhileSubmitPanel) {
    return null;
  }

  if (appointmentConfirmed) {
    return (
      <View style={[styles.footer, styles.footerDone, { paddingBottom }]}>
        <Button fullWidth title="Done" variant="primary" onPress={onDone} />
      </View>
    );
  }

  if (editHubMode) {
    // Edit hub is list-only — save lives on each section; header back exits.
    return null;
  }

  if (editSectionMode) {
    return (
      <View style={[styles.footer, { paddingBottom }]}>
        <View style={styles.footerBtn}>
          <Button fullWidth title="Back" variant="secondary" onPress={onBack} />
        </View>
        <View style={styles.footerBtn}>
          <Button
            accessibilityLabel={
              sectionPrimaryTitle === lastStepPrimaryTitle || sectionPrimaryTitle === 'Save changes'
                ? (lastStepAccessibilityLabel ?? sectionPrimaryTitle)
                : undefined
            }
            disabled={!canContinue || confirmLoading}
            fullWidth
            loading={confirmLoading}
            title={sectionPrimaryTitle}
            variant="primary"
            onPress={onContinue}
          />
        </View>
      </View>
    );
  }

  const isLast = step === lastStepIndex;

  return (
    <View style={[styles.footer, { paddingBottom }]}>
      <View style={styles.footerBtn}>
        <Button
          fullWidth
          title={backTitle ?? (step === 0 ? 'Cancel' : 'Back')}
          variant="secondary"
          onPress={onBack}
        />
      </View>
      <View style={styles.footerBtn}>
        <Button
          accessibilityLabel={
            isLast ? (lastStepAccessibilityLabel ?? lastStepPrimaryTitle) : undefined
          }
          disabled={!canContinue || (isLast && confirmLoading)}
          fullWidth
          loading={isLast && confirmLoading}
          title={isLast ? lastStepPrimaryTitle : 'Continue'}
          variant="primary"
          onPress={onContinue}
        />
      </View>
    </View>
  );
}
