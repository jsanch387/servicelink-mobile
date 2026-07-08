import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, EchoBarsLoader, SubmitOutcomeError } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { useCyclingSubmitStatusMessage } from '../hooks/useCyclingSubmitStatusMessage';
import { buildSubmitStatusMessages } from '../utils/submitStatusMessages';

/**
 * Centered submit progress or shared outcome error on the review step.
 *
 * @param {object} props
 * @param {boolean} props.active
 * @param {string | null | undefined} props.error
 * @param {boolean} [props.hasCustomerPhone]
 * @param {boolean} [props.immersive] Full-screen submit (nav header hidden)
 * @param {() => void} [props.onRetryFromError]
 */
export function CreateAppointmentSubmittingState({
  active,
  error,
  hasCustomerPhone = false,
  immersive = false,
  onRetryFromError,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const messages = useMemo(
    () => buildSubmitStatusMessages({ hasCustomerPhone }),
    [hasCustomerPhone],
  );
  const statusMessage = useCyclingSubmitStatusMessage(active, messages);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'stretch',
          flex: 1,
          flexGrow: 1,
          justifyContent: 'center',
          minHeight: immersive ? undefined : 280,
          paddingTop: immersive ? insets.top : 0,
          paddingVertical: immersive ? 0 : 24,
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
          width: '100%',
        },
      }),
    [colors, immersive, insets.top],
  );

  if (error) {
    return (
      <View style={styles.root}>
        <View style={styles.errorSlot}>
          <SubmitOutcomeError
            iconAccessibilityLabel="Appointment could not be created"
            message={error}
            primaryActionTitle="Back to review"
            title="Couldn't create appointment"
            onPrimaryAction={onRetryFromError ?? (() => {})}
          />
        </View>
      </View>
    );
  }

  return (
    <View accessibilityLiveRegion="polite" style={styles.root}>
      <View style={styles.loaderWrap}>
        <EchoBarsLoader accessibilityLabel="Creating appointment" size="large" />
      </View>
      <AppText style={styles.status}>{statusMessage}</AppText>
    </View>
  );
}
