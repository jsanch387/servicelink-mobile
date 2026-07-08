import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
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
 */
export function useCreateAppointmentSubmitPanel({
  step,
  appointmentConfirmed,
  isMutationPending,
  confirmRequested = false,
  customerPhone,
}) {
  const [submitError, setSubmitError] = useState(null);

  const isSubmitting = isMutationPending;
  const showSubmitPanel =
    step === CREATE_APPOINTMENT_STEP.REVIEW &&
    !appointmentConfirmed &&
    (confirmRequested || isSubmitting || Boolean(submitError));

  const hasCustomerPhone = Boolean(String(customerPhone ?? '').trim());

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const handleMutationError = useCallback((error) => {
    setSubmitError(
      safeUserFacingMessage(error, { fallback: CREATE_APPOINTMENT_SUBMIT_ERROR_FALLBACK }),
    );
  }, []);

  const hadSubmitErrorRef = useRef(false);
  useEffect(() => {
    const hasError = Boolean(submitError);
    if (hasError && !hadSubmitErrorRef.current) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
    hadSubmitErrorRef.current = hasError;
  }, [submitError]);

  return {
    clearSubmitError,
    handleMutationError,
    hasCustomerPhone,
    isSubmitting,
    showSubmitPanel,
    submitError,
  };
}
