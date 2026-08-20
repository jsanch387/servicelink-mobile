import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  EchoBarsLoader,
  SubmitOutcomeError,
  SuccessMoment,
} from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Create-subscription submit states inside the new-subscription sheet.
 *
 * @param {{
 *   phase: 'pending' | 'success' | 'error';
 *   errorMessage?: string | null;
 *   onRetry: () => void;
 *   onDone: () => void;
 * }} props
 */
export function SubscriptionsCreatePlanOutcome({ phase, errorMessage = null, onRetry, onDone }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          minHeight: 320,
          paddingVertical: 24,
          width: '100%',
        },
        pendingMessage: {
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
          marginTop: 20,
          textAlign: 'center',
        },
        doneWrap: {
          marginTop: 28,
          width: '100%',
        },
      }),
    [colors],
  );

  if (phase === 'error') {
    return (
      <SubmitOutcomeError
        iconAccessibilityLabel="Subscription could not be created"
        message={errorMessage}
        primaryActionTitle="Try again"
        title="Couldn't create subscription"
        variant="inline"
        onPrimaryAction={onRetry}
      />
    );
  }

  if (phase === 'success') {
    return (
      <SuccessMoment
        centered
        iconAccessibilityLabel="Subscription created"
        title="Your subscription is ready"
        variant="inline"
        body="Customers can choose it when they book."
      >
        <View style={styles.doneWrap}>
          <Button fullWidth title="Done" variant="surfaceLight" onPress={onDone} />
        </View>
      </SuccessMoment>
    );
  }

  return (
    <View
      accessibilityLabel="Creating subscription"
      accessibilityLiveRegion="polite"
      style={styles.root}
    >
      <EchoBarsLoader accessibilityLabel="Creating subscription" size="large" />
      <AppText style={styles.pendingMessage}>Creating subscription</AppText>
    </View>
  );
}
