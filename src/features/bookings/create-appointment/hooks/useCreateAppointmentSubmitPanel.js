import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { safeUserFacingMessage } from '../../../../utils/safeUserFacingMessage';
import { CREATE_APPOINTMENT_STEP, CREATE_APPOINTMENT_SUBMIT_ERROR_FALLBACK } from '../constants';

/**
 * Review-step submit panel: loading state, error outcome, and error haptic.
 *
 * @param {object} args
 * @param {number} args.step
 * @param {boolean} args.appointmentConfirmed
 * @param {boolean} args.isMutationPending
 * @param {boolean} [args.confirmRequested] Set synchronously when Confirm is tapped (before mutation pending).
 * @param {string | undefined | null} args.customerPhone
 * @param {string | undefined | null} args.customerEmail
 */
export function useCreateAppointmentSubmitPanel({
  step,
  appointmentConfirmed,
  isMutationPending,
  confirmRequested = false,
  customerPhone,
  customerEmail,
}) {
  const [submitError, setSubmitError] = useState(null);

  const isSubmitting = isMutationPending;
  const showSubmitPanel =
    step === CREATE_APPOINTMENT_STEP.REVIEW &&
    !appointmentConfirmed &&
    (confirmRequested || isSubmitting || Boolean(submitError));

  const shouldNotifyCustomer = [customerPhone, customerEmail].some((value) =>
    Boolean(String(value ?? '').trim()),
  );

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const handleMutationError = useCallback((error) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    setSubmitError(
      safeUserFacingMessage(error, { fallback: CREATE_APPOINTMENT_SUBMIT_ERROR_FALLBACK }),
    );
  }, []);

  return {
    clearSubmitError,
    handleMutationError,
    shouldNotifyCustomer,
    isSubmitting,
    showSubmitPanel,
    submitError,
  };
}
