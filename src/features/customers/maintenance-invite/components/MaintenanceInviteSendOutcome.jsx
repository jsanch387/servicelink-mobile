import { StyleSheet, View } from 'react-native';
import { SubmitOutcomeError, SubmitOutcomePending } from '../../../../components/ui';
import { MaintenanceInviteSendSuccess } from './MaintenanceInviteSendSuccess';

/**
 * @param {object} props
 * @param {'pending' | 'success' | 'error'} props.phase
 * @param {boolean} props.emailSent
 * @param {string} [props.notifiedEmail]
 * @param {string} [props.emailError]
 * @param {string} props.customerViewUrl
 * @param {string} props.errorMessage
 * @param {() => void} props.onDone
 * @param {() => void} props.onTryAgain
 */
export function MaintenanceInviteSendOutcome({
  phase,
  emailSent,
  notifiedEmail,
  emailError,
  customerViewUrl,
  errorMessage,
  onDone,
  onTryAgain,
}) {
  if (phase === 'pending') {
    return (
      <View style={styles.slot}>
        <SubmitOutcomePending
          accessibilityLabel="Sending maintenance offer"
          title="Sending offer"
        />
      </View>
    );
  }

  if (phase === 'success') {
    return (
      <View style={styles.slot}>
        <MaintenanceInviteSendSuccess
          customerViewUrl={customerViewUrl}
          emailError={emailError}
          emailSent={emailSent}
          notifiedEmail={notifiedEmail}
          onDone={onDone}
        />
      </View>
    );
  }

  return (
    <View style={styles.slot}>
      <SubmitOutcomeError
        message={errorMessage}
        primaryActionTitle="Back to review"
        title="Couldn’t send offer"
        onPrimaryAction={onTryAgain}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
});
