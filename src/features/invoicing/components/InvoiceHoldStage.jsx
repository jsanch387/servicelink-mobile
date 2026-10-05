import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, EchoBarsLoader, SubmitOutcomeError } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';

/**
 * Centered echo bars, or an error with a way back, on the invoice screen.
 *
 * @param {object} props
 * @param {string} props.pendingLabel
 * @param {string} [props.pendingAccessibilityLabel]
 * @param {string} [props.errorTitle]
 * @param {string} [props.errorMessage]
 * @param {string} [props.errorAccessibilityLabel]
 * @param {string} [props.backTitle]
 * @param {() => void} [props.onBack]
 */
export function InvoiceHoldStage({
  pendingLabel,
  pendingAccessibilityLabel,
  errorTitle = '',
  errorMessage = '',
  errorAccessibilityLabel = 'Invoice could not be updated',
  backTitle = 'Back to invoice',
  onBack,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        center: {
          alignItems: 'center',
          bottom: 0,
          justifyContent: 'center',
          left: 0,
          paddingHorizontal: SCREEN_GUTTER,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        error: {
          alignSelf: 'stretch',
          width: '100%',
        },
        label: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
          marginTop: 20,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        {errorMessage ? (
          <View style={styles.error}>
            <SubmitOutcomeError
              iconAccessibilityLabel={errorAccessibilityLabel}
              message={errorMessage}
              primaryActionTitle={backTitle}
              title={errorTitle}
              onPrimaryAction={onBack}
            />
          </View>
        ) : (
          <>
            <EchoBarsLoader
              accessibilityLabel={pendingAccessibilityLabel || pendingLabel}
              size="large"
            />
            <AppText style={styles.label}>{pendingLabel}</AppText>
          </>
        )}
      </View>
    </View>
  );
}
