import { StyleSheet, View } from 'react-native';
import { SubmitOutcomeError, SubmitOutcomePending } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';

/**
 * Full-screen quote submission progress and recoverable error state.
 *
 * @param {{
 *   error?: string | null;
 *   onBackToReview: () => void;
 * }} props
 */
export function CreateQuoteSubmittingState({ error, onBackToReview }) {
  return (
    <View style={styles.root}>
      {error ? (
        <View style={styles.errorSlot}>
          <SubmitOutcomeError
            iconAccessibilityLabel="Quote could not be sent"
            message={error}
            primaryActionTitle="Back to review"
            title="Couldn't send quote"
            onPrimaryAction={onBackToReview}
          />
        </View>
      ) : (
        <SubmitOutcomePending accessibilityLabel="Sending quote" title="Sending quote" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  errorSlot: {
    alignSelf: 'stretch',
    paddingHorizontal: SCREEN_GUTTER,
    width: '100%',
  },
});
