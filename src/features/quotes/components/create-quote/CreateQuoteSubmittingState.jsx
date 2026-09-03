import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, EchoBarsLoader, SubmitOutcomeError } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useCyclingStatusMessage } from '../../../../hooks/useCyclingStatusMessage';
import { useTheme } from '../../../../theme';

const QUOTE_SUBMIT_STATUS_MESSAGES = ['Sending quote', 'Notifying customer', 'Finishing up'];

/**
 * Full-screen quote submission progress and recoverable error state.
 * Matches create-appointment: echo bars + cycling status.
 *
 * @param {{
 *   active?: boolean;
 *   error?: string | null;
 *   onBackToReview: () => void;
 * }} props
 */
export function CreateQuoteSubmittingState({ active = false, error, onBackToReview }) {
  const { colors } = useTheme();
  const statusMessage = useCyclingStatusMessage(active && !error, QUOTE_SUBMIT_STATUS_MESSAGES);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'stretch',
          flex: 1,
          flexGrow: 1,
          justifyContent: 'center',
          width: '100%',
        },
        loaderWrap: {
          marginBottom: 20,
        },
        status: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        errorSlot: {
          alignSelf: 'stretch',
          paddingHorizontal: SCREEN_GUTTER,
          width: '100%',
        },
      }),
    [colors],
  );

  if (error) {
    return (
      <View style={styles.root}>
        <View style={styles.errorSlot}>
          <SubmitOutcomeError
            iconAccessibilityLabel="Quote could not be sent"
            message={error}
            primaryActionTitle="Back to review"
            title="Couldn't send quote"
            onPrimaryAction={onBackToReview}
          />
        </View>
      </View>
    );
  }

  return (
    <View accessibilityLiveRegion="polite" style={styles.root}>
      <View style={styles.loaderWrap}>
        <EchoBarsLoader accessibilityLabel="Sending quote" size="large" />
      </View>
      <AppText style={styles.status}>{statusMessage}</AppText>
    </View>
  );
}
